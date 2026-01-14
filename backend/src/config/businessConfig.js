/**
 * Business Configuration Layer
 * Complete configuration for multi-business type support
 * 
 * Business Types: restaurant, cafe, retail, supermarket
 * 
 * Each type has:
 * - features: enabled/disabled features
 * - pos: POS flow configuration
 * - inventory: inventory settings
 * - ui: UI customization (placeholders, terminology, visibility)
 * - defaults: default categories and settings
 * - dashboard: dashboard widget configuration
 */

const BUSINESS_CONFIG = {
    restaurant: {
        name: 'Restaurant',
        nameAr: 'مطعم',
        description: 'نظام إدارة المطاعم مع الطاولات والطلبات والمطبخ',

        features: {
            tables: true,
            orders: true,
            kitchen: true,
            variants: false,
            installments: false,
            barcodeScan: true,
            preorders: false,
            transfers: true,
            modifiers: true,  // Extras, no onion, etc.
        },

        pos: {
            flow: 'table-based',      // table → order → kitchen → payment
            requireTable: true,
            showCategories: true,
            quickCheckout: false,
            showVariantSelector: false,
            allowTakeaway: true,
            allowDelivery: true,
            orderTypes: ['dine_in', 'takeaway', 'delivery'],
        },

        inventory: {
            trackByBranch: true,
            variants: false,
            bulkOperations: false,
            trackIngredients: true,
        },

        ui: {
            // Terminology - how things are called in this business
            terminology: {
                product: 'صنف',
                products: 'قائمة الطعام',
                category: 'قسم',
                categories: 'أقسام القائمة',
                sale: 'فاتورة',
                customer: 'زبون',
                order: 'طلب',
                addToCart: 'أضف للطلب',
                checkout: 'إصدار الفاتورة',
            },

            // Placeholders for forms
            placeholders: {
                productName: 'مثال: شاورما دجاج، برجر لحم',
                productPrice: '25.00',
                productDescription: 'وصف الصنف أو مكوناته',
                categoryName: 'مثال: مقبلات، أطباق رئيسية',
                sku: 'كود الصنف (اختياري)',
                barcode: 'باركود (اختياري)',
                searchProducts: 'ابحث في قائمة الطعام...',
            },

            // Form field visibility
            forms: {
                product: {
                    showVariants: false,
                    showBarcode: true,
                    showSku: false,
                    showModifiers: true,
                    showPreparationTime: true,
                    showCalories: true,
                },
                category: {
                    showIcon: true,
                },
            },

            // Sidebar visibility (legacy - now uses permissions)
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
                showOrderType: true,
                showKitchenNotes: true,
            },
        },

        // Default categories for this business type
        defaults: {
            categories: [
                { name: 'مقبلات', icon: '🥗' },
                { name: 'أطباق رئيسية', icon: '🍽️' },
                { name: 'مشاوي', icon: '🥩' },
                { name: 'سندويشات', icon: '🥪' },
                { name: 'حلويات', icon: '🍰' },
                { name: 'مشروبات', icon: '🥤' },
            ],
        },

        // Dashboard configuration
        dashboard: {
            widgets: ['todayOrders', 'todaySales', 'tableStatus', 'popularItems', 'kitchenQueue'],
            showTableMap: true,
            showKitchenStatus: true,
        },
    },

    cafe: {
        name: 'Cafe',
        nameAr: 'كافيه',
        description: 'نظام إدارة الكافيهات والمقاهي',

        features: {
            tables: true,
            orders: true,
            kitchen: true,
            variants: false,
            installments: false,
            barcodeScan: true,
            preorders: false,
            transfers: true,
            modifiers: true,  // Milk type, sugar level
        },

        pos: {
            flow: 'table-based',
            requireTable: false,  // Can also do takeaway quickly
            showCategories: true,
            quickCheckout: true,
            showVariantSelector: false,
            allowTakeaway: true,
            allowDelivery: true,
            orderTypes: ['dine_in', 'takeaway'],
        },

        inventory: {
            trackByBranch: true,
            variants: false,
            bulkOperations: false,
            trackIngredients: true,
        },

        ui: {
            terminology: {
                product: 'صنف',
                products: 'القائمة',
                category: 'قسم',
                categories: 'الأقسام',
                sale: 'فاتورة',
                customer: 'زبون',
                order: 'طلب',
                addToCart: 'أضف للطلب',
                checkout: 'إصدار الفاتورة',
            },

            placeholders: {
                productName: 'مثال: كابتشينو، لاتيه',
                productPrice: '15.00',
                productDescription: 'وصف المشروب أو مكوناته',
                categoryName: 'مثال: مشروبات ساخنة، حلويات',
                sku: 'كود (اختياري)',
                barcode: 'باركود (اختياري)',
                searchProducts: 'ابحث في القائمة...',
            },

            forms: {
                product: {
                    showVariants: false,
                    showBarcode: true,
                    showSku: false,
                    showModifiers: true,  // Milk type, sugar
                    showPreparationTime: true,
                    showCalories: true,
                },
                category: {
                    showIcon: true,
                },
            },

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
                showOrderType: true,
                showKitchenNotes: true,
            },
        },

        defaults: {
            categories: [
                { name: 'مشروبات ساخنة', icon: '☕' },
                { name: 'مشروبات باردة', icon: '🧊' },
                { name: 'عصائر طازجة', icon: '🍹' },
                { name: 'سموذي', icon: '🥤' },
                { name: 'حلويات', icon: '🍰' },
                { name: 'سناكس', icon: '🥐' },
            ],
        },

        dashboard: {
            widgets: ['todayOrders', 'todaySales', 'popularDrinks', 'peakHours'],
            showTableMap: true,
            showKitchenStatus: true,
        },
    },

    retail: {
        name: 'Retail',
        nameAr: 'تجزئة',
        description: 'نظام إدارة محلات التجزئة (ملابس، إلكترونيات، إكسسوارات)',

        features: {
            tables: false,
            orders: false,
            kitchen: false,
            variants: true,
            installments: true,
            barcodeScan: true,
            preorders: true,
            transfers: true,
            modifiers: false,
        },

        pos: {
            flow: 'direct',           // product → variants → payment
            requireTable: false,
            showCategories: true,
            quickCheckout: false,
            showVariantSelector: true,
            allowTakeaway: false,
            allowDelivery: false,
            orderTypes: ['direct'],
        },

        inventory: {
            trackByBranch: true,
            variants: true,
            bulkOperations: false,
            trackBySize: true,
            trackByColor: true,
        },

        ui: {
            terminology: {
                product: 'منتج',
                products: 'المنتجات',
                category: 'تصنيف',
                categories: 'التصنيفات',
                sale: 'فاتورة',
                customer: 'عميل',
                order: 'طلب',
                addToCart: 'أضف للسلة',
                checkout: 'الدفع',
            },

            placeholders: {
                productName: 'مثال: تيشيرت قطن، جينز أزرق',
                productPrice: '150.00',
                productDescription: 'وصف المنتج والخامة',
                categoryName: 'مثال: ملابس رجالي، أحذية',
                sku: 'رمز SKU',
                barcode: 'باركود المنتج',
                searchProducts: 'ابحث في المنتجات...',
            },

            forms: {
                product: {
                    showVariants: true,
                    showBarcode: true,
                    showSku: true,
                    showModifiers: false,
                    showPreparationTime: false,
                    showCalories: false,
                    showSize: true,
                    showColor: true,
                },
                category: {
                    showIcon: true,
                },
            },

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
                showOrderType: false,
                showKitchenNotes: false,
            },
        },

        defaults: {
            categories: [
                { name: 'ملابس رجالي', icon: '👔' },
                { name: 'ملابس نسائي', icon: '👗' },
                { name: 'ملابس أطفال', icon: '👶' },
                { name: 'أحذية', icon: '👟' },
                { name: 'إكسسوارات', icon: '👜' },
                { name: 'ساعات', icon: '⌚' },
            ],
        },

        dashboard: {
            widgets: ['todaySales', 'topProducts', 'lowStock', 'pendingInstallments'],
            showTableMap: false,
            showKitchenStatus: false,
        },
    },

    supermarket: {
        name: 'Supermarket',
        nameAr: 'سوبرماركت',
        description: 'نظام إدارة السوبرماركت والبقالات',

        features: {
            tables: false,
            orders: false,
            kitchen: false,
            variants: false,
            installments: false,
            barcodeScan: true,
            preorders: false,
            transfers: true,
            modifiers: false,
            expiryTracking: true,
            weightPricing: true,
        },

        pos: {
            flow: 'barcode-first',    // scan → auto-add → quick payment
            requireTable: false,
            showCategories: false,    // Focus on barcode
            quickCheckout: true,
            showVariantSelector: false,
            allowTakeaway: false,
            allowDelivery: false,
            orderTypes: ['direct'],
        },

        inventory: {
            trackByBranch: true,
            variants: false,
            bulkOperations: true,
            trackExpiry: true,
            trackByWeight: true,
        },

        ui: {
            terminology: {
                product: 'منتج',
                products: 'المنتجات',
                category: 'قسم',
                categories: 'الأقسام',
                sale: 'فاتورة',
                customer: 'عميل',
                order: 'طلب',
                addToCart: 'أضف',
                checkout: 'دفع',
            },

            placeholders: {
                productName: 'مثال: حليب طازج 1 لتر',
                productPrice: '12.00',
                productDescription: 'وصف المنتج',
                categoryName: 'مثال: ألبان، خضروات',
                sku: 'رمز المنتج',
                barcode: 'باركود (مطلوب)',
                searchProducts: 'اسكان الباركود أو ابحث...',
            },

            forms: {
                product: {
                    showVariants: false,
                    showBarcode: true,
                    showSku: true,
                    showModifiers: false,
                    showPreparationTime: false,
                    showCalories: false,
                    showExpiryDate: true,
                    showWeight: true,
                },
                category: {
                    showIcon: true,
                },
            },

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
                showOrderType: false,
                showKitchenNotes: false,
                showBarcodeInput: true,
                autoAddOnScan: true,
            },
        },

        defaults: {
            categories: [
                { name: 'خضروات وفواكه', icon: '🥬' },
                { name: 'ألبان ومنتجات حليب', icon: '🥛' },
                { name: 'مخبوزات', icon: '🍞' },
                { name: 'لحوم ودواجن', icon: '🍖' },
                { name: 'مشروبات', icon: '🥤' },
                { name: 'معلبات', icon: '🥫' },
                { name: 'منظفات', icon: '🧴' },
                { name: 'مجمدات', icon: '🧊' },
            ],
        },

        dashboard: {
            widgets: ['todaySales', 'expiringProducts', 'lowStock', 'fastMoving'],
            showTableMap: false,
            showKitchenStatus: false,
            showExpiryAlerts: true,
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
 * Get UI configuration (placeholders, terminology)
 * @param {string} businessType 
 * @returns {object}
 */
const getUIConfig = (businessType) => {
    const config = getConfig(businessType);
    return config.ui;
};

/**
 * Get default categories for a business type
 * @param {string} businessType 
 * @returns {array}
 */
const getDefaultCategories = (businessType) => {
    const config = getConfig(businessType);
    return config.defaults?.categories || [];
};

/**
 * Get dashboard widget configuration
 * @param {string} businessType 
 * @returns {object}
 */
const getDashboardConfig = (businessType) => {
    const config = getConfig(businessType);
    return config.dashboard;
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
        description: value.description,
    }));
};

module.exports = {
    BUSINESS_CONFIG,
    getConfig,
    isFeatureEnabled,
    getPosFlow,
    getUIConfig,
    getDefaultCategories,
    getDashboardConfig,
    getBusinessTypes,
};
