const bcrypt = require('bcryptjs');
const prisma = require('../config/database');
const { paginationHelper, buildPaginationResponse } = require('../utils/helpers');

const getAll = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search, role, branchId, isActive } = req.query;
        const { skip, take } = paginationHelper(page, limit);

        const where = {};

        if (search) {
            where.OR = [
                { name: { contains: search } },
                { email: { contains: search } },
            ];
        }

        if (role) where.role = role;
        if (branchId) where.branchId = parseInt(branchId);
        if (isActive !== undefined) where.isActive = isActive === 'true';

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    permissions: true,
                    isActive: true,
                    createdAt: true,
                    branch: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.user.count({ where }),
        ]);

        res.json({
            success: true,
            ...buildPaginationResponse(users, total, page, limit),
        });
    } catch (error) {
        next(error);
    }
};

const getById = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(req.params.id) },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                permissions: true,
                isActive: true,
                branchId: true,
                createdAt: true,
                updatedAt: true,
                branch: {
                    select: {
                        id: true,
                        name: true,
                        isWarehouse: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود',
            });
        }

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

const create = async (req, res, next) => {
    try {
        const { name, email, password, phone, role, branchId, permissions } = req.body;

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
                branchId: branchId ? parseInt(branchId) : null,
                permissions: permissions || [],
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                permissions: true,
                branchId: true,
                isActive: true,
                createdAt: true,
            },
        });

        res.status(201).json({
            success: true,
            message: 'تم إنشاء المستخدم بنجاح',
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const { name, email, password, phone, role, branchId, isActive, permissions } = req.body;
        const userId = parseInt(req.params.id);

        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود',
            });
        }

        if (email && email !== existingUser.email) {
            const emailExists = await prisma.user.findUnique({
                where: { email },
            });

            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'البريد الإلكتروني مستخدم بالفعل',
                });
            }
        }

        const updateData = {
            name,
            email,
            phone,
            role,
            branchId: branchId ? parseInt(branchId) : null,
            isActive,
            permissions: permissions !== undefined ? permissions : undefined,
        };

        if (password) {
            updateData.password = await bcrypt.hash(password, 12);
        }

        // Remove undefined values
        Object.keys(updateData).forEach(
            (key) => updateData[key] === undefined && delete updateData[key]
        );

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                permissions: true,
                branchId: true,
                isActive: true,
                updatedAt: true,
            },
        });

        res.json({
            success: true,
            message: 'تم تحديث المستخدم بنجاح',
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        const userId = parseInt(req.params.id);

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'المستخدم غير موجود',
            });
        }

        // Soft delete
        await prisma.user.update({
            where: { id: userId },
            data: { isActive: false },
        });

        res.json({
            success: true,
            message: 'تم حذف المستخدم بنجاح',
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
};
