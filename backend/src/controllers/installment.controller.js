const prisma = require('../config/database');
const { paginationHelper, buildPaginationResponse } = require('../utils/helpers');

const getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, branchId, status } = req.query;
        const { skip, take } = paginationHelper(page, limit);

        const where = {};
        if (branchId) where.branchId = parseInt(branchId);
        if (status) where.status = status;

        const [installments, total] = await Promise.all([
            prisma.installment.findMany({
                where,
                skip,
                take,
                include: {
                    sale: { select: { invoiceNumber: true } },
                    branch: { select: { name: true } },
                    user: { select: { name: true } },
                    _count: { select: { payments: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.installment.count({ where }),
        ]);

        res.json({
            success: true,
            ...buildPaginationResponse(installments, total, page, limit),
        });
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const installment = await prisma.installment.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                sale: { select: { invoiceNumber: true, total: true } },
                branch: { select: { name: true } },
                user: { select: { name: true } },
                payments: { orderBy: { paymentDate: 'desc' } },
            },
        });

        if (!installment) {
            return res.status(404).json({ success: false, message: 'التقسيط غير موجود' });
        }

        res.json({ success: true, data: installment });
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const { saleId, branchId, customerName, customerPhone, totalAmount, downPayment, numberOfPayments, notes } = req.body;

        const remaining = parseFloat(totalAmount) - parseFloat(downPayment);
        const perMonth = remaining / parseInt(numberOfPayments);

        // Calculate next due date (1 month from now)
        const nextDueDate = new Date();
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);

        const installment = await prisma.installment.create({
            data: {
                saleId: parseInt(saleId),
                branchId: parseInt(branchId),
                userId: req.user.id,
                customerName,
                customerPhone,
                totalAmount: parseFloat(totalAmount),
                downPayment: parseFloat(downPayment),
                remainingAmount: remaining,
                numberOfPayments: parseInt(numberOfPayments),
                paymentPerMonth: perMonth,
                nextDueDate,
                notes,
            },
        });

        res.status(201).json({
            success: true,
            message: 'تم إنشاء خطة التقسيط بنجاح',
            data: installment,
        });
    } catch (error) {
        next(error);
    }
};

const addPayment = async (req, res, next) => {
    try {
        const installmentId = parseInt(req.params.id);
        const { amount, paymentMethod, notes } = req.body;

        const installment = await prisma.installment.findUnique({
            where: { id: installmentId },
        });

        if (!installment) {
            return res.status(404).json({ success: false, message: 'التقسيط غير موجود' });
        }

        const newRemaining = parseFloat(installment.remainingAmount) - parseFloat(amount);

        // Calculate next due date
        const nextDue = new Date(installment.nextDueDate);
        nextDue.setMonth(nextDue.getMonth() + 1);

        const result = await prisma.$transaction(async (tx) => {
            // Create payment
            const payment = await tx.installmentPayment.create({
                data: {
                    installmentId,
                    amount: parseFloat(amount),
                    paymentMethod: paymentMethod || 'CASH',
                    notes,
                },
            });

            // Update installment
            await tx.installment.update({
                where: { id: installmentId },
                data: {
                    remainingAmount: Math.max(0, newRemaining),
                    nextDueDate: nextDue,
                    status: newRemaining <= 0 ? 'COMPLETED' : 'ACTIVE',
                },
            });

            return payment;
        });

        res.json({
            success: true,
            message: 'تم تسجيل الدفعة بنجاح',
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getOverdue = async (req, res, next) => {
    try {
        const overdue = await prisma.installment.findMany({
            where: {
                status: 'ACTIVE',
                nextDueDate: { lt: new Date() },
            },
            include: {
                branch: { select: { name: true } },
            },
            orderBy: { nextDueDate: 'asc' },
        });

        res.json({ success: true, data: overdue });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll,
    getById,
    create,
    addPayment,
    getOverdue,
};
