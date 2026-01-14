/**
 * Business Configuration Layer
 * Central configuration for multi-business type support
 * 
 * Business Types: restaurant, cafe, retail, supermarket
 */

const BUSINESS_CONFIG = {
    restaurant: {
        name: 'Restaurant',
        nameAr: 'مطعم',
        features: {
            tables: true,
            orders: true,
            kitchen: true,
            variants: false,
            installments: false,
            barcodeScan: true,
            preorders: false,
            transfers: true,
        },
        pos: {
            flow: 'table-based',      // table → order → payment
            requireTable: true,
            showCategories: true,
            quickCheckout: false,
            showVariantSelector: false,
        },
        inventory: {
            trackByBranch: true,
            variants: false,
            bulkOperations: false,
        },
        ui: {
            sidebar: {
                showTables: true,
                showKitchen: true,
                showOrders: true,
                showInstallments: false,
                showPreorders: false,
            },
            pos: {
                showTableSelector: true,
                showVariantModal: false,
                showInstallmentOption: false,
            },
        },
    },

    cafe: {
        name: 'Cafe',
        nameAr: 'كافيه',
        features: {
            tables: true,
            orders: true,
            kitchen: true,
            variants: false,
            installments: false,
            barcodeScan: true,
            preorders: false,
            transfers: true,
        },
        pos: {
            flow: 'table-based',
            requireTable: false,  // Can also do takeaway
            showCategories: true,
            quickCheckout: true,
            showVariantSelector: false,
        },
        inventory: {
            trackByBranch: true,
            variants: false,
            bulkOperations: false,
        },
        ui: {
            sidebar: {
                showTables: true,
                showKitchen: true,
                showOrders: true,
                showInstallments: false,
                showPreorders: false,
            },
            pos: {
                showTableSelector: true,
                showVariantModal: false,
                showInstallmentOption: false,
            },
        },
    },

    retail: {
        name: 'Retail',
        nameAr: 'تجزئة',
        features: {
            tables: false,
            orders: false,
            kitchen: false,
            variants: true,
            installments: true,
            barcodeScan: true,
            preorders: true,
            transfers: true,
        },
        pos: {
            flow: 'direct',           // product → variants → payment
            requireTable: false,
            showCategories: true,
            quickCheckout: false,
            showVariantSelector: true,
        },
        inventory: {
            trackByBranch: true,
            variants: true,
            bulkOperations: false,
        },
        ui: {
            sidebar: {
                showTables: false,
                showKitchen: false,
                showOrders: false,
                showInstallments: true,
                showPreorders: true,
            },
            pos: {
                showTableSelector: false,
                showVariantModal: true,
                showInstallmentOption: true,
            },
        },
    },

    supermarket: {
        name: 'Supermarket',
        nameAr: 'سوبرماركت',
        features: {
            tables: false,
            orders: false,
            kitchen: false,
            variants: false,
            installments: false,
            barcodeScan: true,
            preorders: false,
            transfers: true,
        },
        pos: {
            flow: 'barcode-first',    // scan → quantity → payment
            requireTable: false,
            showCategories: false,
            quickCheckout: true,
            showVariantSelector: false,
        },
        inventory: {
            trackByBranch: true,
            variants: false,
            bulkOperations: true,
        },
        ui: {
            sidebar: {
                showTables: false,
                showKitchen: false,
                showOrders: false,
                showInstallments: false,
                showPreorders: false,
            },
            pos: {
                showTableSelector: false,
                showVariantModal: false,
                showInstallmentOption: false,
            },
        },
    },
};

/**
 * Get full config for a business type
 * @param {string} businessType - restaurant, cafe, retail, supermarket
 * @returns {object} Business configuration
 */
const getConfig = (businessType) => {
    return BUSINESS_CONFIG[businessType] || BUSINESS_CONFIG.retail;
};

/**
 * Check if a feature is enabled for a business type
 * @param {string} businessType 
 * @param {string} feature 
 * @returns {boolean}
 */
const isFeatureEnabled = (businessType, feature) => {
    const config = getConfig(businessType);
    return config.features[feature] ?? false;
};

/**
 * Get POS flow type for a business type
 * @param {string} businessType 
 * @returns {string} 'table-based' | 'direct' | 'barcode-first'
 */
const getPosFlow = (businessType) => {
    const config = getConfig(businessType);
    return config.pos.flow;
};

/**
 * Get available business types
 * @returns {array} List of business type options
 */
const getBusinessTypes = () => {
    return Object.entries(BUSINESS_CONFIG).map(([key, value]) => ({
        value: key,
        label: value.name,
        labelAr: value.nameAr,
    }));
};

module.exports = {
    BUSINESS_CONFIG,
    getConfig,
    isFeatureEnabled,
    getPosFlow,
    getBusinessTypes,
};
