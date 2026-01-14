/**
 * Table Controller
 * CRUD operations for restaurant/cafe tables
 * Only available for business types: restaurant, cafe
 */

const prisma = require('../config/database');
const { paginationHelper, buildPaginationResponse } = require('../utils/helpers');

/**
 * Get all tables for the tenant's branch
 */
const getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 50, branchId, status } = req.query;
        const { skip, take } = paginationHelper(page, limit);

        const where = {
            tenantId: req.user.tenantId,
        };

        if (branchId) {
            where.branchId = parseInt(branchId);
        }

        if (status) {
            where.status = status;
        }

        const [tables, total] = await Promise.all([
            prisma.restaurantTable.findMany({
                where,
                skip,
                take,
                orderBy: { position: 'asc' },
                include: {
                    branch: {
                        select: { id: true, name: true },
                    },
                    orders: {
                        where: { status: { notIn: ['paid', 'cancelled'] } },
                        select: {
                            id: true,
                            orderNumber: true,
                            status: true,
                            total: true,
                            createdAt: true,
                        },
                    },
                },
            }),
            prisma.restaurantTable.count({ where }),
        ]);

        // Add active order info to each table
        const tablesWithActiveOrder = tables.map(table => ({
            ...table,
            activeOrder: table.orders[0] || null,
            hasActiveOrder: table.orders.length > 0,
        }));

        res.json({
            success: true,
            ...buildPaginationResponse(tablesWithActiveOrder, total, page, limit),
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get a single table by ID
 */
const getById = async (req, res, next) => {
    try {
        const table = await prisma.restaurantTable.findFirst({
            where: {
                id: parseInt(req.params.id),
                tenantId: req.user.tenantId,
            },
            include: {
                branch: true,
                orders: {
                    where: { status: { notIn: ['paid', 'cancelled'] } },
                    include: {
                        items: {
                            include: {
                                product: { select: { id: true, name: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!table) {
            return res.status(404).json({
                success: false,
                message: 'الطاولة غير موجودة',
            });
        }

        res.json({
            success: true,
            data: table,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new table
 */
const create = async (req, res, next) => {
    try {
        const { name, branchId, capacity, position } = req.body;

        // Validate branch belongs to tenant
        const branch = await prisma.branch.findFirst({
            where: {
                id: parseInt(branchId),
                tenantId: req.user.tenantId,
            },
        });

        if (!branch) {
            return res.status(400).json({
                success: false,
                message: 'الفرع غير موجود',
            });
        }

        // Check for duplicate table name in same branch
        const existing = await prisma.restaurantTable.findFirst({
            where: {
                name,
                branchId: parseInt(branchId),
                tenantId: req.user.tenantId,
            },
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'اسم الطاولة موجود بالفعل في هذا الفرع',
            });
        }

        const table = await prisma.restaurantTable.create({
            data: {
                name,
                branchId: parseInt(branchId),
                tenantId: req.user.tenantId,
                capacity: parseInt(capacity) || 4,
                position: position ? parseInt(position) : 0,
            },
            include: {
                branch: { select: { id: true, name: true } },
            },
        });

        res.status(201).json({
            success: true,
            message: 'تم إنشاء الطاولة بنجاح',
            data: table,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update a table
 */
const update = async (req, res, next) => {
    try {
        const { name, capacity, position, status, isActive } = req.body;
        const tableId = parseInt(req.params.id);

        // Verify table belongs to tenant
        const existing = await prisma.restaurantTable.findFirst({
            where: {
                id: tableId,
                tenantId: req.user.tenantId,
            },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'الطاولة غير موجودة',
            });
        }

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (capacity !== undefined) updateData.capacity = parseInt(capacity);
        if (position !== undefined) updateData.position = parseInt(position);
        if (status !== undefined) updateData.status = status;
        if (isActive !== undefined) updateData.isActive = isActive;

        const table = await prisma.restaurantTable.update({
            where: { id: tableId },
            data: updateData,
            include: {
                branch: { select: { id: true, name: true } },
            },
        });

        res.json({
            success: true,
            message: 'تم تحديث الطاولة',
            data: table,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update table status only
 */
const updateStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const tableId = parseInt(req.params.id);

        // Validate status
        const validStatuses = ['available', 'occupied', 'reserved'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'حالة غير صالحة',
            });
        }

        // Verify table belongs to tenant
        const existing = await prisma.restaurantTable.findFirst({
            where: {
                id: tableId,
                tenantId: req.user.tenantId,
            },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'الطاولة غير موجودة',
            });
        }

        const table = await prisma.restaurantTable.update({
            where: { id: tableId },
            data: { status },
        });

        res.json({
            success: true,
            message: 'تم تحديث حالة الطاولة',
            data: table,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a table
 */
const remove = async (req, res, next) => {
    try {
        const tableId = parseInt(req.params.id);

        // Verify table belongs to tenant
        const existing = await prisma.restaurantTable.findFirst({
            where: {
                id: tableId,
                tenantId: req.user.tenantId,
            },
            include: {
                orders: {
                    where: { status: { notIn: ['paid', 'cancelled'] } },
                },
            },
        });

        if (!existing) {
            return res.status(404).json({
                success: false,
                message: 'الطاولة غير موجودة',
            });
        }

        // Don't delete if there are active orders
        if (existing.orders.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'لا يمكن حذف طاولة بها طلبات نشطة',
            });
        }

        await prisma.restaurantTable.delete({
            where: { id: tableId },
        });

        res.json({
            success: true,
            message: 'تم حذف الطاولة',
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
    updateStatus,
    remove,
};
