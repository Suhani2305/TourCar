import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Auth API calls
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    getAllUsers: () => api.get('/auth/users'),
    getUsersList: () => api.get('/auth/users/list'), // For super admin filtering
    createUser: (data) => api.post('/auth/create-user', data),
    approveUser: (id) => api.put(`/auth/users/${id}/approve`),
    pauseUser: (id) => api.put(`/auth/users/${id}/pause`),
    deleteUser: (id) => api.delete(`/auth/users/${id}`)
};

// Vehicle API calls
export const vehicleAPI = {
    getAll: (params) => api.get('/vehicles', { params }),
    getById: (id) => api.get(`/vehicles/${id}`),
    create: (data) => api.post('/vehicles', data),
    update: (id, data) => api.put(`/vehicles/${id}`, data),
    delete: (id) => api.delete(`/vehicles/${id}`),
    getStats: () => api.get('/vehicles/stats/summary')
};

// Booking API calls
export const bookingAPI = {
    getAll: (params) => api.get('/bookings', { params }),
    getById: (id) => api.get(`/bookings/${id}`),
    create: (data) => api.post('/bookings', data),
    update: (id, data) => api.put(`/bookings/${id}`, data),
    delete: (id) => api.delete(`/bookings/${id}`),
    updateStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
    getStats: () => api.get('/bookings/stats/summary'),
    getDashboardStats: () => api.get('/bookings/stats/dashboard') // Dashboard statistics
};

export default api;
