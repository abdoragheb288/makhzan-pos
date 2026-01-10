const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

// SuperAdmin authentication middleware
const superAdminAuth = async (req, res, next) => {
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

        // Check if it's a super admin token
        if (!decoded.isSuperAdmin || !decoded.superAdminId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Super Admin only.',
            });
        }

        const superAdmin = await prisma.superAdmin.findUnique({
            where: { id: decoded.superAdminId },
            select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
            },
        });

        if (!superAdmin || !superAdmin.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Super Admin not found or inactive.',
            });
        }

        req.superAdmin = superAdmin;
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

module.exports = { superAdminAuth };
