import api from './api';

// Create a separate API instance for superadmin
const superAdminApi = api;

export const superAdminService = {
    // Auth
    async login(email, password) {
        const response = await superAdminApi.post('/superadmin/login', { email, password });
        return response.data;
    },

    async getProfile() {
        const response = await superAdminApi.get('/superadmin/profile');
        return response.data;
    },

    // Dashboard
    async getDashboard() {
        const response = await superAdminApi.get('/superadmin/dashboard');
        return response.data;
    },

    // Tenants
    async getTenants(params) {
        const response = await superAdminApi.get('/superadmin/tenants', { params });
        return response.data;
    },

    async getTenantById(id) {
        const response = await superAdminApi.get(`/superadmin/tenants/${id}`);
        return response.data;
    },

    async createTenant(data) {
        const response = await superAdminApi.post('/superadmin/tenants', data);
        return response.data;
    },

    async updateTenant(id, data) {
        const response = await superAdminApi.put(`/superadmin/tenants/${id}`, data);
        return response.data;
    },

    async suspendTenant(id) {
        const response = await superAdminApi.post(`/superadmin/tenants/${id}/suspend`);
        return response.data;
    },

    async activateTenant(id) {
        const response = await superAdminApi.post(`/superadmin/tenants/${id}/activate`);
        return response.data;
    },

    async deleteTenant(id) {
        const response = await superAdminApi.delete(`/superadmin/tenants/${id}`);
        return response.data;
    },

    // Subscriptions
    async getSubscriptions(params) {
        const response = await superAdminApi.get('/superadmin/subscriptions', { params });
        return response.data;
    },

    async createSubscription(data) {
        const response = await superAdminApi.post('/superadmin/subscriptions', data);
        return response.data;
    },

    async extendSubscription(id, data) {
        const response = await superAdminApi.post(`/superadmin/subscriptions/${id}/extend`, data);
        return response.data;
    },

    async cancelSubscription(id) {
        const response = await superAdminApi.post(`/superadmin/subscriptions/${id}/cancel`);
        return response.data;
    },
};
