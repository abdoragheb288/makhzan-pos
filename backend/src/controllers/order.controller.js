/**
 * Order Controller
 * Restaurant/Cafe order management
 * Orders are converted to Sales (Invoices) upon payment
 */

const prisma = require('../config/database');
const { paginationHelper, buildPaginationResponse } = require('../utils/helpers');

/**
 * Generate unique order number
 */
const generateOrderNumber = async (tenantId) => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

    // Get count of orders today
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const count = await prisma.order.count({
        where: {
            tenantId,
            createdAt: {
                gte: startOfDay,
                lte: endOfDay,
            },
        },
    });

    return `ORD-${dateStr}-${String(count + 1).padStart(4, '0')}`;
};

/**
 * Get all orders
 */
const getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, branchId, status, tableId, orderType } = req.query;
        const { skip, take } = paginationHelper(page, limit);

        const where = {
            tenantId: req.user.tenantId,
        };

        if (branchId) where.branchId = parseInt(branchId);
        if (status) where.status = status;
        if (tableId) where.tableId = parseInt(tableId);
        if (orderType) where.orderType = orderType;

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: {
                    table: { select: { id: true, name: true } },
                    user: { select: { id: true, name: true } },
                    branch: { select: { id: true, name: true } },
                    items: {
                        include: {
                            product: { select: { id: true, name: true } },
                        },
                    },
                },
            }),
            prisma.order.count({ where }),
        ]);

        res.json({
            success: true,
            ...buildPaginationResponse(orders, total, page, limit),
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get active orders (for kitchen display)
 */
const getActive = async (req, res, next) => {
    try {
        const { branchId } = req.query;

        const where = {
            tenantId: req.user.tenantId,
            status: { in: ['pending', 'preparing', 'ready'] },
        };

        if (branchId) where.branchId = parseInt(branchId);

        const orders = await prisma.order.findMany({
            where,
            orderBy: { createdAt: 'asc' },
            include: {
                table: { select: { id: true, name: true } },
                user: { select: { id: true, name: true } },
                items: {
                    include: {
                        product: { select: { id: true, name: true } },
                    },
                },
            },
        });

        res.json({
            success: true,
            data: orders,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get a single order
 */
const getById = async (req, res, next) => {
    try {
        const order = await prisma.order.findFirst({
            where: {
                id: parseInt(req.params.id),
                tenantId: req.user.tenantId,
            },
            include: {
                table: true,
                user: { select: { id: true, name: true } },
                branch: true,
                items: {
                    include: {
                        product: true,
                        variant: true,
                    },
                },
                sale: {
                    select: { id: true, invoiceNumber: true },
                },
            },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود',
            });
        }

        res.json({
            success: true,
            data: order,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create a new order
 */
const create = async (req, res, next) => {
    try {
        const { tableId, orderType = 'dine_in', items, notes, customerName } = req.body;
        const branchId = req.user.branchId;

        if (!branchId) {
            return res.status(400).json({
                success: false,
                message: 'يجب تحديد الفرع',
            });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'يجب إضافة عناصر للطلب',
            });
        }

        // If tableId provided, validate and mark as occupied
        if (tableId) {
            const table = await prisma.restaurantTable.findFirst({
                where: {
                    id: parseInt(tableId),
                    tenantId: req.user.tenantId,
                    branchId,
                },
            });

            if (!table) {
                return res.status(400).json({
                    success: false,
                    message: 'الطاولة غير موجودة',
                });
            }
        }

        // Generate order number
        const orderNumber = await generateOrderNumber(req.user.tenantId);

        // Calculate totals
        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await prisma.product.findFirst({
                where: {
                    id: item.productId,
                    tenantId: req.user.tenantId,
                },
            });

            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: `المنتج ${item.productId} غير موجود`,
                });
            }

            const unitPrice = parseFloat(item.unitPrice || product.basePrice);
            const itemTotal = unitPrice * item.quantity;
            subtotal += itemTotal;

            orderItems.push({
                productId: item.productId,
                variantId: item.variantId || null,
                quantity: item.quantity,
                unitPrice,
                notes: item.notes || null,
            });
        }

        // Create order with items
        const order = await prisma.order.create({
            data: {
                tenantId: req.user.tenantId,
                branchId,
                tableId: tableId ? parseInt(tableId) : null,
                userId: req.user.id,
                orderNumber,
                orderType,
                subtotal,
                total: subtotal, // No discount/tax for now
                notes,
                customerName,
                items: {
                    create: orderItems,
                },
            },
            include: {
                table: { select: { id: true, name: true } },
                items: {
                    include: {
                        product: { select: { id: true, name: true } },
                    },
                },
            },
        });

        // Update table status if applicable
        if (tableId) {
            await prisma.restaurantTable.update({
                where: { id: parseInt(tableId) },
                data: { status: 'occupied' },
            });
        }

        res.status(201).json({
            success: true,
            message: 'تم إنشاء الطلب بنجاح',
            data: order,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Add items to an existing order
 */
const addItems = async (req, res, next) => {
    try {
        const orderId = parseInt(req.params.id);
        const { items } = req.body;

        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                tenantId: req.user.tenantId,
                status: { in: ['pending', 'preparing'] },
            },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود أو لا يمكن تعديله',
            });
        }

        let additionalTotal = 0;
        const newItems = [];

        for (const item of items) {
            const product = await prisma.product.findFirst({
                where: {
                    id: item.productId,
                    tenantId: req.user.tenantId,
                },
            });

            if (!product) continue;

            const unitPrice = parseFloat(item.unitPrice || product.basePrice);
            additionalTotal += unitPrice * item.quantity;

            newItems.push({
                orderId,
                productId: item.productId,
                variantId: item.variantId || null,
                quantity: item.quantity,
                unitPrice,
                notes: item.notes || null,
            });
        }

        // Add items and update total
        await prisma.$transaction([
            prisma.orderItem.createMany({ data: newItems }),
            prisma.order.update({
                where: { id: orderId },
                data: {
                    subtotal: { increment: additionalTotal },
                    total: { increment: additionalTotal },
                },
            }),
        ]);

        const updatedOrder = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: { select: { id: true, name: true } },
                    },
                },
            },
        });

        res.json({
            success: true,
            message: 'تم إضافة العناصر',
            data: updatedOrder,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update order status
 */
const updateStatus = async (req, res, next) => {
    try {
        const orderId = parseInt(req.params.id);
        const { status } = req.body;

        const validStatuses = ['pending', 'preparing', 'ready', 'served', 'paid', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'حالة غير صالحة',
            });
        }

        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                tenantId: req.user.tenantId,
            },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود',
            });
        }

        const updateData = { status };
        if (status === 'paid') {
            updateData.paidAt = new Date();
        }

        const updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: updateData,
        });

        // Free up table if order is paid or cancelled
        if (['paid', 'cancelled'].includes(status) && order.tableId) {
            // Check if there are other active orders on this table
            const otherOrders = await prisma.order.count({
                where: {
                    tableId: order.tableId,
                    id: { not: orderId },
                    status: { notIn: ['paid', 'cancelled'] },
                },
            });

            if (otherOrders === 0) {
                await prisma.restaurantTable.update({
                    where: { id: order.tableId },
                    data: { status: 'available' },
                });
            }
        }

        res.json({
            success: true,
            message: 'تم تحديث حالة الطلب',
            data: updatedOrder,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Convert order to sale (invoice)
 * This is called when order is paid
 */
const convertToSale = async (req, res, next) => {
    try {
        const orderId = parseInt(req.params.id);
        const { paymentMethod = 'CASH', discount = 0 } = req.body;

        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                tenantId: req.user.tenantId,
                status: { not: 'paid' },
            },
            include: {
                items: {
                    include: {
                        product: true,
                        variant: true,
                    },
                },
            },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود أو تم دفعه مسبقاً',
            });
        }

        // Generate invoice number
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const saleCount = await prisma.sale.count({
            where: {
                branchId: order.branchId,
                createdAt: { gte: new Date(today.setHours(0, 0, 0, 0)) },
            },
        });
        const invoiceNumber = `INV-${dateStr}-${String(saleCount + 1).padStart(4, '0')}`;

        // Calculate final total
        const subtotal = parseFloat(order.subtotal);
        const discountAmount = parseFloat(discount);
        const total = subtotal - discountAmount;

        // Create sale with items
        const sale = await prisma.sale.create({
            data: {
                branchId: order.branchId,
                userId: req.user.id,
                invoiceNumber,
                subtotal,
                discount: discountAmount,
                tax: 0,
                total,
                paymentMethod,
                items: {
                    create: order.items.map(item => ({
                        variantId: item.variantId || item.product.variants?.[0]?.id,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        discount: 0,
                        total: parseFloat(item.unitPrice) * item.quantity,
                    })),
                },
            },
        });

        // Update order as paid and link to sale
        await prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'paid',
                paidAt: new Date(),
                saleId: sale.id,
                discount: discountAmount,
                total,
            },
        });

        // Free up table
        if (order.tableId) {
            const otherOrders = await prisma.order.count({
                where: {
                    tableId: order.tableId,
                    id: { not: orderId },
                    status: { notIn: ['paid', 'cancelled'] },
                },
            });

            if (otherOrders === 0) {
                await prisma.restaurantTable.update({
                    where: { id: order.tableId },
                    data: { status: 'available' },
                });
            }
        }

        res.json({
            success: true,
            message: 'تم إنشاء الفاتورة بنجاح',
            data: {
                order,
                sale,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Cancel an order
 */
const cancel = async (req, res, next) => {
    try {
        const orderId = parseInt(req.params.id);

        const order = await prisma.order.findFirst({
            where: {
                id: orderId,
                tenantId: req.user.tenantId,
                status: { notIn: ['paid', 'cancelled'] },
            },
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'الطلب غير موجود أو لا يمكن إلغاءه',
            });
        }

        await prisma.order.update({
            where: { id: orderId },
            data: { status: 'cancelled' },
        });

        // Free up table
        if (order.tableId) {
            const otherOrders = await prisma.order.count({
                where: {
                    tableId: order.tableId,
                    id: { not: orderId },
                    status: { notIn: ['paid', 'cancelled'] },
                },
            });

            if (otherOrders === 0) {
                await prisma.restaurantTable.update({
                    where: { id: order.tableId },
                    data: { status: 'available' },
                });
            }
        }

        res.json({
            success: true,
            message: 'تم إلغاء الطلب',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll,
    getActive,
    getById,
    create,
    addItems,
    updateStatus,
    convertToSale,
    cancel,
};
