const prisma = require('../config/database');
const { generateInvoiceNumber } = require('../utils/helpers');

const createSale = async (req, res, next) => {
    try {
        const { items, discount = 0, discountType = 'amount', tax = 0, paymentMethod = 'CASH', paid, notes } = req.body;
        // items: [{ variantId, quantity, unitPrice, discount }]

        const branchId = req.user.branchId;
        if (!branchId) {
            return res.status(400).json({
                success: false,
                message: 'يجب تحديد الفرع للمستخدم',
            });
        }

        // Verify branch belongs to tenant
        const branch = await prisma.branch.findFirst({
            where: { id: branchId, tenantId: req.user.tenantId }
        });

        if (!branch) {
            return res.status(400).json({
                success: false,
                message: 'الفرع غير موجود',
            });
        }

        // Calculate totals
        let subtotal = 0;
        const saleItems = [];

        for (const item of items) {
            const itemTotal = (item.quantity * item.unitPrice) - (item.discount || 0);
            subtotal += itemTotal;

            // Check stock
            const inventory = await prisma.inventory.findUnique({
                where: {
                    variantId_branchId: {
                        variantId: parseInt(item.variantId),
                        branchId: branchId,
                    },
                },
            });

            if (!inventory || inventory.quantity < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `الكمية غير متوفرة للمنتج ${item.variantId}`,
                });
            }

            saleItems.push({
                variantId: parseInt(item.variantId),
                quantity: parseInt(item.quantity),
                unitPrice: parseFloat(item.unitPrice),
                discount: parseFloat(item.discount || 0),
                total: itemTotal,
            });
        }

        // Apply overall discount
        let discountAmount = 0;
        if (discountType === 'percentage') {
            discountAmount = (subtotal * parseFloat(discount)) / 100;
        } else {
            discountAmount = parseFloat(discount);
        }

        const taxAmount = parseFloat(tax);
        const total = subtotal - discountAmount + taxAmount;
        const paidAmount = parseFloat(paid) || total;
        const change = paidAmount - total;

        // Create sale
        const sale = await prisma.sale.create({
            data: {
                branchId,
                userId: req.user.id,
                invoiceNumber: generateInvoiceNumber(),
                subtotal,
                discount: discountAmount,
                discountType,
                tax: taxAmount,
                total,
                paid: paidAmount,
                change: change > 0 ? change : 0,
                paymentMethod,
                notes,
                items: {
                    create: saleItems,
                },
            },
            include: {
                items: {
                    include: {
                        variant: {
                            include: {
                                product: { select: { name: true } },
                            },
                        },
                    },
                },
                user: { select: { name: true } },
                branch: { select: { name: true } },
            },
        });

        // Update inventory
        for (const item of saleItems) {
            await prisma.inventory.update({
                where: {
                    variantId_branchId: {
                        variantId: item.variantId,
                        branchId: branchId,
                    },
                },
                data: {
                    quantity: { decrement: item.quantity },
                },
            });
        }

        res.status(201).json({
            success: true,
            message: 'تم إتمام البيع بنجاح',
            data: sale,
        });
    } catch (error) {
        next(error);
    }
};

