const prisma = require('../config/database');
const { paginationHelper, buildPaginationResponse, generateSKU } = require('../utils/helpers');

const getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search, categoryId, isActive } = req.query;
        const { skip, take } = paginationHelper(page, limit);

        const where = {};

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { sku: { contains: search } },
                { barcode: { contains: search } },
            ];
        }

        if (categoryId) where.categoryId = parseInt(categoryId);
        if (isActive !== undefined) where.isActive = isActive === 'true';

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take,
                include: {
                    category: { select: { id: true, name: true } },
                    variants: {
                        select: {
                            id: true,
                            size: true,
                            color: true,
                            sku: true,
                            price: true,
                        },
                    },
                    _count: { select: { variants: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.product.count({ where }),
        ]);

        res.json({
            success: true,
            ...buildPaginationResponse(products, total, page, limit),
        });
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                category: { select: { id: true, name: true } },
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
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'المنتج غير موجود',
            });
        }

        res.json({
            success: true,
            data: product,
        });
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const { name, sku, barcode, categoryId, basePrice, costPrice, description, image, variants } = req.body;

        // Check if SKU exists
        if (sku) {
            const existingSku = await prisma.product.findUnique({ where: { sku } });
            if (existingSku) {
                return res.status(400).json({
                    success: false,
                    message: 'رمز المنتج (SKU) مستخدم بالفعل',
                });
            }
        }

        const product = await prisma.product.create({
            data: {
                name,
                sku: sku || generateSKU('PRD', name),
                barcode,
                categoryId: parseInt(categoryId),
                basePrice: parseFloat(basePrice) || 0,
                costPrice: parseFloat(costPrice) || 0,
                description,
                image,
                variants: variants?.length ? {
                    create: variants.map((v, index) => ({
                        size: v.size,
                        color: v.color,
                        sku: v.sku || `${sku || generateSKU('PRD', name)}-V${index + 1}`,
                        barcode: v.barcode,
                        price: parseFloat(v.price) || parseFloat(basePrice) || 0,
                        costPrice: parseFloat(v.costPrice) || parseFloat(costPrice) || 0,
                    })),
                } : undefined,
            },
            include: {
                variants: true,
                category: { select: { id: true, name: true } },
            },
        });

        res.status(201).json({
            success: true,
            message: 'تم إنشاء المنتج بنجاح',
            data: product,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const { name, sku, barcode, categoryId, basePrice, costPrice, description, image, isActive } = req.body;
        const productId = parseInt(req.params.id);

        const existingProduct = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: 'المنتج غير موجود',
            });
        }

        // Check if new SKU conflicts
        if (sku && sku !== existingProduct.sku) {
            const skuExists = await prisma.product.findUnique({ where: { sku } });
            if (skuExists) {
                return res.status(400).json({
                    success: false,
                    message: 'رمز المنتج (SKU) مستخدم بالفعل',
                });
            }
        }

        const product = await prisma.product.update({
            where: { id: productId },
            data: {
                name,
                sku,
                barcode,
                categoryId: categoryId ? parseInt(categoryId) : undefined,
                basePrice: basePrice !== undefined ? parseFloat(basePrice) : undefined,
                costPrice: costPrice !== undefined ? parseFloat(costPrice) : undefined,
                description,
                image,
                isActive,
            },
            include: {
                variants: true,
                category: { select: { id: true, name: true } },
            },
        });

        res.json({
            success: true,
            message: 'تم تحديث المنتج بنجاح',
            data: product,
        });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        const productId = parseInt(req.params.id);

        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'المنتج غير موجود',
            });
        }

        // Soft delete
        await prisma.product.update({
            where: { id: productId },
            data: { isActive: false },
        });

        res.json({
            success: true,
            message: 'تم حذف المنتج بنجاح',
        });
    } catch (error) {
        next(error);
    }
};

// Variant management
const addVariant = async (req, res, next) => {
    try {
        const productId = parseInt(req.params.id);
        const { size, color, sku, barcode, price, costPrice } = req.body;

        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'المنتج غير موجود',
            });
        }

        const variant = await prisma.productVariant.create({
            data: {
                productId,
                size,
                color,
                sku: sku || `${product.sku}-${size || 'V'}${color ? `-${color.slice(0, 3)}` : ''}`,
                barcode,
                price: parseFloat(price) || product.basePrice,
                costPrice: parseFloat(costPrice) || product.costPrice,
            },
        });

        res.status(201).json({
            success: true,
            message: 'تم إضافة المتغير بنجاح',
            data: variant,
        });
    } catch (error) {
        next(error);
    }
};

const updateVariant = async (req, res, next) => {
    try {
        const variantId = parseInt(req.params.variantId);
        const { size, color, sku, barcode, price, costPrice, isActive } = req.body;

        const variant = await prisma.productVariant.update({
            where: { id: variantId },
            data: {
                size,
                color,
                sku,
                barcode,
                price: price !== undefined ? parseFloat(price) : undefined,
                costPrice: costPrice !== undefined ? parseFloat(costPrice) : undefined,
                isActive,
            },
        });

        res.json({
            success: true,
            message: 'تم تحديث المتغير بنجاح',
            data: variant,
        });
    } catch (error) {
        next(error);
    }
};

const removeVariant = async (req, res, next) => {
    try {
        const variantId = parseInt(req.params.variantId);

        await prisma.productVariant.update({
            where: { id: variantId },
            data: { isActive: false },
        });

        res.json({
            success: true,
            message: 'تم حذف المتغير بنجاح',
        });
    } catch (error) {
        next(error);
    }
};

const searchByBarcode = async (req, res, next) => {
    try {
        const { barcode } = req.params;

        const variant = await prisma.productVariant.findFirst({
            where: {
                OR: [
                    { barcode },
                    { sku: barcode },
                ],
                isActive: true,
            },
            include: {
                product: {
                    include: {
                        category: { select: { id: true, name: true } },
                    },
                },
            },
        });

        if (!variant) {
            // Try product barcode
            const product = await prisma.product.findFirst({
                where: {
                    OR: [
                        { barcode },
                        { sku: barcode },
                    ],
                    isActive: true,
                },
                include: {
                    category: { select: { id: true, name: true } },
                    variants: { where: { isActive: true } },
                },
            });

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: 'المنتج غير موجود',
                });
            }

            return res.json({
                success: true,
                data: { product, variant: product.variants[0] || null },
            });
        }

        res.json({
            success: true,
            data: { product: variant.product, variant },
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
    addVariant,
    updateVariant,
    removeVariant,
    searchByBarcode,
};
