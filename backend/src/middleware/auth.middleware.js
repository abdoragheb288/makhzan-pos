const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
            });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                tenantId: true,
                branchId: true,
                isActive: true,
                branch: {
                    select: {
                        id: true,
                        name: true,
                        isWarehouse: true,
                    },
                },
            },
        });

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive.',
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.',
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired.',
            });
        }
        next(error);
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated.',
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.',
            });
        }

        next();
    };
};

module.exports = { auth, authorize };
