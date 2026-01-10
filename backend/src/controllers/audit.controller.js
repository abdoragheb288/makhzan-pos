const prisma = require('../config/database');
const { paginationHelper, buildPaginationResponse } = require('../utils/helpers');

const getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 30, userId, action, entity, startDate, endDate } = req.query;
        const { skip, take } = paginationHelper(page, limit);

        const where = {};
        if (userId) where.userId = parseInt(userId);
        if (action) where.action = action;
        if (entity) where.entity = entity;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip,
                take,
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.auditLog.count({ where }),
        ]);

        res.json({
            success: true,
            ...buildPaginationResponse(logs, total, page, limit),
        });
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const { action, entity, entityId, oldData, newData, description } = req.body;

        const log = await prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action,
                entity,
                entityId,
                oldData,
                newData,
                description,
            },
        });

        res.status(201).json({ success: true, data: log });
    } catch (error) {
        next(error);
    }
};

const getSummary = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;

        const where = {};
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const logs = await prisma.auditLog.findMany({
            where,
            select: { action: true, entity: true },
        });

        // Group by action
        const byAction = {};
        const byEntity = {};
        logs.forEach((log) => {
            byAction[log.action] = (byAction[log.action] || 0) + 1;
            byEntity[log.entity] = (byEntity[log.entity] || 0) + 1;
        });

        res.json({
            success: true,
            data: {
                total: logs.length,
                byAction,
                byEntity,
            },
        });
    } catch (error) {
        next(error);
    }
};

const getByEntity = async (req, res, next) => {
    try {
        const { entity, entityId } = req.params;

        const logs = await prisma.auditLog.findMany({
            where: {
                entity,
                entityId: parseInt(entityId),
            },
            include: {
                user: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: logs });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAll,
    create,
    getSummary,
    getByEntity,
};
