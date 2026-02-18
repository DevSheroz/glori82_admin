import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.PROD
    ? 'https://glory82-admin-backend-production.up.railway.app/api'
    : '/api',
})

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Redirect to /login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url?.includes('/auth/')) {
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (user_name, password, remember_me) =>
    api.post('/auth/login', { user_name, password, remember_me }),
  me: () => api.get('/auth/me'),
}

export const productsApi = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getLowStock: () => api.get('/products/low-stock'),
  getBrands: (params) => api.get('/products/brands', { params }),
}

export const categoriesApi = {
  getAll: (params) => api.get('/categories', { params }),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
  addAttribute: (id, data) => api.post(`/categories/${id}/attributes`, data),
  updateAttribute: (id, attrId, data) => api.put(`/categories/${id}/attributes/${attrId}`, data),
  deleteAttribute: (id, attrId) => api.delete(`/categories/${id}/attributes/${attrId}`),
}

export const customersApi = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
}

export const ordersApi = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  delete: (id) => api.delete(`/orders/${id}`),
}

export const currencyApi = {
  getRates: (params) => api.get('/currency/rates', { params }),
}

export const dashboardApi = {
  getMetrics: () => api.get('/dashboard/metrics'),
  getSalesOverTime: (params) => api.get('/dashboard/sales-over-time', { params }),
  getTopProducts: (params) => api.get('/dashboard/top-products', { params }),
  getUnpaidOrders: () => api.get('/dashboard/unpaid-orders'),
  getShipmentCosts: () => api.get('/dashboard/shipment-costs'),
  getOrderStatusSummary: () => api.get('/dashboard/order-status-summary'),
  getProfitSummary: () => api.get('/dashboard/profit-summary'),
}

export const shipmentsApi = {
  getAll: (params) => api.get('/shipments', { params }),
  getById: (id) => api.get(`/shipments/${id}`),
  create: (data) => api.post('/shipments', data),
  update: (id, data) => api.put(`/shipments/${id}`, data),
  delete: (id) => api.delete(`/shipments/${id}`),
}

export default api
