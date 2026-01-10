const prisma = require('../config/database');
const { paginationHelper, buildPaginationResponse } = require('../utils/helpers');

// Get all recurring expenses
const getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, branchId, isActive } = req.query;
        const { skip, take } = paginationHelper(page, limit);

        const where = {};
        if (branchId) where.branchId = parseInt(branchId);
        if (isActive !== undefined) where.isActive = isActive === 'true';

        const [expenses, total] = await Promise.all([
            prisma.recurringExpense.findMany({
                where,
                skip,
                take,
                include: { branch: { select: { name: true } } },
                orderBy: { nextDueDate: 'asc' },
            }),
            prisma.recurringExpense.count({ where }),
        ]);

        res.json({
            success: true,
            ...buildPaginationResponse(expenses, total, page, limit),
        });
    } catch (error) {
        next(error);
    }
};

// Create recurring expense
const create = async (req, res, next) => {
    try {
        const { branchId, category, description, amount, frequency, dayOfMonth } = req.body;

        // Calculate next due date
        const nextDueDate = calculateNextDueDate(frequency, dayOfMonth);

        const expense = await prisma.recurringExpense.create({
            data: {
                branchId: parseInt(branchId),
                category,
                description,
                amount: parseFloat(amount),
                frequency,
                dayOfMonth: dayOfMonth ? parseInt(dayOfMonth) : null,
                nextDueDate,
            },
        });

        res.status(201).json({
            success: true,
            message: 'تم إنشاء المصروف المتكرر',
            data: expense,
        });
    } catch (error) {
        next(error);
    }
};

// Get pending (due) expenses
const getPending = async (req, res, next) => {
    try {
        const pending = await prisma.recurringExpense.findMany({
            where: {
                isActive: true,
                nextDueDate: { lte: new Date() },
            },
            include: { branch: { select: { name: true } } },
            orderBy: { nextDueDate: 'asc' },
        });

        res.json({ success: true, data: pending });
    } catch (error) {
        next(error);
    }
};

// Pay recurring expense (creates actual expense and updates next due date)
const payExpense = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);

        const recurring = await prisma.recurringExpense.findUnique({
            where: { id },
        });

        if (!recurring) {
            return res.status(404).json({ success: false, message: 'المصروف غير موجود' });
        }

        const nextDueDate = calculateNextDueDate(recurring.frequency, recurring.dayOfMonth);

        await prisma.$transaction([
            // Create actual expense
            prisma.expense.create({
                data: {
                    branchId: recurring.branchId,
                    userId: req.user.id,
                    category: recurring.category,
                    description: `[تكرار] ${recurring.description || ''}`,
                    amount: recurring.amount,
                    date: new Date(),
                },
            }),
            // Update recurring expense
            prisma.recurringExpense.update({
                where: { id },
                data: {
                    lastPaidAt: new Date(),
                    nextDueDate,
                },
            }),
        ]);

        res.json({ success: true, message: 'تم سداد المصروف وتحديث الموعد القادم' });
    } catch (error) {
        next(error);
    }
};

// Toggle active status
const toggleActive = async (req, res, next) => {
    try {
        const expense = await prisma.recurringExpense.findUnique({
            where: { id: parseInt(req.params.id) },
        });

        await prisma.recurringExpense.update({
            where: { id: parseInt(req.params.id) },
            data: { isActive: !expense.isActive },
        });

        res.json({ success: true, message: 'تم تحديث الحالة' });
    } catch (error) {
        next(error);
    }
};

// Delete
const remove = async (req, res, next) => {
    try {
        await prisma.recurringExpense.delete({
            where: { id: parseInt(req.params.id) },
        });

        res.json({ success: true, message: 'تم الحذف بنجاح' });
    } catch (error) {
        next(error);
    }
};

// Helper: Calculate next due date
function calculateNextDueDate(frequency, dayOfMonth) {
    const now = new Date();
    const next = new Date(now);

    switch (frequency) {
        case 'DAILY':
            next.setDate(next.getDate() + 1);
            break;
        case 'WEEKLY':
            next.setDate(next.getDate() + 7);
            break;
        case 'MONTHLY':
            next.setMonth(next.getMonth() + 1);
            if (dayOfMonth) next.setDate(dayOfMonth);
            break;
        case 'YEARLY':
            next.setFullYear(next.getFullYear() + 1);
            break;
        default:
            next.setMonth(next.getMonth() + 1);
    }

    return next;
}

module.exports = {
    getAll,
    create,
    getPending,
    payExpense,
    toggleActive,
    remove,
};
