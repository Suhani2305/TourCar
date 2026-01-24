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
    createUser: (data) => api.post('/auth/create-user', data),
    approveUser: (id) => api.put(`/auth/users/${id}/approve`),
    pauseUser: (id) => api.put(`/auth/users/${id}/pause`),
    deleteUser: (id) => api.delete(`/auth/users/${id}`)
};

export default api;
