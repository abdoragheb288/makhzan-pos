import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            businessConfig: null,  // Business configuration based on tenant's businessType

            setAuth: (user, token, businessConfig = null) => {
                // Also store token in sessionStorage for API interceptor
                sessionStorage.setItem('token', token);
                set({ user, token, isAuthenticated: true, businessConfig });
            },

            logout: () => {
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('auth-storage');
                set({ user: null, token: null, isAuthenticated: false, businessConfig: null });
            },

            updateUser: (userData) => {
                set((state) => ({
                    user: { ...state.user, ...userData },
                }));
            },

            // Business config helpers
            getBusinessType: () => {
                return get().user?.businessType || 'retail';
            },

            isFeatureEnabled: (feature) => {
                const config = get().businessConfig;
                return config?.features?.[feature] ?? false;
            },

            getPosFlow: () => {
                const config = get().businessConfig;
                return config?.pos?.flow || 'direct';
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => sessionStorage), // Use sessionStorage for tab isolation
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
                businessConfig: state.businessConfig,
            }),
        }
    )
);

// Hook for easy feature checks
export const useFeature = (feature) => {
    return useAuthStore((state) => state.businessConfig?.features?.[feature] ?? false);
};

// Hook for getting business config
export const useBusinessConfig = () => {
    return useAuthStore((state) => state.businessConfig);
};

// Hook for getting POS flow type
export const usePosFlow = () => {
    return useAuthStore((state) => state.businessConfig?.pos?.flow || 'direct');
};

export const usePosStore = create((set, get) => ({
    cart: [],
    selectedCategory: null,
    discount: 0,
    discountType: 'amount',
    paymentMethod: 'CASH',
    paidAmount: '',
    notes: '',

    addToCart: (product) => {
        const cart = get().cart;
        const existingIndex = cart.findIndex(
            (item) => item.variantId === product.variantId
        );

        if (existingIndex >= 0) {
            const newCart = [...cart];
            newCart[existingIndex].quantity += 1;
            set({ cart: newCart });
        } else {
            set({
                cart: [
                    ...cart,
                    {
                        ...product,
                        quantity: 1,
                        discount: 0,
                    },
                ],
            });
        }
    },

    updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
            get().removeFromCart(variantId);
            return;
        }

        set((state) => ({
            cart: state.cart.map((item) =>
                item.variantId === variantId ? { ...item, quantity } : item
            ),
        }));
    },

    updateItemDiscount: (variantId, discount) => {
        set((state) => ({
            cart: state.cart.map((item) =>
                item.variantId === variantId ? { ...item, discount: parseFloat(discount) || 0 } : item
            ),
        }));
    },

    removeFromCart: (variantId) => {
        set((state) => ({
            cart: state.cart.filter((item) => item.variantId !== variantId),
        }));
    },

    clearCart: () => {
        set({
            cart: [],
            discount: 0,
            discountType: 'amount',
            paidAmount: '',
            notes: '',
        });
    },

    setDiscount: (discount, discountType = 'amount') => {
        set({ discount: parseFloat(discount) || 0, discountType });
    },

    setPaymentMethod: (method) => {
        set({ paymentMethod: method });
    },

    setPaidAmount: (amount) => {
        set({ paidAmount: amount });
    },

    setNotes: (notes) => {
        set({ notes });
    },

    setSelectedCategory: (categoryId) => {
        set({ selectedCategory: categoryId });
    },

    getSubtotal: () => {
        return get().cart.reduce(
            (sum, item) => sum + item.price * item.quantity - item.discount,
            0
        );
    },

    getDiscountAmount: () => {
        const { discount, discountType } = get();
        const subtotal = get().getSubtotal();

        if (discountType === 'percentage') {
            return (subtotal * discount) / 100;
        }
        return discount;
    },

    getTotal: () => {
        const subtotal = get().getSubtotal();
        const discountAmount = get().getDiscountAmount();
        return subtotal - discountAmount;
    },

    getChange: () => {
        const total = get().getTotal();
        const paid = parseFloat(get().paidAmount) || 0;
        return paid - total;
    },
}));

export const useUIStore = create((set) => ({
    sidebarOpen: true,
    modalOpen: null,
    loading: false,

    toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
    },

    openModal: (modalId) => {
        set({ modalOpen: modalId });
    },

    closeModal: () => {
        set({ modalOpen: null });
    },

    setLoading: (loading) => {
        set({ loading });
    },
}));

