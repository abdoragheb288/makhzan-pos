const prisma = require('../config/database');
const { paginationHelper, buildPaginationResponse } = require('../utils/helpers');

// Get all pre-orders
const getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, branchId, status } = req.query;
        const { skip, take } = paginationHelper(page, limit);

        const where = {};
        if (branchId) where.branchId = parseInt(branchId);
        if (status) where.status = status;

        const [preOrders, total] = await Promise.all([
            prisma.preOrder.findMany({
                where,
                skip,
                take,
                include: {
                    branch: { select: { name: true } },
                    variant: {
                        include: {
                            product: { select: { name: true } },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.preOrder.count({ where }),
        ]);

        res.json({
            success: true,
            ...buildPaginationResponse(preOrders, total, page, limit),
        });
    } catch (error) {
        next(error);
    }
};

// Create new pre-order
const create = async (req, res, next) => {
    try {
        const { branchId, variantId, customerName, customerPhone, quantity, notes } = req.body;

        const preOrder = await prisma.preOrder.create({
            data: {
                branchId: parseInt(branchId),
                variantId: parseInt(variantId),
                customerName,
                customerPhone,
                quantity: parseInt(quantity) || 1,
                notes,
            },
        });

        res.status(201).json({
            success: true,
            message: 'تم إنشاء الحجز بنجاح',
            data: preOrder,
        });
    } catch (error) {
        next(error);
    }
};

// Check available pre-orders (items now in stock)
const checkAvailable = async (req, res, next) => {
    try {
        const pendingPreOrders = await prisma.preOrder.findMany({
            where: { status: 'PENDING' },
            include: {
                variant: {
                    include: {
                        product: { select: { name: true } },
                        inventory: true,
                    },
                },
                branch: { select: { name: true } },
            },
        });

        // Filter to those that have stock now
        const available = pendingPreOrders.filter((po) => {
            const branchInventory = po.variant.inventory.find(
                (inv) => inv.branchId === po.branchId
            );
            return branchInventory && branchInventory.quantity >= po.quantity;
        });

        res.json({
            success: true,
            data: available,
            count: available.length,
        });
    } catch (error) {
        next(error);
    }
};

// Mark as notified
const markNotified = async (req, res, next) => {
    try {
        await prisma.preOrder.update({
            where: { id: parseInt(req.params.id) },
            data: {
                status: 'NOTIFIED',
                notifiedAt: new Date(),
            },
        });

        res.json({ success: true, message: 'تم تحديث الحالة' });
    } catch (error) {
        next(error);
    }
};

// Complete pre-order
const complete = async (req, res, next) => {
    try {
        await prisma.preOrder.update({
            where: { id: parseInt(req.params.id) },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
            },
        });

        res.json({ success: true, message: 'تم إتمام الحجز' });
    } catch (error) {
        next(error);
    }
};

// Cancel pre-order
const cancel = async (req, res, next) => {
    try {
        await prisma.preOrder.update({
            where: { id: parseInt(req.params.id) },
            data: { status: 'CANCELLED' },
        });

        res.json({ success: true, message: 'تم إلغاء الحجز' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll,
    create,
    checkAvailable,
    markNotified,
    complete,
    cancel,
};
