const prisma = require('../config/database');
const { paginationHelper, buildPaginationResponse } = require('../utils/helpers');

const getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, supplierId, branchId } = req.query;
        const { skip, take } = paginationHelper(page, limit);

        // Filter by tenant through branch relation
        const where = {
            branch: {
                tenantId: req.user.tenantId
            }
        };
        if (status) where.status = status;
        if (supplierId) where.supplierId = parseInt(supplierId);
        if (branchId) where.branchId = parseInt(branchId);

        const [orders, total] = await Promise.all([
            prisma.purchaseOrder.findMany({
                where,
                skip,
                take,
                include: {
                    supplier: { select: { id: true, name: true } },
                    branch: { select: { id: true, name: true } },
                    createdBy: { select: { id: true, name: true } },
                    _count: { select: { items: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.purchaseOrder.count({ where }),
        ]);

        res.json({
            success: true,
            ...buildPaginationResponse(orders, total, page, limit),
        });
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const order = await prisma.purchaseOrder.findFirst({
            where: {
                id: parseInt(req.params.id),
                branch: {
                    tenantId: req.user.tenantId
                }
            },
            include: {
                supplier: true,
                branch: { select: { id: true, name: true } },
                createdBy: { select: { id: true, name: true } },
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

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'أمر الشراء غير موجود',
            });
        }

        res.json({
            success: true,
            data: order,
        });
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const { supplierId, branchId, items, notes, autoReceive } = req.body;
        // items: [{ variantId, quantity, unitCost }]

        const total = items.reduce(
            (sum, item) => sum + item.quantity * parseFloat(item.unitCost),
            0
        );

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Purchase Order
            const order = await tx.purchaseOrder.create({
                data: {
                    supplierId: parseInt(supplierId),
                    branchId: parseInt(branchId),
                    createdById: req.user.id,
                    total,
                    notes,
                    status: autoReceive ? 'RECEIVED' : 'PENDING',
                    items: {
                        create: items.map((item) => ({
                            variantId: parseInt(item.variantId),
                            quantity: parseInt(item.quantity),
                            unitCost: parseFloat(item.unitCost),
                            received: autoReceive ? parseInt(item.quantity) : 0,
                        })),
                    },
                },
                include: {
                    supplier: { select: { id: true, name: true } },
                    items: true,
                },
            });

            // 2. If autoReceive, update inventory
            if (autoReceive) {
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
                            minStock: 5, // Default
                        },
                    });
                }
            }

            return order;
        });

        res.status(201).json({
            success: true,
            message: autoReceive ? 'تم إنشاء واستلام أمر الشراء بنجاح' : 'تم إنشاء أمر الشراء بنجاح',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const receive = async (req, res, next) => {
    try {
        const orderId = parseInt(req.params.id);
        const { items } = req.body;
        // items: [{ itemId, receivedQuantity }]

        const order = await prisma.purchaseOrder.findUnique({
            where: { id: orderId },
            include: { items: true },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'أمر الشراء غير موجود',
            });
        }

        // Update received quantities and inventory
        for (const item of items) {
            const orderItem = order.items.find((i) => i.id === item.itemId);
            if (!orderItem) continue;

            // Update purchase item received count
            await prisma.purchaseItem.update({
                where: { id: item.itemId },
                data: { received: { increment: parseInt(item.receivedQuantity) } },
            });

            // Add to inventory
            await prisma.inventory.upsert({
                where: {
                    variantId_branchId: {
                        variantId: orderItem.variantId,
                        branchId: order.branchId,
                    },
                },
                update: { quantity: { increment: parseInt(item.receivedQuantity) } },
                create: {
                    variantId: orderItem.variantId,
                    branchId: order.branchId,
                    quantity: parseInt(item.receivedQuantity),
                },
            });
        }

        // Check if all items are fully received
        const updatedOrder = await prisma.purchaseOrder.findUnique({
            where: { id: orderId },
            include: { items: true },
        });

        const allReceived = updatedOrder.items.every(
            (item) => item.received >= item.quantity
        );
        const someReceived = updatedOrder.items.some((item) => item.received > 0);

        let newStatus = order.status;
        if (allReceived) {
            newStatus = 'RECEIVED';
        } else if (someReceived) {
            newStatus = 'PARTIAL';
        }

        await prisma.purchaseOrder.update({
            where: { id: orderId },
            data: { status: newStatus },
        });

        res.json({
            success: true,
            message: 'تم استلام البضاعة بنجاح',
        });
    } catch (error) {
        next(error);
    }
};

const cancel = async (req, res, next) => {
    try {
        const orderId = parseInt(req.params.id);

        const order = await prisma.purchaseOrder.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'أمر الشراء غير موجود',
            });
        }

        if (order.status === 'RECEIVED') {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن إلغاء أمر شراء مستلم',
            });
        }

        await prisma.purchaseOrder.update({
            where: { id: orderId },
            data: { status: 'CANCELLED' },
        });

        res.json({
            success: true,
            message: 'تم إلغاء أمر الشراء',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll,
    getById,
    create,
    receive,
    cancel,
};
