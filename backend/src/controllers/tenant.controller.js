const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const { paginationHelper, buildPaginationResponse } = require('../utils/helpers');

// Get all tenants
const getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;
        const { skip, take } = paginationHelper(page, limit);

        const where = {};
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [tenants, total] = await Promise.all([
            prisma.tenant.findMany({
                where,
                skip,
                take,
                include: {
                    subscriptions: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                    _count: { select: { users: true, branches: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.tenant.count({ where }),
        ]);

        res.json({
            success: true,
            ...buildPaginationResponse(tenants, total, page, limit),
        });
    } catch (error) {
        next(error);
    }
};

// Get tenant by ID
const getById = async (req, res, next) => {
    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                subscriptions: { orderBy: { createdAt: 'desc' } },
                users: { select: { id: true, name: true, email: true, role: true } },
                branches: { select: { id: true, name: true, isWarehouse: true } },
                _count: { select: { products: true, categories: true } },
            },
        });

        if (!tenant) {
            return res.status(404).json({
                success: false,
                message: 'المشترك غير موجود',
            });
        }

        res.json({ success: true, data: tenant });
    } catch (error) {
        next(error);
    }
};

// Create new tenant with admin user
const create = async (req, res, next) => {
    try {
        const { name, email, phone, businessType = 'retail', adminName, adminEmail, adminPassword, plan } = req.body;

        // Validate businessType
        const validBusinessTypes = ['restaurant', 'cafe', 'retail', 'supermarket'];
        if (!validBusinessTypes.includes(businessType)) {
            return res.status(400).json({
                success: false,
                message: 'نوع النشاط غير صالح',
            });
        }

        // Check if tenant email exists
        const existingTenant = await prisma.tenant.findUnique({ where: { email } });
        if (existingTenant) {
            return res.status(400).json({
                success: false,
                message: 'البريد الإلكتروني مستخدم بالفعل',
            });
        }

        // Check if admin email exists
        const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'بريد المستخدم الإداري مستخدم بالفعل',
            });
        }

        // Calculate trial end date (7 days)
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 7);

        // Create tenant with admin user
        const hashedPassword = await bcrypt.hash(adminPassword || 'admin123', 12);

        const tenant = await prisma.tenant.create({
            data: {
                name,
                email,
                phone,
                businessType, // restaurant, cafe, retail, supermarket
                status: 'TRIAL',
                trialEndsAt,
                users: {
                    create: {
                        name: adminName || 'مدير النظام',
                        email: adminEmail,
                        password: hashedPassword,
                        role: 'ADMIN',
                        permissions: [],
                    },
                },
                branches: {
                    create: {
                        name: 'الفرع الرئيسي',
                        isWarehouse: true,
                    },
                },
            },
            include: {
                users: true,
                branches: true,
            },
        });

        res.status(201).json({
            success: true,
            message: 'تم إنشاء المشترك بنجاح',
            data: tenant,
        });
    } catch (error) {
        next(error);
    }
};

// Update tenant
const update = async (req, res, next) => {
    try {
        const { name, phone, status, isActive, businessType } = req.body;

        const updateData = { name, phone, status, isActive };

        // Only update businessType if provided and valid
        if (businessType) {
            const validBusinessTypes = ['restaurant', 'cafe', 'retail', 'supermarket'];
            if (validBusinessTypes.includes(businessType)) {
                updateData.businessType = businessType;
            }
        }

        const tenant = await prisma.tenant.update({
            where: { id: parseInt(req.params.id) },
            data: updateData,
        });

        res.json({
            success: true,
            message: 'تم تحديث المشترك بنجاح',
            data: tenant,
        });
    } catch (error) {
        next(error);
    }
};

// Suspend tenant
const suspend = async (req, res, next) => {
    try {
        const tenant = await prisma.tenant.update({
            where: { id: parseInt(req.params.id) },
            data: { status: 'SUSPENDED' },
        });

        res.json({
            success: true,
            message: 'تم إيقاف المشترك',
            data: tenant,
        });
    } catch (error) {
        next(error);
    }
};

// Activate tenant
const activate = async (req, res, next) => {
    try {
        const tenant = await prisma.tenant.update({
            where: { id: parseInt(req.params.id) },
            data: { status: 'ACTIVE' },
        });

        res.json({
            success: true,
            message: 'تم تفعيل المشترك',
            data: tenant,
        });
    } catch (error) {
        next(error);
    }
};

// Delete tenant (and all related data)
const remove = async (req, res, next) => {
    try {
        await prisma.tenant.delete({
            where: { id: parseInt(req.params.id) },
        });

        res.json({
            success: true,
            message: 'تم حذف المشترك بنجاح',
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
    suspend,
    activate,
    delete: remove,
};
