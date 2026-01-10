import api from './api';

export const transferService = {
    getAll: async () => {
        const response = await api.get('/transfers');
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/transfers', data);
        return response.data;
    },
};
