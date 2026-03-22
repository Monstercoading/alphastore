import axios from 'axios';

// 🔧 FIXED: Use environment variables with fallbacks
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://alphastore-6rvv.onrender.com/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://alphastore-6rvv.onrender.com';

console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🔗 Socket URL:', SOCKET_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Add timeout for better error handling
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.log('401 error detected:', error.response.data);
      console.log('Current token:', localStorage.getItem('token'));
      console.log('Current user:', localStorage.getItem('user'));
      
      // Don't auto-logout immediately, let the component handle it
      // This prevents redirect loops and allows better error handling
      // localStorage.removeItem('token');
      // localStorage.removeItem('user');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (userData: any) => api.post('/auth/register', userData),
  verifyToken: () => api.get('/auth/verify'),
  googleAuth: (code: string, flow?: string) => api.post('/auth/google', { code, flow }),
};

// Games APIs - Use products endpoint
export const gamesAPI = {
  getGames: (filters?: any) => api.get('/products', { params: filters }),
  getGame: (id: string) => api.get(`/products/${id}`),
  createGame: (gameData: any) => api.post('/products', gameData),
  updateGame: (id: string, gameData: any) => api.put(`/products/${id}`, gameData),
  deleteGame: (id: string) => api.delete(`/products/${id}`),
};

// Orders APIs
export const ordersAPI = {
  createOrder: (orderData: any) => api.post('/orders', orderData),
  getMyOrders: () => api.get('/orders/my-orders'),
  getAllOrders: () => api.get('/orders'),
  updateOrderStatus: (id: string, status: string) => api.put(`/orders/${id}/status`, { status }),
};

// Admin APIs - Use real API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  getOrders: () => api.get('/admin/orders'),
  getGames: () => api.get('/products'),
  updateOrderStatus: (id: string, status: string) => api.put(`/admin/orders/${id}/status`, { status }),
};

// Upload APIs
export const uploadAPI = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  uploadImages: (files: File[]) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`images`, file);
    });
    return api.post('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default api;
" " 