const getProducts = async (req, res, next) => {
    try {
        const branchId = req.user.branchId;
        const { search, categoryId } = req.query;
        const tenantId = req.user.tenantId;

        // If user has a specific branchId (cashier), use inventory-based lookup
        // If user is Admin (no branchId), return all products for the tenant
        if (branchId) {
            // Verify branch belongs to tenant
            const branch = await prisma.branch.findFirst({
                where: { id: branchId, tenantId }
            });

            if (!branch) {
                return res.status(400).json({
                    success: false,
                    message: 'الفرع غير موجود',
                });
            }

            const where = {
                branchId,
                quantity: { gt: 0 },
                variant: {
                    isActive: true,
                    product: { isActive: true, tenantId },
                },
            };

            if (categoryId) {
                where.variant = {
                    ...where.variant,
                    product: { ...where.variant.product, categoryId: parseInt(categoryId) },
                };
            }

            const inventory = await prisma.inventory.findMany({
                where,
                include: {
                    variant: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    sku: true,
                                    image: true,
                                    category: { select: { id: true, name: true } },
                                },
                            },
                        },
                    },
                },
            });

            // Group by Product ID
            const productsMap = new Map();

            inventory.forEach((inv) => {
                const product = inv.variant.product;
                if (!productsMap.has(product.id)) {
                    productsMap.set(product.id, {
                        id: product.id,
                        name: product.name,
                        image: product.image,
                        category: product.category,
                        variants: [],
                        totalStock: 0,
                        displayPrice: inv.variant.price
                    });
                }

                const productData = productsMap.get(product.id);
                productData.variants.push({
                    inventoryId: inv.id,
                    variantId: inv.variant.id,
                    sku: inv.variant.sku,
                    size: inv.variant.size,
                    color: inv.variant.color,
                    price: inv.variant.price,
                    costPrice: inv.variant.costPrice,
                    stock: inv.quantity,
                });
                productData.totalStock += inv.quantity;
            });

            let products = Array.from(productsMap.values());

            if (search) {
                const searchLower = search.toLowerCase();
                products = products.filter(
                    (p) =>
                        p.name.toLowerCase().includes(searchLower) ||
                        p.variants.some(v => v.sku.toLowerCase().includes(searchLower))
                );
            }

            return res.json({
                success: true,
                data: products,
            });
        } else {
            // Admin: Get all products for this tenant (for purchase orders, etc.)
            const where = {
                tenantId,
                isActive: true,
            };

            if (categoryId) {
                where.categoryId = parseInt(categoryId);
            }

            if (search) {
                where.OR = [
                    { name: { contains: search } },
                    { sku: { contains: search } },
                ];
            }

            const productsFromDb = await prisma.product.findMany({
                where,
                include: {
                    variants: {
                        where: { isActive: true },
                        select: {
                            id: true,
                            sku: true,
                            size: true,
                            color: true,
                            price: true,
                            costPrice: true,
                        },
                    },
                    category: { select: { id: true, name: true } },
                },
                orderBy: { name: 'asc' },
            });

            // Format for consistency with inventory-based response
            const products = productsFromDb.map(product => ({
                id: product.id,
                name: product.name,
                image: product.image,
                category: product.category,
                variants: product.variants.map(v => ({
                    variantId: v.id,
                    sku: v.sku,
                    size: v.size,
                    color: v.color,
                    price: v.price,
                    costPrice: v.costPrice,
                    stock: 0, // Admin view doesn't need stock for purchase orders
                })),
                displayPrice: product.variants[0]?.price || product.basePrice,
                totalStock: 0,
            }));

            return res.json({
                success: true,
                data: products,
            });
        }
    } catch (error) {
        next(error);
    }
};

const searchByBarcode = async (req, res, next) => {
    try {
        const { barcode } = req.params;
        const branchId = req.user.branchId;
        const tenantId = req.user.tenantId;

        // Find variant by barcode within tenant's products
        const variant = await prisma.productVariant.findFirst({
            where: {
                OR: [{ barcode }, { sku: barcode }],
                isActive: true,
                product: { tenantId },
            },
            include: {
                product: {
                    select: { id: true, name: true, sku: true, image: true },
                },
                inventory: branchId ? {
                    where: { branchId },
                } : undefined,
            },
        });

        if (!variant) {
            return res.status(404).json({
                success: false,
                message: 'المنتج غير موجود',
            });
        }

        const stock = branchId ? (variant.inventory[0]?.quantity || 0) : 0;

        res.json({
            success: true,
            data: {
                variantId: variant.id,
                productId: variant.product.id,
                name: variant.product.name,
                sku: variant.sku,
                size: variant.size,
                color: variant.color,
                price: variant.price,
                image: variant.product.image,
                stock,
            },
        });
    } catch (error) {
        next(error);
    }
};

const getCategories = async (req, res, next) => {
    try {
        // Filter by tenantId
        const categories = await prisma.category.findMany({
            where: { parentId: null, tenantId: req.user.tenantId },
            include: {
                children: {
                    select: { id: true, name: true },
                },
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

module.exports = {
    createSale,
    getProducts,
    searchByBarcode,
    getCategories,
};
