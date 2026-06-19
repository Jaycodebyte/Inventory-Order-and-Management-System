import axios from 'axios';

// Read API base URL from Vite environment variables or fallback to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Products API endpoints
export const productsApi = {
  getAll: (search = '', skip = 0, limit = 50, sortBy = 'created_at', sortOrder = 'desc') => {
    const params = { skip, limit, sort_by: sortBy, sort_order: sortOrder };
    if (search) params.search = search;
    return api.get('/products', { params });
  },
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

// Customers API endpoints
export const customersApi = {
  getAll: (search = '', skip = 0, limit = 50) => {
    const params = { skip, limit };
    if (search) params.search = search;
    return api.get('/customers', { params });
  },
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  delete: (id) => api.delete(`/customers/${id}`),
};

// Orders API endpoints
export const ordersApi = {
  getAll: (skip = 0, limit = 50) => api.get('/orders', { params: { skip, limit } }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  delete: (id) => api.delete(`/orders/${id}`),
};

// Dashboard Stats endpoint
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;
