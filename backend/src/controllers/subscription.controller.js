const prisma = require('../config/database');
const { paginationHelper, buildPaginationResponse } = require('../utils/helpers');

// Get all subscriptions
const getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, tenantId } = req.query;
        const { skip, take } = paginationHelper(page, limit);

        const where = {};
        if (status) where.status = status;
        if (tenantId) where.tenantId = parseInt(tenantId);

        const [subscriptions, total] = await Promise.all([
            prisma.subscription.findMany({
                where,
                skip,
                take,
                include: {
                    tenant: { select: { id: true, name: true, email: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.subscription.count({ where }),
        ]);

        res.json({
            success: true,
            ...buildPaginationResponse(subscriptions, total, page, limit),
        });
    } catch (error) {
        next(error);
    }
};

// Create subscription for tenant
const create = async (req, res, next) => {
    try {
        const { tenantId, plan, amount, notes } = req.body;

        // Calculate dates based on plan
        const startsAt = new Date();
        const endsAt = new Date();

        switch (plan) {
            case 'MONTHLY':
                endsAt.setMonth(endsAt.getMonth() + 1);
                break;
            case 'QUARTERLY':
                endsAt.setMonth(endsAt.getMonth() + 3);
                break;
            case 'SEMI_ANNUAL':
                endsAt.setMonth(endsAt.getMonth() + 6);
                break;
            case 'ANNUAL':
                endsAt.setFullYear(endsAt.getFullYear() + 1);
                break;
            default:
                endsAt.setMonth(endsAt.getMonth() + 1);
        }

        // Create subscription
        const subscription = await prisma.subscription.create({
            data: {
                tenantId: parseInt(tenantId),
                plan,
                startsAt,
                endsAt,
                amount: amount ? parseFloat(amount) : null,
                notes,
                status: 'ACTIVE',
            },
        });

        // Update tenant status to ACTIVE
        await prisma.tenant.update({
            where: { id: parseInt(tenantId) },
            data: { status: 'ACTIVE' },
        });

        res.status(201).json({
            success: true,
            message: 'تم إنشاء الاشتراك بنجاح',
            data: subscription,
        });
    } catch (error) {
        next(error);
    }
};

// Extend subscription
const extend = async (req, res, next) => {
    try {
        const { plan, amount, notes } = req.body;
        const subscriptionId = parseInt(req.params.id);

        const currentSub = await prisma.subscription.findUnique({
            where: { id: subscriptionId },
        });

        if (!currentSub) {
            return res.status(404).json({
                success: false,
                message: 'الاشتراك غير موجود',
            });
        }

        // Calculate new end date
        const newEndsAt = new Date(currentSub.endsAt);

        switch (plan || currentSub.plan) {
            case 'MONTHLY':
                newEndsAt.setMonth(newEndsAt.getMonth() + 1);
                break;
            case 'QUARTERLY':
                newEndsAt.setMonth(newEndsAt.getMonth() + 3);
                break;
            case 'SEMI_ANNUAL':
                newEndsAt.setMonth(newEndsAt.getMonth() + 6);
                break;
            case 'ANNUAL':
                newEndsAt.setFullYear(newEndsAt.getFullYear() + 1);
                break;
        }

        const subscription = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                endsAt: newEndsAt,
                status: 'ACTIVE',
                notes: notes || currentSub.notes,
            },
        });

        // Ensure tenant is active
        await prisma.tenant.update({
            where: { id: currentSub.tenantId },
            data: { status: 'ACTIVE' },
        });

        res.json({
            success: true,
            message: 'تم تمديد الاشتراك بنجاح',
            data: subscription,
        });
    } catch (error) {
        next(error);
    }
};

// Cancel subscription
const cancel = async (req, res, next) => {
    try {
        const subscription = await prisma.subscription.update({
            where: { id: parseInt(req.params.id) },
            data: { status: 'CANCELLED' },
        });

        res.json({
            success: true,
            message: 'تم إلغاء الاشتراك',
            data: subscription,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll,
    create,
    extend,
    cancel,
};
