const prisma = require('../config/database');
const { paginationHelper, buildPaginationResponse } = require('../utils/helpers');

const getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, branchId, lowStock, search } = req.query;
        const { skip, take } = paginationHelper(page, limit);

        const where = {};

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

        const where = { branchId };
        if (lowStock === 'true') {
            // Will filter after fetch
        }

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

        const inventory = await prisma.$queryRaw`
      SELECT i.*, v.sku as variant_sku, v.size, v.color, 
             p.name as product_name, p.sku as product_sku, p.image,
             b.name as branch_name
      FROM inventory i
      JOIN product_variants v ON i.variant_id = v.id
      JOIN products p ON v.product_id = p.id
      JOIN branches b ON i.branch_id = b.id
      WHERE i.quantity <= i.min_stock
      ${branchId ? prisma.$queryRaw`AND i.branch_id = ${parseInt(branchId)}` : prisma.$queryRaw``}
      ORDER BY i.quantity ASC
    `;

        res.json({
            success: true,
            data: inventory,
        });
    } catch (error) {
        next(error);
    }
};

const adjustStock = async (req, res, next) => {
    try {
        const { items, branchId, reason } = req.body;
        // items: [{ variantId, newQuantity }]

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
