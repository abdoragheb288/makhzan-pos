import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        // Check if this is a superadmin request
        const isSuperAdminRequest = config.url?.includes('/superadmin');

        // Use appropriate token - sessionStorage for tab isolation
        const token = isSuperAdminRequest
            ? sessionStorage.getItem('superAdminToken')
            : sessionStorage.getItem('token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Check if this was a superadmin request
            const isSuperAdminRequest = error.config?.url?.includes('/superadmin');

            if (isSuperAdminRequest) {
                sessionStorage.removeItem('superAdminToken');
                sessionStorage.removeItem('superAdmin');
                // Only redirect if we're on a superadmin page
                if (window.location.pathname.startsWith('/superadmin') &&
                    window.location.pathname !== '/superadmin/login') {
                    window.location.href = '/superadmin/login';
                }
            } else {
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('user');
                // Only redirect if we're NOT on a superadmin page
                if (!window.location.pathname.startsWith('/superadmin')) {
                    window.location.href = '/login';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
