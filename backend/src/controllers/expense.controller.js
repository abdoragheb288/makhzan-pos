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

        const where = {};
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

        const expense = await prisma.expense.update({
            where: { id: parseInt(req.params.id) },
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
        await prisma.expense.delete({
            where: { id: parseInt(req.params.id) },
        });

        res.json({ success: true, message: 'تم حذف المصروف' });
    } catch (error) {
        next(error);
    }
};

const getSummary = async (req, res, next) => {
    try {
        const { branchId, startDate, endDate } = req.query;

        const where = {};
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
