const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Super Admin Login
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const superAdmin = await prisma.superAdmin.findUnique({
            where: { email },
        });

        if (!superAdmin || !superAdmin.isActive) {
            return res.status(401).json({
                success: false,
                message: 'بيانات تسجيل الدخول غير صحيحة',
            });
        }

        const isMatch = await bcrypt.compare(password, superAdmin.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'بيانات تسجيل الدخول غير صحيحة',
            });
        }

        const token = jwt.sign(
            { superAdminId: superAdmin.id, isSuperAdmin: true },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            success: true,
            message: 'تم تسجيل الدخول بنجاح',
            data: {
                token,
                user: {
                    id: superAdmin.id,
                    name: superAdmin.name,
                    email: superAdmin.email,
                    isSuperAdmin: true,
                },
            },
        });
    } catch (error) {
        next(error);
    }
};

// Get Super Admin Profile
const getProfile = async (req, res, next) => {
    try {
        const superAdmin = await prisma.superAdmin.findUnique({
            where: { id: req.superAdmin.id },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            },
        });

        res.json({ success: true, data: superAdmin });
    } catch (error) {
        next(error);
    }
};

// Dashboard Stats
const getDashboardStats = async (req, res, next) => {
    try {
        const [
            totalTenants,
            activeTenants,
            trialTenants,
            expiredTenants,
            recentTenants,
        ] = await Promise.all([
            prisma.tenant.count(),
            prisma.tenant.count({ where: { status: 'ACTIVE' } }),
            prisma.tenant.count({ where: { status: 'TRIAL' } }),
            prisma.tenant.count({ where: { status: 'EXPIRED' } }),
            prisma.tenant.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    subscriptions: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                    },
                },
            }),
        ]);

        // Subscriptions ending soon (within 7 days)
        const now = new Date();
        const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const expiringSoon = await prisma.subscription.count({
            where: {
                status: 'ACTIVE',
                endsAt: {
                    gte: now,
                    lte: sevenDaysLater,
                },
            },
        });

        res.json({
            success: true,
            data: {
                totalTenants,
                activeTenants,
                trialTenants,
                expiredTenants,
                expiringSoon,
                recentTenants,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login,
    getProfile,
    getDashboardStats,
};
