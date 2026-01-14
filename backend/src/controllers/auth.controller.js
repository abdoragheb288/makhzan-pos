const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { getConfig } = require('../config/businessConfig');

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                branch: {
                    select: {
                        id: true,
                        name: true,
                        isWarehouse: true,
                    },
                },
                tenant: {
                    select: {
                        id: true,
                        isActive: true,
                        status: true,
                        name: true,
                        businessType: true,
                    }
                }
            },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'هذا الحساب غير مفعل',
            });
        }

        // Check Tenant Status
        if (user.tenant && (!user.tenant.isActive || user.tenant.status === 'SUSPENDED')) {
            return res.status(401).json({
                success: false,
                message: 'تم إيقاف حساب الشركة. يرجى الاتصال بالإدارة.',
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
            });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role, tenantId: user.tenantId },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Get business configuration
        const businessType = user.tenant?.businessType || 'retail';
        const businessConfig = getConfig(businessType);

        res.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    tenantId: user.tenantId,
                    tenantName: user.tenant?.name,
                    businessType,
                    branchId: user.branchId,
                    branch: user.branch,
                    permissions: user.permissions || [],
                },
                businessConfig,
            },
        });
    } catch (error) {
        next(error);
    }
};

const register = async (req, res, next) => {
    try {
        const { name, email, password, phone, role, branchId } = req.body;

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'البريد الإلكتروني مستخدم بالفعل',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone,
                role: role || 'CASHIER',
                branchId: branchId || null,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                phone: true,
                branchId: true,
            },
        });

        res.status(201).json({
            success: true,
            message: 'تم إنشاء الحساب بنجاح',
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

const getProfile = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                branchId: true,
                branch: {
                    select: {
                        id: true,
                        name: true,
                        isWarehouse: true,
                    },
                },
                permissions: true,
                createdAt: true,
            },
        });

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const { name, phone, currentPassword, newPassword } = req.body;

        const updateData = {};

        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;

        if (newPassword) {
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
            });

            const isValid = await bcrypt.compare(currentPassword, user.password);
            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'كلمة المرور الحالية غير صحيحة',
                });
            }

            updateData.password = await bcrypt.hash(newPassword, 12);
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
            },
        });

        res.json({
            success: true,
            message: 'تم تحديث الملف الشخصي بنجاح',
            data: updatedUser,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login,
    register,
    getProfile,
    updateProfile,
};
