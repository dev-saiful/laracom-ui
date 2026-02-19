import apiClient from './client'
import type { ApiResponse, Category, InventoryStats, Order, OrderStats, PaginatedResponse, Product, User, UserStats } from '@/types'

export const adminApi = {
  // Products
  products: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get<PaginatedResponse<Product>>('/admin/products', { params }),
    store: (data: Record<string, unknown>) =>
      apiClient.post<ApiResponse<Product>>('/admin/products', data),
    show: (id: string) =>
      apiClient.get<ApiResponse<Product>>(`/admin/products/${id}`),
    update: (id: string, data: Record<string, unknown>) =>
      apiClient.put<ApiResponse<Product>>(`/admin/products/${id}`, data),
    destroy: (id: string) =>
      apiClient.delete<ApiResponse<null>>(`/admin/products/${id}`),
    duplicate: (id: string) =>
      apiClient.post<ApiResponse<Product>>(`/admin/products/${id}/duplicate`),
    toggleActive: (id: string) =>
      apiClient.patch<ApiResponse<{ is_active: boolean }>>(`/admin/products/${id}/toggle-active`),
    toggleFeatured: (id: string) =>
      apiClient.patch<ApiResponse<{ is_featured: boolean }>>(`/admin/products/${id}/toggle-featured`),
  },

  // Orders
  orders: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get<PaginatedResponse<Order>>('/admin/orders', { params }),
    statistics: () =>
      apiClient.get<ApiResponse<OrderStats>>('/admin/orders/statistics'),
    show: (id: string) =>
      apiClient.get<ApiResponse<Order>>(`/admin/orders/${id}`),
    updateStatus: (id: string, data: { status: string; tracking_number?: string }) =>
      apiClient.patch<ApiResponse<Order>>(`/admin/orders/${id}/status`, data),
  },

  // Users
  users: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get<PaginatedResponse<User>>('/admin/users', { params }),
    statistics: () =>
      apiClient.get<ApiResponse<UserStats>>('/admin/users/statistics'),
    show: (id: string) =>
      apiClient.get<ApiResponse<User>>(`/admin/users/${id}`),
    updateRole: (id: string, role: string) =>
      apiClient.patch<ApiResponse<User>>(`/admin/users/${id}/role`, { role }),
    toggleActive: (id: string) =>
      apiClient.patch<ApiResponse<{ is_active: boolean }>>(`/admin/users/${id}/toggle-active`),
    destroy: (id: string) =>
      apiClient.delete<ApiResponse<null>>(`/admin/users/${id}`),
  },

  // Inventory
  inventory: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get<PaginatedResponse<Product>>('/admin/inventory', { params }),
    statistics: () =>
      apiClient.get<ApiResponse<InventoryStats>>('/admin/inventory/statistics'),
    adjust: (id: string, data: { type: 'product' | 'variant'; adjustment: number; reason?: string }) =>
      apiClient.patch<ApiResponse<unknown>>(`/admin/inventory/${id}/adjust`, data),
    bulkUpdate: (items: Array<{ id: string; type: string; stock: number }>) =>
      apiClient.post<ApiResponse<{ updated: number }>>('/admin/inventory/bulk-update', { items }),
  },

  // Categories
  categories: {
    list: (params?: Record<string, unknown>) =>
      apiClient.get<PaginatedResponse<Category>>('/admin/categories', { params }),
    store: (data: Partial<Category>) =>
      apiClient.post<ApiResponse<Category>>('/admin/categories', data),
    show: (id: string) =>
      apiClient.get<ApiResponse<Category>>(`/admin/categories/${id}`),
    update: (id: string, data: Partial<Category>) =>
      apiClient.put<ApiResponse<Category>>(`/admin/categories/${id}`, data),
    destroy: (id: string) =>
      apiClient.delete<ApiResponse<null>>(`/admin/categories/${id}`),
  },
}
