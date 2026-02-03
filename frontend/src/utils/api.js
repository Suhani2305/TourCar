import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const STORAGE_URL = API_URL.replace('/api', '');

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
    sendOTP: (data) => api.post('/auth/send-otp', data), // New OTP flow
    verifyOTP: (data) => api.post('/auth/verify-otp', data), // Verify OTP
    resendOTP: (email) => api.post('/auth/resend-otp', { email }), // Resend OTP
    login: (data) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
    getAllUsers: () => api.get('/auth/users'),
    getUsersList: () => api.get('/auth/users/list'), // For super admin filtering
    createUser: (data) => api.post('/auth/create-user', data),
    approveUser: (id) => api.put(`/auth/users/${id}/approve`),
    pauseUser: (id) => api.put(`/auth/users/${id}/pause`),
    deleteUser: (id) => api.delete(`/auth/users/${id}`),
    // Profile & Password Recovery
    updateProfile: (data) => api.put('/auth/update-profile', data),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    verifyResetOTP: (data) => api.post('/auth/verify-reset-otp', data),
    resetPassword: (data) => api.post('/auth/reset-password', data),
    sendProfilePasswordOTP: () => api.post('/auth/profile/send-password-otp'),
    changePasswordVerified: (data) => api.post('/auth/profile/change-password-verified', data)
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
    getDashboardStats: () => api.get('/bookings/stats/dashboard'), // Dashboard statistics
    getCalendarBookings: (params) => api.get('/bookings/calendar', { params }), // Calendar view
    getAllUsers: () => api.get('/auth/users'), // Get all users for filtering
    getRevenueReport: (params) => api.get('/reports/revenue', { params }), // Revenue report
    getBookingAnalytics: (params) => api.get('/reports/booking-analytics', { params }), // Booking analytics
    getVehicleUtilization: (params) => api.get('/reports/vehicle-utilization', { params }) // Vehicle utilization
};

// Expense API calls
export const expenseAPI = {
    getAll: () => api.get('/expenses'),
    create: (data) => api.post('/expenses', data),
    delete: (id) => api.delete(`/expenses/${id}`)
};

// Document API calls
export const documentAPI = {
    getAll: () => api.get('/documents'),
    uploadImage: (formData) => api.post('/documents/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    }),
    create: (data) => api.post('/documents', data),
    delete: (id) => api.delete(`/documents/${id}`)
};

export default api;
