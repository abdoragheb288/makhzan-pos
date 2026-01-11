const prisma = require('../config/database');
const { paginationHelper, buildPaginationResponse } = require('../utils/helpers');

const getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, branchId, isOpen } = req.query;
        const { skip, take } = paginationHelper(page, limit);

        // Filter by tenant through branch relation
        const where = {
            branch: {
                tenantId: req.user.tenantId
            }
        };
        if (branchId) where.branchId = parseInt(branchId);
        if (isOpen === 'true') where.closedAt = null;
        if (isOpen === 'false') where.closedAt = { not: null };

        const [shifts, total] = await Promise.all([
            prisma.shift.findMany({
                where,
                skip,
                take,
                include: {
                    branch: { select: { name: true } },
                    user: { select: { name: true } },
                    _count: { select: { transactions: true } },
                },
                orderBy: { openedAt: 'desc' },
            }),
            prisma.shift.count({ where }),
        ]);

        res.json({
            success: true,
            ...buildPaginationResponse(shifts, total, page, limit),
        });
    } catch (error) {
        next(error);
    }
};

const getCurrent = async (req, res, next) => {
    try {
        // Find the current user's open shift (by userId, not just branchId)
        const openShift = await prisma.shift.findFirst({
            where: {
                userId: req.user.id,
                closedAt: null,
            },
            include: {
                branch: { select: { id: true, name: true } },
                user: { select: { id: true, name: true } },
                transactions: true,
            },
        });

        res.json({ success: true, data: openShift });
    } catch (error) {
        next(error);
    }
};

const open = async (req, res, next) => {
    try {
        const { branchId, openingBalance } = req.body;

        // Check if there's an open shift
        const existingShift = await prisma.shift.findFirst({
            where: {
                branchId: parseInt(branchId),
                closedAt: null,
            },
        });

        if (existingShift) {
            return res.status(400).json({
                success: false,
                message: 'يوجد وردية مفتوحة بالفعل لهذا الفرع',
            });
        }

        const shift = await prisma.shift.create({
            data: {
                branchId: parseInt(branchId),
                userId: req.user.id,
                openingBalance: parseFloat(openingBalance),
            },
        });

        res.status(201).json({
            success: true,
            message: 'تم فتح الوردية بنجاح',
            data: shift,
        });
    } catch (error) {
        next(error);
    }
};

const close = async (req, res, next) => {
    try {
        const { actualCash, notes } = req.body;
        const shiftId = parseInt(req.params.id);

        const shift = await prisma.shift.findUnique({
            where: { id: shiftId },
            include: { transactions: true },
        });

        if (!shift) {
            return res.status(404).json({ success: false, message: 'الوردية غير موجودة' });
        }

        if (shift.closedAt) {
            return res.status(400).json({ success: false, message: 'الوردية مغلقة بالفعل' });
        }

        // Calculate expected cash
        // Get sales during shift
        const sales = await prisma.sale.aggregate({
            where: {
                branchId: shift.branchId,
                paymentMethod: 'CASH',
                createdAt: { gte: shift.openedAt },
            },
            _sum: { total: true },
        });

        const salesTotal = parseFloat(sales._sum.total || 0);
        const transactionsTotal = shift.transactions.reduce((sum, t) => {
            return t.type === 'DEPOSIT' ? sum + parseFloat(t.amount) : sum - parseFloat(t.amount);
        }, 0);

        const expectedCash = parseFloat(shift.openingBalance) + salesTotal + transactionsTotal;
        const difference = parseFloat(actualCash) - expectedCash;

        const closedShift = await prisma.shift.update({
            where: { id: shiftId },
            data: {
                closingBalance: parseFloat(actualCash),
                expectedCash,
                actualCash: parseFloat(actualCash),
                difference,
                notes,
                closedAt: new Date(),
            },
        });

        res.json({
            success: true,
            message: 'تم إغلاق الوردية بنجاح',
            data: closedShift,
        });
    } catch (error) {
        next(error);
    }
};

const addTransaction = async (req, res, next) => {
    try {
        const { type, amount, reason } = req.body;
        const shiftId = parseInt(req.params.id);

        const shift = await prisma.shift.findUnique({
            where: { id: shiftId },
        });

        if (!shift || shift.closedAt) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن إضافة حركة لوردية مغلقة أو غير موجودة',
            });
        }

        const transaction = await prisma.cashTransaction.create({
            data: {
                shiftId,
                type, // DEPOSIT or WITHDRAWAL
                amount: parseFloat(amount),
                reason,
            },
        });

        res.status(201).json({
            success: true,
            message: type === 'DEPOSIT' ? 'تم الإيداع بنجاح' : 'تم السحب بنجاح',
            data: transaction,
        });
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const shift = await prisma.shift.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                branch: { select: { name: true } },
                user: { select: { name: true } },
                transactions: true,
            },
        });

        if (!shift) {
            return res.status(404).json({ success: false, message: 'الوردية غير موجودة' });
        }

        res.json({ success: true, data: shift });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll,
    getCurrent,
    getById,
    open,
    close,
    addTransaction,
};
