import api from './api';

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },

    register: async (data) => {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    getProfile: async () => {
        const response = await api.get('/auth/profile');
        return response.data;
    },

    updateProfile: async (data) => {
        const response = await api.put('/auth/profile', data);
        return response.data;
    },
};

export const userService = {
    getAll: async (params) => {
        const response = await api.get('/users', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/users', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/users/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },
};

export const branchService = {
    getAll: async (params) => {
        const response = await api.get('/branches', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/branches/${id}`);
        return response.data;
    },

    getWarehouses: async () => {
        const response = await api.get('/branches/warehouses');
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/branches', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/branches/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/branches/${id}`);
        return response.data;
    },
};

export const categoryService = {
    getAll: async (params) => {
        const response = await api.get('/categories', { params });
        return response.data;
    },

    getTree: async () => {
        const response = await api.get('/categories/tree');
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/categories/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/categories', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/categories/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/categories/${id}`);
        return response.data;
    },
};

export const productService = {
    getAll: async (params) => {
        const response = await api.get('/products', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/products/${id}`);
        return response.data;
    },

    searchByBarcode: async (barcode) => {
        const response = await api.get(`/products/barcode/${barcode}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/products', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/products/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/products/${id}`);
        return response.data;
    },

    addVariant: async (productId, data) => {
        const response = await api.post(`/products/${productId}/variants`, data);
        return response.data;
    },

    updateVariant: async (productId, variantId, data) => {
        const response = await api.put(`/products/${productId}/variants/${variantId}`, data);
        return response.data;
    },
};

export const inventoryService = {
    getAll: async (params) => {
        const response = await api.get('/inventory', { params });
        return response.data;
    },

    getByBranch: async (branchId, params) => {
        const response = await api.get(`/inventory/branch/${branchId}`, { params });
        return response.data;
    },

    getLowStock: async (params) => {
        const response = await api.get('/inventory/low-stock', { params });
        return response.data;
    },

    updateStock: async (data) => {
        const response = await api.put('/inventory/stock', data);
        return response.data;
    },

    adjustStock: async (data) => {
        const response = await api.post('/inventory/adjust', data);
        return response.data;
    },
};

export const transferService = {
    getAll: async (params) => {
        const response = await api.get('/transfers', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/transfers/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/transfers', data);
        return response.data;
    },

    updateStatus: async (id, status) => {
        const response = await api.put(`/transfers/${id}/status`, { status });
        return response.data;
    },

    cancel: async (id) => {
        const response = await api.delete(`/transfers/${id}`);
        return response.data;
    },
};

export const supplierService = {
    getAll: async (params) => {
        const response = await api.get('/suppliers', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/suppliers/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/suppliers', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/suppliers/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/suppliers/${id}`);
        return response.data;
    },
};

export const purchaseService = {
    getAll: async (params) => {
        const response = await api.get('/purchases', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/purchases/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/purchases', data);
        return response.data;
    },

    receive: async (id, items) => {
        const response = await api.post(`/purchases/${id}/receive`, { items });
        return response.data;
    },

    cancel: async (id) => {
        const response = await api.delete(`/purchases/${id}`);
        return response.data;
    },
};

export const saleService = {
    getAll: async (params) => {
        const response = await api.get('/sales', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/sales/${id}`);
        return response.data;
    },

    getByInvoice: async (invoiceNumber) => {
        const response = await api.get(`/sales/invoice/${invoiceNumber}`);
        return response.data;
    },

    refund: async (id, data) => {
        const response = await api.post(`/sales/${id}/refund`, data);
        return response.data;
    },
};

export const posService = {
    getProducts: async (params) => {
        const response = await api.get('/pos/products', { params });
        return response.data;
    },

    getCategories: async () => {
        const response = await api.get('/pos/categories');
        return response.data;
    },

    searchByBarcode: async (barcode) => {
        const response = await api.get(`/pos/barcode/${barcode}`);
        return response.data;
    },

    createSale: async (data) => {
        const response = await api.post('/pos/sale', data);
        return response.data;
    },
};

export const dashboardService = {
    getStats: async () => {
        const response = await api.get('/dashboard/stats');
        return response.data;
    },

    getRecentSales: async () => {
        const response = await api.get('/dashboard/recent-sales');
        return response.data;
    },

    getSalesChart: async (days = 7) => {
        const response = await api.get('/dashboard/sales-chart', { params: { days } });
        return response.data;
    },

    getLowStockAlerts: async () => {
        const response = await api.get('/dashboard/low-stock');
        return response.data;
    },

    getTopProducts: async (days = 30, limit = 5) => {
        const response = await api.get('/dashboard/top-products', { params: { days, limit } });
        return response.data;
    },
};

export const reportService = {
    getSalesSummary: async (params) => {
        const response = await api.get('/reports/sales/summary', { params });
        return response.data;
    },

    getSalesByPeriod: async (params) => {
        const response = await api.get('/reports/sales/period', { params });
        return response.data;
    },

    getTopProducts: async (params) => {
        const response = await api.get('/reports/products/top', { params });
        return response.data;
    },

    getInventoryReport: async (params) => {
        const response = await api.get('/reports/inventory', { params });
        return response.data;
    },

    getBranchPerformance: async (params) => {
        const response = await api.get('/reports/branches/performance', { params });
        return response.data;
    },
};

// ==================== RETURN SERVICE ====================
export const returnService = {
    getAll: async (params) => {
        const response = await api.get('/returns', { params });
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/returns/${id}`);
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/returns', data);
        return response.data;
    },
    getReasons: async () => {
        const response = await api.get('/returns/reasons');
        return response.data;
    },
};

// ==================== EXPENSE SERVICE ====================
export const expenseService = {
    getAll: async (params) => {
        const response = await api.get('/expenses', { params });
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/expenses', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/expenses/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/expenses/${id}`);
        return response.data;
    },
    getSummary: async (params) => {
        const response = await api.get('/expenses/summary', { params });
        return response.data;
    },
    getCategories: async () => {
        const response = await api.get('/expenses/categories');
        return response.data;
    },
};

// ==================== SHIFT SERVICE ====================
export const shiftService = {
    getAll: async (params) => {
        const response = await api.get('/shifts', { params });
        return response.data;
    },
    getCurrent: async () => {
        const response = await api.get('/shifts/current');
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/shifts/${id}`);
        return response.data;
    },
    open: async (data) => {
        const response = await api.post('/shifts/open', data);
        return response.data;
    },
    close: async (id, data) => {
        const response = await api.post(`/shifts/${id}/close`, data);
        return response.data;
    },
    addTransaction: async (id, data) => {
        const response = await api.post(`/shifts/${id}/transaction`, data);
        return response.data;
    },
};

// ==================== DISCOUNT SERVICE ====================
export const discountService = {
    getAll: async (params) => {
        const response = await api.get('/discounts', { params });
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/discounts/${id}`);
        return response.data;
    },
    getByCode: async (code) => {
        const response = await api.get(`/discounts/code/${code}`);
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/discounts', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await api.put(`/discounts/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/discounts/${id}`);
        return response.data;
    },
};

// ==================== INSTALLMENT SERVICE ====================
export const installmentService = {
    getAll: async (params) => {
        const response = await api.get('/installments', { params });
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/installments/${id}`);
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/installments', data);
        return response.data;
    },
    addPayment: async (id, data) => {
        const response = await api.post(`/installments/${id}/payment`, data);
        return response.data;
    },
    getOverdue: async () => {
        const response = await api.get('/installments/overdue');
        return response.data;
    },
};

// ==================== AUDIT SERVICE ====================
export const auditService = {
    getAll: async (params) => {
        const response = await api.get('/audit', { params });
        return response.data;
    },
    getSummary: async (params) => {
        const response = await api.get('/audit/summary', { params });
        return response.data;
    },
    getByEntity: async (entity, entityId) => {
        const response = await api.get(`/audit/${entity}/${entityId}`);
        return response.data;
    },
};

// ==================== PRE-ORDER SERVICE ====================
export const preorderService = {
    getAll: async (params) => {
        const response = await api.get('/preorders', { params });
        return response.data;
    },
    checkAvailable: async () => {
        const response = await api.get('/preorders/available');
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/preorders', data);
        return response.data;
    },
    markNotified: async (id) => {
        const response = await api.patch(`/preorders/${id}/notify`);
        return response.data;
    },
    complete: async (id) => {
        const response = await api.patch(`/preorders/${id}/complete`);
        return response.data;
    },
    cancel: async (id) => {
        const response = await api.patch(`/preorders/${id}/cancel`);
        return response.data;
    },
};

// ==================== RECURRING EXPENSE SERVICE ====================
export const recurringService = {
    getAll: async (params) => {
        const response = await api.get('/recurring-expenses', { params });
        return response.data;
    },
    getPending: async () => {
        const response = await api.get('/recurring-expenses/pending');
        return response.data;
    },
    create: async (data) => {
        const response = await api.post('/recurring-expenses', data);
        return response.data;
    },
    pay: async (id) => {
        const response = await api.post(`/recurring-expenses/${id}/pay`);
        return response.data;
    },
    toggleActive: async (id) => {
        const response = await api.patch(`/recurring-expenses/${id}/toggle`);
        return response.data;
    },
    delete: async (id) => {
        const response = await api.delete(`/recurring-expenses/${id}`);
        return response.data;
    },
};

// ==================== COMMISSION SERVICE ====================
export const commissionService = {
    getAll: async (params) => {
        const response = await api.get('/commissions', { params });
        return response.data;
    },
    getSummary: async (params) => {
        const response = await api.get('/commissions/summary', { params });
        return response.data;
    },
    getSettings: async () => {
        const response = await api.get('/commissions/settings');
        return response.data;
    },
    markPaid: async (ids) => {
        const response = await api.post('/commissions/pay', { ids });
        return response.data;
    },
};

// ==================== ANALYTICS SERVICE ====================
export const analyticsService = {
    getProfitability: async (params) => {
        const response = await api.get('/analytics/profitability', { params });
        return response.data;
    },
    getPeakHours: async (params) => {
        const response = await api.get('/analytics/peak-hours', { params });
        return response.data;
    },
    getCentralInventory: async (params) => {
        const response = await api.get('/analytics/central-inventory', { params });
        return response.data;
    },
    getSeasonAlerts: async (params) => {
        const response = await api.get('/analytics/season-alerts', { params });
        return response.data;
    },
};
