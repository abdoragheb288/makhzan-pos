const prisma = require('../config/database');
const { paginationHelper, buildPaginationResponse } = require('../utils/helpers');

const getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, branchId, lowStock, search } = req.query;
        const { skip, take } = paginationHelper(page, limit);

        // Filter by tenant through branch relation
        const where = {
            branch: {
                tenantId: req.user.tenantId
            }
        };

        if (branchId) where.branchId = parseInt(branchId);
        if (lowStock === 'true') {
            where.quantity = { lte: prisma.inventory.fields.minStock };
        }

        const [inventory, total] = await Promise.all([
            prisma.inventory.findMany({
                where,
                skip,
                take,
                include: {
                    variant: {
                        include: {
                            product: {
                                select: { id: true, name: true, sku: true, image: true },
                            },
                        },
                    },
                    branch: {
                        select: { id: true, name: true, isWarehouse: true },
                    },
                },
                orderBy: { lastUpdated: 'desc' },
            }),
            prisma.inventory.count({ where }),
        ]);

        // Filter by search if provided
        let filteredInventory = inventory;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredInventory = inventory.filter(
                (item) =>
                    item.variant.product.name.toLowerCase().includes(searchLower) ||
                    item.variant.product.sku.toLowerCase().includes(searchLower) ||
                    item.variant.sku.toLowerCase().includes(searchLower)
            );
        }

        res.json({
            success: true,
            ...buildPaginationResponse(filteredInventory, total, page, limit),
        });
    } catch (error) {
        next(error);
    }
};

const getByBranch = async (req, res, next) => {
    try {
        const branchId = parseInt(req.params.branchId);
        const { lowStock } = req.query;

        // Verify branch belongs to tenant
        const branch = await prisma.branch.findFirst({
            where: { id: branchId, tenantId: req.user.tenantId }
        });

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'الفرع غير موجود',
            });
        }

        const where = { branchId };

        const inventory = await prisma.inventory.findMany({
            where,
            include: {
                variant: {
                    include: {
                        product: {
                            select: { id: true, name: true, sku: true, image: true, categoryId: true },
                        },
                    },
                },
            },
            orderBy: { variant: { product: { name: 'asc' } } },
        });

        let result = inventory;
        if (lowStock === 'true') {
            result = inventory.filter((item) => item.quantity <= item.minStock);
        }

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const updateStock = async (req, res, next) => {
    try {
        const { variantId, branchId, quantity, minStock, operation } = req.body;

        // Verify branch belongs to tenant
        const branch = await prisma.branch.findFirst({
            where: { id: parseInt(branchId), tenantId: req.user.tenantId }
        });

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'الفرع غير موجود',
            });
        }

        const existingInventory = await prisma.inventory.findUnique({
            where: {
                variantId_branchId: {
                    variantId: parseInt(variantId),
                    branchId: parseInt(branchId),
                },
            },
        });

        let newQuantity = parseInt(quantity);
        if (existingInventory && operation) {
            if (operation === 'add') {
                newQuantity = existingInventory.quantity + parseInt(quantity);
            } else if (operation === 'subtract') {
                newQuantity = existingInventory.quantity - parseInt(quantity);
                if (newQuantity < 0) newQuantity = 0;
            }
        }

        const inventory = await prisma.inventory.upsert({
            where: {
                variantId_branchId: {
                    variantId: parseInt(variantId),
                    branchId: parseInt(branchId),
                },
            },
            update: {
                quantity: newQuantity,
                minStock: minStock !== undefined ? parseInt(minStock) : undefined,
            },
            create: {
                variantId: parseInt(variantId),
                branchId: parseInt(branchId),
                quantity: newQuantity,
                minStock: minStock ? parseInt(minStock) : 5,
            },
            include: {
                variant: {
                    include: {
                        product: { select: { id: true, name: true } },
                    },
                },
                branch: { select: { id: true, name: true } },
            },
        });

        res.json({
            success: true,
            message: 'تم تحديث المخزون بنجاح',
            data: inventory,
        });
    } catch (error) {
        next(error);
    }
};

const getLowStock = async (req, res, next) => {
    try {
        const { branchId } = req.query;

        // Get all branches for this tenant
        const tenantBranches = await prisma.branch.findMany({
            where: { tenantId: req.user.tenantId },
            select: { id: true }
        });
        const branchIds = tenantBranches.map(b => b.id);

        // Filter low stock items for tenant's branches
        const inventory = await prisma.inventory.findMany({
            where: {
                branchId: branchId ? parseInt(branchId) : { in: branchIds },
                quantity: {
                    lte: 10 // Will compare with minStock in results
                }
            },
            include: {
                variant: {
                    include: {
                        product: { select: { name: true, sku: true, image: true } }
                    }
                },
                branch: { select: { name: true } }
            }
        });

        // Filter only items below their own minStock
        const lowStockItems = inventory.filter(item => item.quantity <= item.minStock);

        res.json({
            success: true,
            data: lowStockItems,
        });
    } catch (error) {
        next(error);
    }
};

const adjustStock = async (req, res, next) => {
    try {
        const { items, branchId, reason } = req.body;
        // items: [{ variantId, newQuantity }]

        // Verify branch belongs to tenant
        const branch = await prisma.branch.findFirst({
            where: { id: parseInt(branchId), tenantId: req.user.tenantId }
        });

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'الفرع غير موجود',
            });
        }

        const results = [];

        for (const item of items) {
            const inventory = await prisma.inventory.upsert({
                where: {
                    variantId_branchId: {
                        variantId: parseInt(item.variantId),
                        branchId: parseInt(branchId),
                    },
                },
                update: { quantity: parseInt(item.newQuantity) },
                create: {
                    variantId: parseInt(item.variantId),
                    branchId: parseInt(branchId),
                    quantity: parseInt(item.newQuantity),
                },
            });
            results.push(inventory);
        }

        // Log the adjustment
        await prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: 'STOCK_ADJUSTMENT',
                entity: 'INVENTORY',
                newData: { items, branchId, reason },
            },
        });

        res.json({
            success: true,
            message: 'تم تعديل المخزون بنجاح',
            data: results,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll,
    getByBranch,
    updateStock,
    getLowStock,
    adjustStock,
};
