const prisma = require('../config/database');

// ==================== PRODUCT PROFITABILITY ====================
/**
 * Get Product Profitability with tenant isolation
 * Calculates profit margins for products sold within the tenant
 */
const getProductProfitability = async (req, res, next) => {
    try {
        const { startDate, endDate, branchId, limit = 20 } = req.query;
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

        // Get sale items with costs
        const items = await prisma.saleItem.findMany({
            where,
            include: {
                variant: {
                    include: {
                        product: { select: { id: true, name: true } },
                    },
                },
                sale: { select: { createdAt: true } },
            },
        });

        // Calculate profit per product
        const profitByProduct = {};
        items.forEach((item) => {
            const productId = item.variant.product.id;
            const productName = item.variant.product.name;
            const revenue = parseFloat(item.total);
            const cost = parseFloat(item.variant.costPrice) * item.quantity;
            const profit = revenue - cost;

            if (!profitByProduct[productId]) {
                profitByProduct[productId] = {
                    productId,
                    productName,
                    totalRevenue: 0,
                    totalCost: 0,
                    totalProfit: 0,
                    quantitySold: 0,
                    profitMargin: 0,
                };
            }
            profitByProduct[productId].totalRevenue += revenue;
            profitByProduct[productId].totalCost += cost;
            profitByProduct[productId].totalProfit += profit;
            profitByProduct[productId].quantitySold += item.quantity;
        });

        // Calculate margins and sort by profit
        const result = Object.values(profitByProduct)
            .map((p) => ({
                ...p,
                profitMargin: p.totalRevenue > 0 ? ((p.totalProfit / p.totalRevenue) * 100).toFixed(1) : 0,
            }))
            .sort((a, b) => b.totalProfit - a.totalProfit)
            .slice(0, parseInt(limit));

        res.json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

// ==================== PEAK HOURS ANALYTICS ====================
/**
 * Get Peak Hours with tenant isolation
 * Analyzes sales patterns by hour of day for the tenant
 */
const getPeakHours = async (req, res, next) => {
    try {
        const { startDate, endDate, branchId } = req.query;
        const tenantId = req.user.tenantId;

        // Tenant isolation via branch
        const where = {
            branch: { tenantId }
        };
        if (branchId) where.branchId = parseInt(branchId);
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const sales = await prisma.sale.findMany({
            where,
            select: { createdAt: true, total: true },
        });

        // Aggregate by hour
        const hourlyData = {};
        for (let h = 0; h < 24; h++) {
            hourlyData[h] = { hour: h, sales: 0, revenue: 0 };
        }

        sales.forEach((sale) => {
            const hour = new Date(sale.createdAt).getHours();
            hourlyData[hour].sales += 1;
            hourlyData[hour].revenue += parseFloat(sale.total);
        });

        const result = Object.values(hourlyData);
        const peakHour = result.reduce((max, curr) => (curr.sales > max.sales ? curr : max), result[0]);

        res.json({
            success: true,
            data: {
                hourly: result,
                peakHour: peakHour.hour,
                peakSales: peakHour.sales,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ==================== CENTRAL INVENTORY VIEW ====================
/**
 * Get Central Inventory with tenant isolation
 * Shows inventory across all branches for the tenant
 */
const getCentralInventory = async (req, res, next) => {
    try {
        const { search, categoryId, lowStock } = req.query;
        const tenantId = req.user.tenantId;

        // Tenant isolation on products
        const productWhere = {
            tenantId,
            ...(search && { name: { contains: search, mode: 'insensitive' } }),
            ...(categoryId && { categoryId: parseInt(categoryId) }),
        };

        // Get all products with their variants and inventory across branches
        const products = await prisma.product.findMany({
            where: productWhere,
            include: {
                category: { select: { name: true } },
                variants: {
                    include: {
                        inventory: {
                            include: {
                                branch: { select: { id: true, name: true } },
                            },
                        },
                    },
                },
            },
            take: 50,
        });

        // Transform data
        const result = products.map((product) => {
            const variantsData = product.variants.map((variant) => {
                const branchStock = {};
                let totalStock = 0;

                variant.inventory.forEach((inv) => {
                    branchStock[inv.branch.name] = inv.quantity;
                    totalStock += inv.quantity;
                });

                return {
                    variantId: variant.id,
                    size: variant.size,
                    color: variant.color,
                    sku: variant.sku,
                    price: variant.price,
                    costPrice: variant.costPrice,
                    totalStock,
                    branchStock,
                };
            });

            return {
                productId: product.id,
                productName: product.name,
                category: product.category?.name,
                variants: variantsData,
                totalStock: variantsData.reduce((sum, v) => sum + v.totalStock, 0),
            };
        });

        // Filter low stock if requested
        const finalResult = lowStock === 'true'
            ? result.filter((p) => p.totalStock < 10)
            : result;

        res.json({ success: true, data: finalResult });
    } catch (error) {
        next(error);
    }
};

// ==================== SEASON ALERTS (OLD STOCK) ====================
/**
 * Get Season Alerts with tenant isolation
 * Identifies stale products that haven't sold recently for the tenant
 */
const getSeasonAlerts = async (req, res, next) => {
    try {
        const { daysOld = 90 } = req.query;
        const tenantId = req.user.tenantId;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(daysOld));

        // Tenant isolation on products
        const products = await prisma.product.findMany({
            where: { tenantId },
            include: {
                variants: {
                    include: {
                        saleItems: {
                            orderBy: { sale: { createdAt: 'desc' } },
                            take: 1,
                            include: { sale: { select: { createdAt: true } } },
                        },
                        inventory: {
                            select: {
                                quantity: true,
                                branch: { select: { name: true } }
                            }
                        },
                    },
                },
                category: { select: { name: true } },
            },
        });

        const staleProducts = [];

        products.forEach((product) => {
            product.variants.forEach((variant) => {
                const totalStock = variant.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
                if (totalStock === 0) return; // Skip if no stock

                const lastSale = variant.saleItems[0]?.sale?.createdAt;
                const isStale = !lastSale || new Date(lastSale) < cutoffDate;

                if (isStale) {
                    staleProducts.push({
                        productId: product.id,
                        productName: product.name,
                        category: product.category?.name,
                        variantId: variant.id,
                        size: variant.size,
                        color: variant.color,
                        sku: variant.sku,
                        price: variant.price,
                        totalStock,
                        lastSaleDate: lastSale,
                        daysSinceLastSale: lastSale
                            ? Math.floor((new Date() - new Date(lastSale)) / (1000 * 60 * 60 * 24))
                            : null,
                    });
                }
            });
        });

        // Sort by days since last sale (oldest first)
        staleProducts.sort((a, b) => (b.daysSinceLastSale || 9999) - (a.daysSinceLastSale || 9999));

        res.json({
            success: true,
            data: staleProducts,
            count: staleProducts.length,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProductProfitability,
    getPeakHours,
    getCentralInventory,
    getSeasonAlerts,
};
