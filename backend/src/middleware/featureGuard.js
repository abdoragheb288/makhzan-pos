/**
 * Feature Guard Middleware
 * Restricts access to features based on business type
 */

const { isFeatureEnabled } = require('../config/businessConfig');

/**
 * Middleware to require a specific feature
 * Returns 403 if the tenant's business type doesn't support the feature
 * 
 * @param {string} feature - Feature name from businessConfig (tables, orders, variants, etc.)
 */
const requireFeature = (feature) => {
    return (req, res, next) => {
        const businessType = req.user?.businessType;

        if (!businessType) {
            // Default to retail if no business type (backward compatibility)
            return next();
        }

        if (!isFeatureEnabled(businessType, feature)) {
            return res.status(403).json({
                success: false,
                message: 'هذه الميزة غير متاحة لنوع نشاطك',
                feature,
                businessType,
            });
        }

        next();
    };
};

/**
 * Middleware to require one of multiple features
 * Passes if ANY of the specified features are enabled
 * 
 * @param {string[]} features - Array of feature names
 */
const requireAnyFeature = (features) => {
    return (req, res, next) => {
        const businessType = req.user?.businessType;

        if (!businessType) {
            return next();
        }

        const hasAnyFeature = features.some(feature =>
            isFeatureEnabled(businessType, feature)
        );

        if (!hasAnyFeature) {
            return res.status(403).json({
                success: false,
                message: 'هذه الميزة غير متاحة لنوع نشاطك',
                requiredFeatures: features,
                businessType,
            });
        }

        next();
    };
};

module.exports = {
    requireFeature,
    requireAnyFeature,
};
