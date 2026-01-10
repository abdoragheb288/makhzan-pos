const prisma = require('../config/database');
const { paginationHelper, buildPaginationResponse } = require('../utils/helpers');

// Generate unique return number
const generateReturnNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `RET-${year}${month}-${random}`;
};

const getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, branchId } = req.query;
        const { skip, take } = paginationHelper(page, limit);

        const where = {};
        if (branchId) where.branchId = parseInt(branchId);

        const [returns, total] = await Promise.all([
            prisma.return.findMany({
                where,
                skip,
                take,
                include: {
                    sale: { select: { invoiceNumber: true } },
                    branch: { select: { name: true } },
                    user: { select: { name: true } },
                    _count: { select: { items: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.return.count({ where }),
        ]);

        res.json({
            success: true,
            ...buildPaginationResponse(returns, total, page, limit),
        });
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const returnOrder = await prisma.return.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                sale: { select: { invoiceNumber: true, total: true } },
                branch: { select: { name: true } },
                user: { select: { name: true } },
                items: {
                    include: {
                        variant: {
                            include: {
                                product: { select: { name: true, sku: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!returnOrder) {
            return res.status(404).json({ success: false, message: 'المرتجع غير موجود' });
        }

        res.json({ success: true, data: returnOrder });
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const { saleId, branchId, reason, notes, items } = req.body;
        // items: [{ variantId, quantity, unitPrice }]

        const totalRefund = items.reduce((sum, item) => sum + (item.quantity * parseFloat(item.unitPrice)), 0);

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create return record
            const newReturn = await tx.return.create({
                data: {
                    saleId: parseInt(saleId),
                    branchId: parseInt(branchId),
                    userId: req.user.id,
                    returnNumber: generateReturnNumber(),
                    reason,
                    notes,
                    totalRefund,
                    items: {
                        create: items.map(item => ({
                            variantId: parseInt(item.variantId),
                            quantity: parseInt(item.quantity),
                            unitPrice: parseFloat(item.unitPrice),
                            total: parseInt(item.quantity) * parseFloat(item.unitPrice),
                        })),
                    },
                },
                include: {
                    items: true,
                },
            });

            // 2. Return items to inventory
            for (const item of items) {
                await tx.inventory.upsert({
                    where: {
                        variantId_branchId: {
                            variantId: parseInt(item.variantId),
                            branchId: parseInt(branchId),
                        },
                    },
                    update: { quantity: { increment: parseInt(item.quantity) } },
                    create: {
                        variantId: parseInt(item.variantId),
                        branchId: parseInt(branchId),
                        quantity: parseInt(item.quantity),
                        minStock: 5,
                    },
                });
            }

            return newReturn;
        });

        res.status(201).json({
            success: true,
            message: 'تم تسجيل المرتجع بنجاح',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getReturnReasons = async (req, res) => {
    const reasons = [
        'مقاس غير مناسب',
        'لون غير مناسب',
        'عيب في المنتج',
        'المنتج لا يطابق الوصف',
        'تغيير رأي العميل',
        'أخرى',
    ];
    res.json({ success: true, data: reasons });
};

module.exports = {
    getAll,
    getById,
    create,
    getReturnReasons,
};