// ==================== THEME STORE ====================
export const useThemeStore = create(
    persist(
        (set, get) => ({
            theme: 'light', // 'light' | 'dark'

            setTheme: (theme) => {
                document.documentElement.setAttribute('data-theme', theme);
                set({ theme });
            },

            toggleTheme: () => {
                const newTheme = get().theme === 'light' ? 'dark' : 'light';
                document.documentElement.setAttribute('data-theme', newTheme);
                set({ theme: newTheme });
            },

            initTheme: () => {
                const theme = get().theme;
                document.documentElement.setAttribute('data-theme', theme);
            },
        }),
        {
            name: 'theme-storage',
        }
    )
);

// ==================== NOTIFICATION STORE ====================
export const useNotificationStore = create((set, get) => ({
    notifications: [],
    unreadCount: 0,

    addNotification: (notification) => {
        const newNotification = {
            id: Date.now(),
            createdAt: new Date().toISOString(),
            read: false,
            ...notification,
        };
        set((state) => ({
            notifications: [newNotification, ...state.notifications].slice(0, 50),
            unreadCount: state.unreadCount + 1,
        }));
    },

    markAsRead: (id) => {
        set((state) => ({
            notifications: state.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
        }));
    },

    markAllAsRead: () => {
        set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
        }));
    },

    clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
    },
}));

// ==================== I18N STORE ====================
const translations = {
    ar: {
        dashboard: 'لوحة التحكم',
        pos: 'نقطة البيع',
        products: 'المنتجات',
        inventory: 'المخزون',
        sales: 'المبيعات',
        reports: 'التقارير',
        settings: 'الإعدادات',
        users: 'المستخدمين',
        branches: 'الفروع',
        logout: 'تسجيل الخروج',
        save: 'حفظ',
        cancel: 'إلغاء',
        delete: 'حذف',
        edit: 'تعديل',
        add: 'إضافة',
        search: 'بحث',
        total: 'الإجمالي',
        subtotal: 'المجموع الفرعي',
        discount: 'الخصم',
        quantity: 'الكمية',
        price: 'السعر',
        name: 'الاسم',
        email: 'البريد الإلكتروني',
        phone: 'الهاتف',
        address: 'العنوان',
        date: 'التاريخ',
        status: 'الحالة',
        actions: 'إجراءات',
        noData: 'لا توجد بيانات',
        loading: 'جاري التحميل...',
        success: 'تم بنجاح',
        error: 'حدث خطأ',
        confirm: 'تأكيد',
        darkMode: 'الوضع الليلي',
        lightMode: 'الوضع النهاري',
        language: 'اللغة',
        notifications: 'الإشعارات',
        shortcuts: 'اختصارات لوحة المفاتيح',
    },
    en: {
        dashboard: 'Dashboard',
        pos: 'Point of Sale',
        products: 'Products',
        inventory: 'Inventory',
        sales: 'Sales',
        reports: 'Reports',
        settings: 'Settings',
        users: 'Users',
        branches: 'Branches',
        logout: 'Logout',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        search: 'Search',
        total: 'Total',
        subtotal: 'Subtotal',
        discount: 'Discount',
        quantity: 'Quantity',
        price: 'Price',
        name: 'Name',
        email: 'Email',
        phone: 'Phone',
        address: 'Address',
        date: 'Date',
        status: 'Status',
        actions: 'Actions',
        noData: 'No data',
        loading: 'Loading...',
        success: 'Success',
        error: 'Error',
        confirm: 'Confirm',
        darkMode: 'Dark Mode',
        lightMode: 'Light Mode',
        language: 'Language',
        notifications: 'Notifications',
        shortcuts: 'Keyboard Shortcuts',
    },
};

export const useI18nStore = create(
    persist(
        (set, get) => ({
            locale: 'ar', // 'ar' | 'en'

            setLocale: (locale) => {
                document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
                document.documentElement.lang = locale;
                set({ locale });
            },

            t: (key) => {
                const locale = get().locale;
                return translations[locale]?.[key] || translations.ar[key] || key;
            },

            initLocale: () => {
                const locale = get().locale;
                document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
                document.documentElement.lang = locale;
            },
        }),
        {
            name: 'i18n-storage',
        }
    )
);

