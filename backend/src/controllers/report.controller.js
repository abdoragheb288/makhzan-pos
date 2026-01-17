const prisma = require('../config/database');

/**
 * Get Sales Summary with tenant isolation
 * All queries filter by tenantId from authenticated user
 */
const getSalesSummary = async (req, res, next) => {
    try {
        const { branchId, startDate, endDate, period = 'day' } = req.query;
        const tenantId = req.user.tenantId;

        // Base filter: tenant isolation via branch
        const where = {
            branch: { tenantId }
        };
        if (branchId) where.branchId = parseInt(branchId);

        const now = new Date();
        let start, end;

        switch (period) {
            case 'today':
                start = new Date(now.setHours(0, 0, 0, 0));
                end = new Date();
                break;
            case 'week':
                start = new Date(now.setDate(now.getDate() - 7));
                end = new Date();
                break;
            case 'month':
                start = new Date(now.setMonth(now.getMonth() - 1));
                end = new Date();
                break;
            case 'year':
                start = new Date(now.setFullYear(now.getFullYear() - 1));
                end = new Date();
                break;
            default:
                if (startDate) start = new Date(startDate);
                if (endDate) end = new Date(endDate);
        }

        if (start) where.createdAt = { gte: start };
        if (end) where.createdAt = { ...where.createdAt, lte: end };

        const sales = await prisma.sale.aggregate({
            where,
            _sum: { total: true, discount: true, tax: true },
            _count: true,
            _avg: { total: true },
        });

        res.json({
            success: true,
            data: {
                totalSales: sales._sum.total || 0,
                totalDiscount: sales._sum.discount || 0,
                totalTax: sales._sum.tax || 0,
                salesCount: sales._count,
                averageSale: sales._avg.total || 0,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Sales by Period with tenant isolation
 */
const getSalesByPeriod = async (req, res, next) => {
    try {
        const { branchId, period = 'daily', days = 30 } = req.query;
        const tenantId = req.user.tenantId;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        // Tenant isolation via branch
        const where = {
            createdAt: { gte: startDate },
            branch: { tenantId }
        };
        if (branchId) where.branchId = parseInt(branchId);

        const sales = await prisma.sale.findMany({
            where,
            select: {
                total: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
        });

        // Group by date
        const grouped = {};
        sales.forEach((sale) => {
            let key;
            if (period === 'daily') {
                key = sale.createdAt.toISOString().split('T')[0];
            } else if (period === 'weekly') {
                const weekStart = new Date(sale.createdAt);
                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                key = weekStart.toISOString().split('T')[0];
            } else {
                key = `${sale.createdAt.getFullYear()}-${(sale.createdAt.getMonth() + 1).toString().padStart(2, '0')}`;
            }

            if (!grouped[key]) {
                grouped[key] = { date: key, total: 0, count: 0 };
            }
            grouped[key].total += parseFloat(sale.total);
            grouped[key].count += 1;
        });

        res.json({
            success: true,
            data: Object.values(grouped),
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Top Products with tenant isolation
 */
const getTopProducts = async (req, res, next) => {
    try {
        const { branchId, limit = 10, startDate, endDate } = req.query;
        const tenantId = req.user.tenantId;

        // Tenant isolation via sale -> branch
        const where = {
            sale: {
                branch: { tenantId }
            }
        };
        if (branchId) where.sale.branchId = parseInt(branchId);
        if (startDate || endDate) {
            where.sale.createdAt = {};
            if (startDate) where.sale.createdAt.gte = new Date(startDate);
            if (endDate) where.sale.createdAt.lte = new Date(endDate);
        }

        const topProducts = await prisma.saleItem.groupBy({
            by: ['variantId'],
            where,
            _sum: { quantity: true, total: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: parseInt(limit),
        });

        // Get product details
        const variantIds = topProducts.map((p) => p.variantId);
        const variants = await prisma.productVariant.findMany({
            where: { id: { in: variantIds } },
            include: {
                product: { select: { id: true, name: true, sku: true, image: true } },
            },
        });

        const result = topProducts.map((p) => {
            const variant = variants.find((v) => v.id === p.variantId);
            return {
                variantId: p.variantId,
                product: variant?.product,
                size: variant?.size,
                color: variant?.color,
                totalQuantity: p._sum.quantity,
                totalRevenue: p._sum.total,
            };
        });

        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Inventory Report with tenant isolation
 */
const getInventoryReport = async (req, res, next) => {
    try {
        const { branchId, categoryId, lowStock } = req.query;
        const tenantId = req.user.tenantId;

        // Tenant isolation via branch
        const where = {
            branch: { tenantId }
        };
        if (branchId) where.branchId = parseInt(branchId);

        const inventory = await prisma.inventory.findMany({
            where,
            include: {
                variant: {
                    include: {
                        product: {
                            select: { id: true, name: true, sku: true, categoryId: true },
                        },
                    },
                },
                branch: { select: { id: true, name: true } },
            },
        });

        let result = inventory;

        if (categoryId) {
            result = result.filter(
                (i) => i.variant.product.categoryId === parseInt(categoryId)
            );
        }

        if (lowStock === 'true') {
            result = result.filter((i) => i.quantity <= i.minStock);
        }

        // Calculate totals
        const summary = {
            totalItems: result.length,
            totalQuantity: result.reduce((sum, i) => sum + i.quantity, 0),
            lowStockCount: result.filter((i) => i.quantity <= i.minStock).length,
            outOfStockCount: result.filter((i) => i.quantity === 0).length,
        };

        res.json({
            success: true,
            data: { items: result, summary },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Branch Performance with tenant isolation
 */
const getBranchPerformance = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const tenantId = req.user.tenantId;

        const saleWhere = {};
        if (startDate || endDate) {
            saleWhere.createdAt = {};
            if (startDate) saleWhere.createdAt.gte = new Date(startDate);
            if (endDate) saleWhere.createdAt.lte = new Date(endDate);
        }

        // Only get branches for current tenant
        const branches = await prisma.branch.findMany({
            where: { isActive: true, tenantId },
            select: { id: true, name: true, isWarehouse: true },
        });

        const performance = await Promise.all(
            branches.map(async (branch) => {
                const sales = await prisma.sale.aggregate({
                    where: { ...saleWhere, branchId: branch.id },
                    _sum: { total: true },
                    _count: true,
                });

                return {
                    branch,
                    totalSales: sales._sum.total || 0,
                    salesCount: sales._count,
                };
            })
        );

        res.json({
            success: true,
            data: performance.sort((a, b) => b.totalSales - a.totalSales),
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Supplier Report with tenant isolation
 */
const getSupplierReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const tenantId = req.user.tenantId;

        const purchaseWhere = {};
        if (startDate || endDate) {
            purchaseWhere.createdAt = {};
            if (startDate) purchaseWhere.createdAt.gte = new Date(startDate);
            if (endDate) purchaseWhere.createdAt.lte = new Date(endDate);
        }

        // Only get suppliers for current tenant
        const suppliers = await prisma.supplier.findMany({
            where: { isActive: true, tenantId },
            include: {
                purchaseOrders: {
                    where: purchaseWhere,
                    select: { total: true, status: true },
                },
            },
        });

        const report = suppliers.map((supplier) => ({
            id: supplier.id,
            name: supplier.name,
            phone: supplier.phone,
            totalOrders: supplier.purchaseOrders.length,
            totalAmount: supplier.purchaseOrders.reduce(
                (sum, o) => sum + parseFloat(o.total),
                0
            ),
            pendingOrders: supplier.purchaseOrders.filter(
                (o) => o.status === 'PENDING'
            ).length,
        }));

        res.json({
            success: true,
            data: report,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSalesSummary,
    getSalesByPeriod,
    getTopProducts,
    getInventoryReport,
    getBranchPerformance,
    getSupplierReport,
};
