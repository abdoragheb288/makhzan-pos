const prisma = require('../config/database');
const { paginationHelper, buildPaginationResponse } = require('../utils/helpers');

const getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, isActive } = req.query;
        const { skip, take } = paginationHelper(page, limit);

        const where = {};
        if (isActive === 'true') where.isActive = true;
        if (isActive === 'false') where.isActive = false;

        const [discounts, total] = await Promise.all([
            prisma.discount.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.discount.count({ where }),
        ]);

        res.json({
            success: true,
            ...buildPaginationResponse(discounts, total, page, limit),
        });
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const discount = await prisma.discount.findUnique({
            where: { id: parseInt(req.params.id) },
        });

        if (!discount) {
            return res.status(404).json({ success: false, message: 'الخصم غير موجود' });
        }

        res.json({ success: true, data: discount });
    } catch (error) {
        next(error);
    }
};

const getByCode = async (req, res, next) => {
    try {
        const { code } = req.params;

        const discount = await prisma.discount.findUnique({
            where: { code },
        });

        if (!discount) {
            return res.status(404).json({ success: false, message: 'الكوبون غير صالح' });
        }

        // Check if active
        if (!discount.isActive) {
            return res.status(400).json({ success: false, message: 'الكوبون غير نشط' });
        }

        // Check dates
        const now = new Date();
        if (discount.startDate && discount.startDate > now) {
            return res.status(400).json({ success: false, message: 'الكوبون لم يبدأ بعد' });
        }
        if (discount.endDate && discount.endDate < now) {
            return res.status(400).json({ success: false, message: 'الكوبون منتهي الصلاحية' });
        }

        // Check usage limit
        if (discount.maxUses && discount.usedCount >= discount.maxUses) {
            return res.status(400).json({ success: false, message: 'تم استخدام الكوبون الحد الأقصى من المرات' });
        }

        res.json({ success: true, data: discount });
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const { name, code, type, value, minPurchase, maxUses, startDate, endDate } = req.body;

        const discount = await prisma.discount.create({
            data: {
                name,
                code: code || null,
                type, // PERCENTAGE or AMOUNT
                value: parseFloat(value),
                minPurchase: minPurchase ? parseFloat(minPurchase) : null,
                maxUses: maxUses ? parseInt(maxUses) : null,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
            },
        });

        res.status(201).json({
            success: true,
            message: 'تم إنشاء الخصم بنجاح',
            data: discount,
        });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'كود الخصم موجود بالفعل' });
        }
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const { name, type, value, minPurchase, maxUses, startDate, endDate, isActive } = req.body;

        const discount = await prisma.discount.update({
            where: { id: parseInt(req.params.id) },
            data: {
                name,
                type,
                value: parseFloat(value),
                minPurchase: minPurchase ? parseFloat(minPurchase) : null,
                maxUses: maxUses ? parseInt(maxUses) : null,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                isActive,
            },
        });

        res.json({
            success: true,
            message: 'تم تحديث الخصم',
            data: discount,
        });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        await prisma.discount.delete({
            where: { id: parseInt(req.params.id) },
        });

        res.json({ success: true, message: 'تم حذف الخصم' });
    } catch (error) {
        next(error);
    }
};

const incrementUsage = async (req, res, next) => {
    try {
        const discount = await prisma.discount.update({
            where: { id: parseInt(req.params.id) },
            data: { usedCount: { increment: 1 } },
        });

        res.json({ success: true, data: discount });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll,
    getById,
    getByCode,
    create,
    update,
    remove,
    incrementUsage,
};
