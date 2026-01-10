const prisma = require('../config/database');

const getStats = async (req, res, next) => {
    try {
        const branchId = req.user.branchId;
        const userRole = req.user.role;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const where = {};
        if (branchId && userRole !== 'ADMIN') {
            where.branchId = branchId;
        }

        // Today's sales
        const todaySales = await prisma.sale.aggregate({
            where: {
                ...where,
                createdAt: { gte: today },
            },
            _sum: { total: true },
            _count: true,
        });

        // Yesterday's sales for comparison
        const yesterdaySales = await prisma.sale.aggregate({
            where: {
                ...where,
                createdAt: { gte: yesterday, lt: today },
            },
            _sum: { total: true },
            _count: true,
        });

        // This week sales
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weeklySales = await prisma.sale.aggregate({
            where: {
                ...where,
                createdAt: { gte: weekStart },
            },
            _sum: { total: true },
            _count: true,
        });

        // Monthly sales
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthlySales = await prisma.sale.aggregate({
            where: {
                ...where,
                createdAt: { gte: monthStart },
            },
            _sum: { total: true },
            _count: true,
        });

        // Products count
        const productsCount = await prisma.product.count({
            where: { isActive: true },
        });

        // Low stock count
        const inventoryWhere = {};
        if (branchId && userRole !== 'ADMIN') {
            inventoryWhere.branchId = branchId;
        }

        const allInventory = await prisma.inventory.findMany({
            where: inventoryWhere,
            select: { quantity: true, minStock: true },
        });
        const lowStockCount = allInventory.filter(
            (i) => i.quantity <= i.minStock
        ).length;

        // Branches count
        const branchesCount = await prisma.branch.count({
            where: { isActive: true },
        });

        // Pending transfers
        const pendingTransfers = await prisma.stockTransfer.count({
            where: {
                status: 'PENDING',
                ...(branchId && userRole !== 'ADMIN'
                    ? { OR: [{ fromBranchId: branchId }, { toBranchId: branchId }] }
                    : {}),
            },
        });

        // Calculate growth percentage
        const todayTotal = todaySales._sum.total || 0;
        const yesterdayTotal = yesterdaySales._sum.total || 0;
        const growthPercent = yesterdayTotal > 0
            ? Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100)
            : 0;

        // Average invoice value
        const avgInvoiceValue = todaySales._count > 0
            ? Math.round(todayTotal / todaySales._count)
            : 0;

        res.json({
            success: true,
            data: {
                todaySales: {
                    total: todayTotal,
                    count: todaySales._count,
                    avgInvoice: avgInvoiceValue,
                    growthPercent,
                },
                yesterdaySales: {
                    total: yesterdayTotal,
                    count: yesterdaySales._count,
                },
                weeklySales: {
                    total: weeklySales._sum.total || 0,
                    count: weeklySales._count,
                },
                monthlySales: {
                    total: monthlySales._sum.total || 0,
                    count: monthlySales._count,
                },
                productsCount,
                lowStockCount,
                branchesCount,
                pendingTransfers,
            },
        });
    } catch (error) {
        next(error);
    }
};

const getRecentSales = async (req, res, next) => {
    try {
        const branchId = req.user.branchId;
        const userRole = req.user.role;

        const where = {};
        if (branchId && userRole !== 'ADMIN') {
            where.branchId = branchId;
        }

        const sales = await prisma.sale.findMany({
            where,
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true } },
                branch: { select: { name: true } },
                _count: { select: { items: true } },
            },
        });

        res.json({
            success: true,
            data: sales,
        });
    } catch (error) {
        next(error);
    }
};

const getSalesChart = async (req, res, next) => {
    try {
        const branchId = req.user.branchId;
        const userRole = req.user.role;
        const { days = 7 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        startDate.setHours(0, 0, 0, 0);

        const where = {
            createdAt: { gte: startDate },
        };
        if (branchId && userRole !== 'ADMIN') {
            where.branchId = branchId;
        }

        const sales = await prisma.sale.findMany({
            where,
            select: { total: true, createdAt: true },
            orderBy: { createdAt: 'asc' },
        });

        // Group by day
        const grouped = {};
        for (let i = 0; i <= parseInt(days); i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const key = date.toISOString().split('T')[0];
            grouped[key] = { date: key, total: 0, count: 0 };
        }

        sales.forEach((sale) => {
            const key = sale.createdAt.toISOString().split('T')[0];
            if (grouped[key]) {
                grouped[key].total += parseFloat(sale.total);
                grouped[key].count += 1;
            }
        });

        res.json({
            success: true,
            data: Object.values(grouped),
        });
    } catch (error) {
        next(error);
    }
};

const getLowStockAlerts = async (req, res, next) => {
    try {
        const branchId = req.user.branchId;
        const userRole = req.user.role;

        const where = {};
        if (branchId && userRole !== 'ADMIN') {
            where.branchId = branchId;
        }

        const inventory = await prisma.inventory.findMany({
            where,
            include: {
                variant: {
                    include: {
                        product: { select: { id: true, name: true, sku: true } },
                    },
                },
                branch: { select: { id: true, name: true } },
            },
        });

        const lowStock = inventory
            .filter((i) => i.quantity <= i.minStock)
            .slice(0, 10);

        res.json({
            success: true,
            data: lowStock,
        });
    } catch (error) {
        next(error);
    }
};

const getTopProducts = async (req, res, next) => {
    try {
        const branchId = req.user.branchId;
        const userRole = req.user.role;
        const { days = 30, limit = 5 } = req.query;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));

        const where = {
            sale: {
                createdAt: { gte: startDate },
            },
        };
        if (branchId && userRole !== 'ADMIN') {
            where.sale = { ...where.sale, branchId };
        }

        // Get all sale items in the period
        const saleItems = await prisma.saleItem.findMany({
            where,
            include: {
                variant: {
                    include: {
                        product: { select: { id: true, name: true, sku: true, imageUrl: true } },
                    },
                },
            },
        });

        // Aggregate by product
        const productSales = {};
        saleItems.forEach((item) => {
            const productId = item.variant.product.id;
            if (!productSales[productId]) {
                productSales[productId] = {
                    product: item.variant.product,
                    totalQuantity: 0,
                    totalRevenue: 0,
                };
            }
            productSales[productId].totalQuantity += item.quantity;
            productSales[productId].totalRevenue += parseFloat(item.total);
        });

        // Sort by quantity and get top N
        const topProducts = Object.values(productSales)
            .sort((a, b) => b.totalQuantity - a.totalQuantity)
            .slice(0, parseInt(limit));

        res.json({
            success: true,
            data: topProducts,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStats,
    getRecentSales,
    getSalesChart,
    getLowStockAlerts,
    getTopProducts,
};
