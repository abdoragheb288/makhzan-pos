const prisma = require('../config/database');
const { paginationHelper, buildPaginationResponse } = require('../utils/helpers');

const getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search, isWarehouse, isActive } = req.query;
        const { skip, take } = paginationHelper(page, limit);

        // Filter by tenantId for tenant isolation
        const where = {
            tenantId: req.user.tenantId
        };

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { address: { contains: search } },
            ];
        }

        if (isWarehouse !== undefined) where.isWarehouse = isWarehouse === 'true';
        if (isActive !== undefined) where.isActive = isActive === 'true';

        const [branches, total] = await Promise.all([
            prisma.branch.findMany({
                where,
                skip,
                take,
                include: {
                    _count: {
                        select: { users: true, inventory: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.branch.count({ where }),
        ]);

        res.json({
            success: true,
            ...buildPaginationResponse(branches, total, page, limit),
        });
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        // Find branch with tenant verification
        const branch = await prisma.branch.findFirst({
            where: {
                id: parseInt(req.params.id),
                tenantId: req.user.tenantId
            },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                _count: {
                    select: { inventory: true, sales: true },
                },
            },
        });

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'الفرع غير موجود',
            });
        }

        res.json({
            success: true,
            data: branch,
        });
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const { name, address, phone, isWarehouse } = req.body;

        // Create branch with tenantId from authenticated user
        const branch = await prisma.branch.create({
            data: {
                name,
                address,
                phone,
                isWarehouse: isWarehouse || false,
                tenantId: req.user.tenantId, // Assign to current tenant
            },
        });

        res.status(201).json({
            success: true,
            message: 'تم إنشاء الفرع بنجاح',
            data: branch,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const { name, address, phone, isWarehouse, isActive } = req.body;
        const branchId = parseInt(req.params.id);

        // Verify branch belongs to same tenant
        const existingBranch = await prisma.branch.findFirst({
            where: {
                id: branchId,
                tenantId: req.user.tenantId
            },
        });

        if (!existingBranch) {
            return res.status(404).json({
                success: false,
                message: 'الفرع غير موجود',
            });
        }

        const updateData = { name, address, phone, isWarehouse, isActive };
        Object.keys(updateData).forEach(
            (key) => updateData[key] === undefined && delete updateData[key]
        );

        const branch = await prisma.branch.update({
            where: { id: branchId },
            data: updateData,
        });

        res.json({
            success: true,
            message: 'تم تحديث الفرع بنجاح',
            data: branch,
        });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        const branchId = parseInt(req.params.id);

        // Verify branch belongs to same tenant
        const branch = await prisma.branch.findFirst({
            where: {
                id: branchId,
                tenantId: req.user.tenantId
            },
        });

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'الفرع غير موجود',
            });
        }

        // Soft delete
        await prisma.branch.update({
            where: { id: branchId },
            data: { isActive: false },
        });

        res.json({
            success: true,
            message: 'تم حذف الفرع بنجاح',
        });
    } catch (error) {
        next(error);
    }
};

const getWarehouses = async (req, res, next) => {
    try {
        // Filter warehouses by tenantId
        const warehouses = await prisma.branch.findMany({
            where: {
                isWarehouse: true,
                isActive: true,
                tenantId: req.user.tenantId
            },
            select: {
                id: true,
                name: true,
                address: true,
            },
        });

        res.json({
            success: true,
            data: warehouses,
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
    getWarehouses,
};
