import axios from 'axios';

/**
 * Axios API Configuration
 * Centralized HTTP client for all backend API calls
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - attach auth token
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

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle session expiration
    if (error.response?.status === 401) {
      const message = error.response.data?.message;
      if (message === 'Not authorized, token failed' || message === 'Token expired') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth Service
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/update-password', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// User Service
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadAvatar: (data) => api.put('/users/avatar', data),
  getStats: () => api.get('/users/stats'),
};

// Product Service
export const productAPI = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  addReview: (id, data) => api.post(`/products/${id}/reviews`, data),
  getMyProducts: () => api.get('/products/my/products'),
  getCategories: () => api.get('/products/categories'),
};

// Order Service
export const orderAPI = {
  createOrder: (data) => api.post('/orders', data),
  getMyOrders: (params) => api.get('/orders/my-orders', { params }),
  getFarmerOrders: (params) => api.get('/orders/farmer/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  getOrderAnalytics: () => api.get('/orders/farmer/analytics'),
};

// Crop Service
export const cropAPI = {
  getMyCrops: (params) => api.get('/crops', { params }),
  getCrop: (id) => api.get(`/crops/${id}`),
  createCrop: (data) => api.post('/crops', data),
  updateCrop: (id, data) => api.put(`/crops/${id}`, data),
  deleteCrop: (id) => api.delete(`/crops/${id}`),
  addExpense: (id, data) => api.post(`/crops/${id}/expenses`, data),
  getRecommendations: (params) => api.get('/crops/recommendations', { params }),
  getAnalytics: () => api.get('/crops/analytics'),
};

// Chat Service
export const chatAPI = {
  getMyChats: () => api.get('/chat'),
  createChat: (data) => api.post('/chat', data),
  getMessages: (chatId, params) => api.get(`/chat/${chatId}/messages`, { params }),
  sendMessage: (chatId, data) => api.post(`/chat/${chatId}/messages`, data),
  getChatUsers: (params) => api.get('/chat/users', { params }),
  markAsRead: (chatId) => api.put(`/chat/${chatId}/read`),
};

// Expert Service
export const expertAPI = {
  getExperts: (params) => api.get('/expert/list', { params }),
  getConsultations: (params) => api.get('/expert/consultations', { params }),
  createConsultation: (data) => api.post('/expert/consultations', data),
  getConsultation: (id) => api.get(`/expert/consultations/${id}`),
  respond: (id, data) => api.post(`/expert/consultations/${id}/respond`, data),
  updateStatus: (id, data) => api.put(`/expert/consultations/${id}/status`, data),
  rate: (id, data) => api.post(`/expert/consultations/${id}/rate`, data),
};

// AI Chat Service
export const aiAPI = {
  chat: (data) => api.post('/ai/chat', data),
  getStatus: () => api.get('/ai/status'),
};

// Admin Service
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  toggleUserStatus: (id) => api.put(`/admin/users/${id}/toggle-status`),
  getProducts: (params) => api.get('/admin/products', { params }),
  getOrders: (params) => api.get('/admin/orders', { params }),
  sendNotification: (data) => api.post('/admin/notifications', data),
  getReports: (params) => api.get('/admin/reports', { params }),
};

