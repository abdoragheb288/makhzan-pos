const prisma = require('../config/database');
const { paginationHelper, buildPaginationResponse } = require('../utils/helpers');

// Get all commissions
const getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 30, userId, isPaid, startDate, endDate } = req.query;
        const { skip, take } = paginationHelper(page, limit);

        const where = {};
        if (userId) where.userId = parseInt(userId);
        if (isPaid !== undefined) where.isPaid = isPaid === 'true';
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const [commissions, total] = await Promise.all([
            prisma.commission.findMany({
                where,
                skip,
                take,
                include: {
                    user: { select: { id: true, name: true } },
                    sale: { select: { invoiceNumber: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.commission.count({ where }),
        ]);

        res.json({
            success: true,
            ...buildPaginationResponse(commissions, total, page, limit),
        });
    } catch (error) {
        next(error);
    }
};

// Get summary per user
const getSummary = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        const where = {};
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        // Get all commissions grouped by user
        const commissions = await prisma.commission.findMany({
            where,
            include: { user: { select: { id: true, name: true } } },
        });

        // Aggregate by user
        const summary = {};
        commissions.forEach((c) => {
            const userId = c.userId;
            if (!summary[userId]) {
                summary[userId] = {
                    userId,
                    userName: c.user.name,
                    totalSales: 0,
                    totalCommission: 0,
                    paidAmount: 0,
                    unpaidAmount: 0,
                    count: 0,
                };
            }
            summary[userId].totalSales += parseFloat(c.saleTotal);
            summary[userId].totalCommission += parseFloat(c.amount);
            if (c.isPaid) {
                summary[userId].paidAmount += parseFloat(c.amount);
            } else {
                summary[userId].unpaidAmount += parseFloat(c.amount);
            }
            summary[userId].count += 1;
        });

        res.json({
            success: true,
            data: Object.values(summary),
        });
    } catch (error) {
        next(error);
    }
};

// Mark commissions as paid
const markPaid = async (req, res, next) => {
    try {
        const { ids } = req.body; // Array of commission IDs

        await prisma.commission.updateMany({
            where: { id: { in: ids.map((id) => parseInt(id)) } },
            data: { isPaid: true, paidAt: new Date() },
        });

        res.json({ success: true, message: 'تم تحديث حالة الدفع' });
    } catch (error) {
        next(error);
    }
};

// Get commission settings (could be from a settings table, but for now return defaults)
const getSettings = async (req, res, next) => {
    try {
        // You could store this in a Settings table, for now return default
        res.json({
            success: true,
            data: {
                defaultRate: 2.5, // 2.5% commission
                isEnabled: true,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll,
    getSummary,
    markPaid,
    getSettings,
};
