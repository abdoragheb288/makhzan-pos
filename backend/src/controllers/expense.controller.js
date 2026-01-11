const prisma = require('../config/database');
const { paginationHelper, buildPaginationResponse } = require('../utils/helpers');

const EXPENSE_CATEGORIES = [
    'إيجار',
    'كهرباء',
    'مياه',
    'رواتب',
    'صيانة',
    'نظافة',
    'تسويق',
    'نقل وشحن',
    'مصروفات إدارية',
    'أخرى',
];

const getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, branchId, category, startDate, endDate } = req.query;
        const { skip, take } = paginationHelper(page, limit);

        // Filter by tenant through branch relation
        const where = {
            branch: {
                tenantId: req.user.tenantId
            }
        };
        if (branchId) where.branchId = parseInt(branchId);
        if (category) where.category = category;
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        const [expenses, total] = await Promise.all([
            prisma.expense.findMany({
                where,
                skip,
                take,
                include: {
                    branch: { select: { name: true } },
                    user: { select: { name: true } },
                },
                orderBy: { date: 'desc' },
            }),
            prisma.expense.count({ where }),
        ]);

        res.json({
            success: true,
            ...buildPaginationResponse(expenses, total, page, limit),
        });
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const { branchId, category, description, amount, date } = req.body;

        // Verify branch belongs to tenant
        const branch = await prisma.branch.findFirst({
            where: { id: parseInt(branchId), tenantId: req.user.tenantId }
        });

        if (!branch) {
            return res.status(400).json({
                success: false,
                message: 'الفرع غير موجود',
            });
        }

        const expense = await prisma.expense.create({
            data: {
                branchId: parseInt(branchId),
                userId: req.user.id,
                category,
                description,
                amount: parseFloat(amount),
                date: date ? new Date(date) : new Date(),
            },
        });

        res.status(201).json({
            success: true,
            message: 'تم تسجيل المصروف بنجاح',
            data: expense,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const { category, description, amount, date } = req.body;
        const expenseId = parseInt(req.params.id);

        // Verify expense belongs to tenant
        const existing = await prisma.expense.findFirst({
            where: {
                id: expenseId,
                branch: { tenantId: req.user.tenantId }
            }
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'المصروف غير موجود',
            });
        }

        const expense = await prisma.expense.update({
            where: { id: expenseId },
            data: {
                category,
                description,
                amount: parseFloat(amount),
                date: date ? new Date(date) : undefined,
            },
        });

        res.json({
            success: true,
            message: 'تم تحديث المصروف',
            data: expense,
        });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        const expenseId = parseInt(req.params.id);

        // Verify expense belongs to tenant
        const existing = await prisma.expense.findFirst({
            where: {
                id: expenseId,
                branch: { tenantId: req.user.tenantId }
            }
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'المصروف غير موجود',
            });
        }

        await prisma.expense.delete({
            where: { id: expenseId },
        });

        res.json({ success: true, message: 'تم حذف المصروف' });
    } catch (error) {
        next(error);
    }
};

const getSummary = async (req, res, next) => {
    try {
        const { branchId, startDate, endDate } = req.query;

        // Filter by tenant through branch
        const where = {
            branch: {
                tenantId: req.user.tenantId
            }
        };
        if (branchId) where.branchId = parseInt(branchId);
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        const expenses = await prisma.expense.findMany({
            where,
            select: { category: true, amount: true },
        });

        // Group by category
        const byCategory = {};
        let total = 0;
        expenses.forEach((e) => {
            const cat = e.category;
            const amt = parseFloat(e.amount);
            byCategory[cat] = (byCategory[cat] || 0) + amt;
            total += amt;
        });

        res.json({
            success: true,
            data: {
                total,
                byCategory,
            },
        });
    } catch (error) {
        next(error);
    }
};

const getCategories = async (req, res) => {
    res.json({ success: true, data: EXPENSE_CATEGORIES });
};

module.exports = {
    getAll,
    create,
    update,
    remove,
    getSummary,
    getCategories,
};
