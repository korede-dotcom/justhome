const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"

export const api = {
  baseURL: API_BASE_URL,

  // Auth endpoints
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    refresh: `${API_BASE_URL}/auth/refresh`,
  },

  // User endpoints
  users: {
    list: `${API_BASE_URL}/users`,
    create: `${API_BASE_URL}/users`,
    update: (id: string) => `${API_BASE_URL}/users/${id}`,
    delete: (id: string) => `${API_BASE_URL}/users/${id}`,
  },

  // Order endpoints
  orders: {
    list: `${API_BASE_URL}/orders`,
    create: `${API_BASE_URL}/orders`,
    update: (id: string) => `${API_BASE_URL}/orders/${id}`,
    delete: (id: string) => `${API_BASE_URL}/orders/${id}`,
  },

  // Product endpoints
  products: {
    list: `${API_BASE_URL}/products`,
    create: `${API_BASE_URL}/products`,
    update: (id: string) => `${API_BASE_URL}/products/${id}`,
    delete: (id: string) => `${API_BASE_URL}/products/${id}`,
  },

  // Analytics endpoints
  analytics: {
    dashboard: `${API_BASE_URL}/analytics/dashboard`,
    sales: `${API_BASE_URL}/analytics/sales`,
    users: `${API_BASE_URL}/analytics/users`,
  },

  // Activity logs
  activities: {
    list: `${API_BASE_URL}/activities`,
  },
}

export default api
