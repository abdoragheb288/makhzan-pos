const prisma = require('../config/database');
const { paginationHelper, buildPaginationResponse } = require('../utils/helpers');

const getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, branchId, userId, startDate, endDate, paymentMethod } = req.query;
        const { skip, take } = paginationHelper(page, limit);

        const where = {};

        if (branchId) where.branchId = parseInt(branchId);
        if (userId) where.userId = parseInt(userId);
        if (paymentMethod) where.paymentMethod = paymentMethod;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const [sales, total] = await Promise.all([
            prisma.sale.findMany({
                where,
                skip,
                take,
                include: {
                    branch: { select: { id: true, name: true } },
                    user: { select: { id: true, name: true } },
                    _count: { select: { items: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.sale.count({ where }),
        ]);

        res.json({
            success: true,
            ...buildPaginationResponse(sales, total, page, limit),
        });
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const sale = await prisma.sale.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                branch: { select: { id: true, name: true, address: true, phone: true } },
                user: { select: { id: true, name: true } },
                items: {
                    include: {
                        variant: {
                            include: {
                                product: { select: { id: true, name: true, sku: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'الفاتورة غير موجودة',
            });
        }

        res.json({
            success: true,
            data: sale,
        });
    } catch (error) {
        next(error);
    }
};

const getByInvoice = async (req, res, next) => {
    try {
        const sale = await prisma.sale.findUnique({
            where: { invoiceNumber: req.params.invoiceNumber },
            include: {
                branch: { select: { id: true, name: true, address: true, phone: true } },
                user: { select: { id: true, name: true } },
                items: {
                    include: {
                        variant: {
                            include: {
                                product: { select: { id: true, name: true, sku: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'الفاتورة غير موجودة',
            });
        }

        res.json({
            success: true,
            data: sale,
        });
    } catch (error) {
        next(error);
    }
};

const refund = async (req, res, next) => {
    try {
        const saleId = parseInt(req.params.id);
        const { items, reason } = req.body;
        // items: [{ saleItemId, quantity }]

        const sale = await prisma.sale.findUnique({
            where: { id: saleId },
            include: { items: true },
        });

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'الفاتورة غير موجودة',
            });
        }

        // Return items to inventory
        for (const item of items) {
            const saleItem = sale.items.find((i) => i.id === item.saleItemId);
            if (!saleItem) continue;

            await prisma.inventory.upsert({
                where: {
                    variantId_branchId: {
                        variantId: saleItem.variantId,
                        branchId: sale.branchId,
                    },
                },
                update: { quantity: { increment: parseInt(item.quantity) } },
                create: {
                    variantId: saleItem.variantId,
                    branchId: sale.branchId,
                    quantity: parseInt(item.quantity),
                },
            });
        }

        // Log refund
        await prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: 'REFUND',
                entity: 'SALE',
                entityId: saleId,
                newData: { items, reason },
            },
        });

        res.json({
            success: true,
            message: 'تم إرجاع المنتجات بنجاح',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll,
    getById,
    getByInvoice,
    refund,
};
