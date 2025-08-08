// Get API base URL from environment variables
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "http://95.169.205.185:3333"

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
    packager: (id: string) => `${API_BASE_URL}/orders/packager/${id}`,
    payment: (id: string) => `${API_BASE_URL}/orders/${id}/payment`,
    assignPackager: `${API_BASE_URL}/orders/packager`,
    assignPackagerToOrder: (id: string) => `${API_BASE_URL}/orders/packager/${id}`,
    recordPayment: (id: string) => `${API_BASE_URL}/orders/${id}/payment`,
    updatePayment: (id: string) => `${API_BASE_URL}/orders/payment/${id}`,
  },

  // Product endpoints
  products: {
    list: `${API_BASE_URL}/products`,
    create: `${API_BASE_URL}/products`,
    update: (id: string) => `${API_BASE_URL}/products/${id}`,
    delete: (id: string) => `${API_BASE_URL}/products/${id}`,
    categories: `${API_BASE_URL}/products/category`,
    upload: `${API_BASE_URL}/products/upload`,
    warehouse: {
      list: `${API_BASE_URL}/products`,
      create: `${API_BASE_URL}/products`,
      // create: `${API_BASE_URL}/warehouse/products`,
      bulkUpload: `${API_BASE_URL}/products/bulk-upload`,
    },
  },

  // Analytics endpoints
  analytics: {
    dashboard: `${API_BASE_URL}/analytics/dashboard`,
    sales: `${API_BASE_URL}/analytics/sales`,
    users: `${API_BASE_URL}/analytics/users`,
  },

  // Activity logs
  activities: {
    list: `${API_BASE_URL}/users/activity-logs`,
    byUser: (userId: string) => `${API_BASE_URL}/users/${userId}/activity-logs`,
    create: `${API_BASE_URL}/activities`,
  },

  // Shop endpoints
  shops: {
    list: `${API_BASE_URL}/shops`,
    create: `${API_BASE_URL}/shops`,
    update: (id: string) => `${API_BASE_URL}/shops/${id}`,
    delete: (id: string) => `${API_BASE_URL}/shops/${id}`,
    report: (id: string) => `${API_BASE_URL}/shops/${id}/report`,
    assignProduct: `${API_BASE_URL}/shops/assign-product`,
    unassignProduct: `${API_BASE_URL}/shops/unassign-product`,
    assignMultipleProducts: `${API_BASE_URL}/shops/assign-multiple-products`,
    products: {
      all: `${API_BASE_URL}/shops/products/all`,
      byShop: (shopId: string) => `${API_BASE_URL}/shops/${shopId}/products`,
      available: `${API_BASE_URL}/shops/products/available`,
      // Shop staff endpoint for viewing their shop's assigned products
      myShopProducts: (userShopId: string) => `${API_BASE_URL}/warehouses/shop/${userShopId}/products`,
    },
  },

  // Warehouse endpoints
  warehouses: {
    list: `${API_BASE_URL}/warehouses`,
    create: `${API_BASE_URL}/warehouses`,
    update: (id: string) => `${API_BASE_URL}/warehouses/${id}`,
    delete: (id: string) => `${API_BASE_URL}/warehouses/${id}`,
    report: (id: string) => `${API_BASE_URL}/warehouses/${id}/report`,
    assignProduct: `${API_BASE_URL}/warehouses/assign-product`,
    products: {
      all: `${API_BASE_URL}/warehouses/products`,
      byWarehouse: (warehouseId: string) => `${API_BASE_URL}/warehouses/${warehouseId}/products`,
    },
  },
}

// Helper function to get auth headers
export const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
})

export default api
