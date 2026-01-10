const prisma = require('../config/database');
const { paginationHelper, buildPaginationResponse } = require('../utils/helpers');

const getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search, isActive } = req.query;
        const { skip, take } = paginationHelper(page, limit);

        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
                { phone: { contains: search } },
            ];
        }
        if (isActive !== undefined) where.isActive = isActive === 'true';

        const [suppliers, total] = await Promise.all([
            prisma.supplier.findMany({
                where,
                skip,
                take,
                include: {
                    _count: { select: { purchaseOrders: true } },
                },
                orderBy: { name: 'asc' },
            }),
            prisma.supplier.count({ where }),
        ]);

        res.json({
            success: true,
            ...buildPaginationResponse(suppliers, total, page, limit),
        });
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const supplier = await prisma.supplier.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                purchaseOrders: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        status: true,
                        total: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!supplier) {
            return res.status(404).json({
                success: false,
                message: 'المورد غير موجود',
            });
        }

        res.json({
            success: true,
            data: supplier,
        });
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const { name, phone, email, address } = req.body;

        const supplier = await prisma.supplier.create({
            data: { name, phone, email, address },
        });

        res.status(201).json({
            success: true,
            message: 'تم إضافة المورد بنجاح',
            data: supplier,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const { name, phone, email, address, isActive } = req.body;
        const supplierId = parseInt(req.params.id);

        const supplier = await prisma.supplier.update({
            where: { id: supplierId },
            data: { name, phone, email, address, isActive },
        });

        res.json({
            success: true,
            message: 'تم تحديث المورد بنجاح',
            data: supplier,
        });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        const supplierId = parseInt(req.params.id);

        await prisma.supplier.update({
            where: { id: supplierId },
            data: { isActive: false },
        });

        res.json({
            success: true,
            message: 'تم حذف المورد بنجاح',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
};
