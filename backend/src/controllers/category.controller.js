const prisma = require('../config/database');
const { paginationHelper, buildPaginationResponse } = require('../utils/helpers');

const getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search, parentId } = req.query;
        const { skip, take } = paginationHelper(page, limit);

        // Filter by tenantId
        const where = {
            tenantId: req.user.tenantId
        };

        if (search) {
            where.name = { contains: search };
        }

        if (parentId) {
            where.parentId = parseInt(parentId);
        } else if (parentId === 'null') {
            where.parentId = null;
        }

        const [categories, total] = await Promise.all([
            prisma.category.findMany({
                where,
                skip,
                take,
                include: {
                    parent: { select: { id: true, name: true } },
                    _count: { select: { products: true, children: true } },
                },
                orderBy: { name: 'asc' },
            }),
            prisma.category.count({ where }),
        ]);

        res.json({
            success: true,
            ...buildPaginationResponse(categories, total, page, limit),
        });
    } catch (error) {
        next(error);
    }
};

const getTree = async (req, res, next) => {
    try {
        const categories = await prisma.category.findMany({
            where: { parentId: null, tenantId: req.user.tenantId },
            include: {
                children: {
                    include: {
                        children: true,
                        _count: { select: { products: true } },
                    },
                    orderBy: { name: 'asc' },
                },
                _count: { select: { products: true } },
            },
            orderBy: { name: 'asc' },
        });

        res.json({
            success: true,
            data: categories,
        });
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const category = await prisma.category.findFirst({
            where: {
                id: parseInt(req.params.id),
                tenantId: req.user.tenantId
            },
            include: {
                parent: { select: { id: true, name: true } },
                children: { select: { id: true, name: true } },
                _count: { select: { products: true } },
            },
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'التصنيف غير موجود',
            });
        }

        res.json({
            success: true,
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const { name, description, parentId } = req.body;

        const category = await prisma.category.create({
            data: {
                name,
                description,
                parentId: parentId ? parseInt(parentId) : null,
                tenantId: req.user.tenantId, // Assign to current tenant
            },
        });

        res.status(201).json({
            success: true,
            message: 'تم إنشاء التصنيف بنجاح',
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const { name, description, parentId } = req.body;
        const categoryId = parseInt(req.params.id);

        const existingCategory = await prisma.category.findFirst({
            where: { id: categoryId, tenantId: req.user.tenantId },
        });

        if (!existingCategory) {
            return res.status(404).json({
                success: false,
                message: 'التصنيف غير موجود',
            });
        }

        const category = await prisma.category.update({
            where: { id: categoryId },
            data: {
                name,
                description,
                parentId: parentId === null ? null : parentId ? parseInt(parentId) : undefined,
            },
        });

        res.json({
            success: true,
            message: 'تم تحديث التصنيف بنجاح',
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        const categoryId = parseInt(req.params.id);

        const category = await prisma.category.findUnique({
            where: { id: categoryId },
            include: {
                _count: { select: { products: true, children: true } },
            },
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'التصنيف غير موجود',
            });
        }

        if (category._count.products > 0) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن حذف التصنيف لوجود منتجات مرتبطة به',
            });
        }

        if (category._count.children > 0) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن حذف التصنيف لوجود تصنيفات فرعية',
            });
        }

        await prisma.category.delete({
            where: { id: categoryId },
        });

        res.json({
            success: true,
            message: 'تم حذف التصنيف بنجاح',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll,
    getTree,
    getById,
    create,
    update,
    remove,
};
