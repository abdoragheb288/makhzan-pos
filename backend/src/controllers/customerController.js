/**
 * Customer Controller
 * Handles delivery customer management
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all customers for the tenant
 * GET /api/customers
 */
const getAll = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { search, limit = 50, page = 1 } = req.query;

        const where = { tenantId };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { address: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [customers, total] = await Promise.all([
            prisma.customer.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: parseInt(limit),
                skip: (parseInt(page) - 1) * parseInt(limit),
                include: {
                    _count: { select: { orders: true } },
                },
            }),
            prisma.customer.count({ where }),
        ]);

        res.json({
            success: true,
            data: customers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب العملاء' });
    }
};

/**
 * Search customer by phone number
 * GET /api/customers/search?phone=xxx
 */
const searchByPhone = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { phone } = req.query;

        if (!phone) {
            return res.status(400).json({ success: false, message: 'رقم الهاتف مطلوب' });
        }

        const customer = await prisma.customer.findFirst({
            where: {
                tenantId,
                phone: { contains: phone },
            },
            include: {
                _count: { select: { orders: true } },
            },
        });

        res.json({
            success: true,
            data: customer, // null if not found
        });
    } catch (error) {
        console.error('Error searching customer:', error);
        res.status(500).json({ success: false, message: 'خطأ في البحث' });
    }
};

/**
 * Get single customer
 * GET /api/customers/:id
 */
const getById = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;

        const customer = await prisma.customer.findFirst({
            where: { id: parseInt(id), tenantId },
            include: {
                orders: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        orderNumber: true,
                        total: true,
                        orderType: true,
                        status: true,
                        createdAt: true,
                    },
                },
                _count: { select: { orders: true } },
            },
        });

        if (!customer) {
            return res.status(404).json({ success: false, message: 'العميل غير موجود' });
        }

        res.json({ success: true, data: customer });
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ success: false, message: 'خطأ في جلب بيانات العميل' });
    }
};

/**
 * Create new customer
 * POST /api/customers
 */
const create = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { name, phone, address, notes } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ success: false, message: 'الاسم ورقم الهاتف مطلوبين' });
        }

        // Check if customer with same phone exists
        const existing = await prisma.customer.findFirst({
            where: { tenantId, phone },
        });

        if (existing) {
            return res.status(400).json({ success: false, message: 'رقم الهاتف مسجل مسبقاً', existingCustomer: existing });
        }

        const customer = await prisma.customer.create({
            data: {
                tenantId,
                name,
                phone,
                address: address || null,
                notes: notes || null,
            },
        });

        res.status(201).json({ success: true, data: customer });
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ success: false, message: 'خطأ في إنشاء العميل' });
    }
};

/**
 * Update customer
 * PUT /api/customers/:id
 */
const update = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        const { name, phone, address, notes } = req.body;

        // Verify ownership
        const existing = await prisma.customer.findFirst({
            where: { id: parseInt(id), tenantId },
        });

        if (!existing) {
            return res.status(404).json({ success: false, message: 'العميل غير موجود' });
        }

        // Check phone uniqueness if changed
        if (phone && phone !== existing.phone) {
            const phoneExists = await prisma.customer.findFirst({
                where: { tenantId, phone, NOT: { id: parseInt(id) } },
            });
            if (phoneExists) {
                return res.status(400).json({ success: false, message: 'رقم الهاتف مسجل لعميل آخر' });
            }
        }

        const customer = await prisma.customer.update({
            where: { id: parseInt(id) },
            data: {
                name: name || existing.name,
                phone: phone || existing.phone,
                address: address !== undefined ? address : existing.address,
                notes: notes !== undefined ? notes : existing.notes,
            },
        });

        res.json({ success: true, data: customer });
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ success: false, message: 'خطأ في تحديث بيانات العميل' });
    }
};

/**
 * Delete customer
 * DELETE /api/customers/:id
 */
const remove = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;

        // Verify ownership
        const existing = await prisma.customer.findFirst({
            where: { id: parseInt(id), tenantId },
        });

        if (!existing) {
            return res.status(404).json({ success: false, message: 'العميل غير موجود' });
        }

        await prisma.customer.delete({
            where: { id: parseInt(id) },
        });

        res.json({ success: true, message: 'تم حذف العميل' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ success: false, message: 'خطأ في حذف العميل' });
    }
};

/**
 * Create or get customer (upsert by phone)
 * POST /api/customers/upsert
 */
const upsert = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { name, phone, address } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: 'رقم الهاتف مطلوب' });
        }

        // Try to find existing customer
        let customer = await prisma.customer.findFirst({
            where: { tenantId, phone },
        });

        if (customer) {
            // Update if data changed
            if (name || address) {
                customer = await prisma.customer.update({
                    where: { id: customer.id },
                    data: {
                        name: name || customer.name,
                        address: address || customer.address,
                    },
                });
            }
        } else {
            // Create new
            customer = await prisma.customer.create({
                data: {
                    tenantId,
                    name: name || 'عميل دليفري',
                    phone,
                    address: address || null,
                },
            });
        }

        res.json({ success: true, data: customer });
    } catch (error) {
        console.error('Error upserting customer:', error);
        res.status(500).json({ success: false, message: 'خطأ في حفظ بيانات العميل' });
    }
};

module.exports = {
    getAll,
    searchByPhone,
    getById,
    create,
    update,
    remove,
    upsert,
};
