import apiClient from './client'
import type { ApiResponse, Cart } from '@/types'

export const cartApi = {
  get: () =>
    apiClient.get<ApiResponse<Cart>>('/cart'),

  count: () =>
    apiClient.get<ApiResponse<{ count: number }>>('/cart/count'),

  addItem: (data: { product_id: string; product_variant_id?: string; quantity: number }) =>
    apiClient.post<ApiResponse<Cart>>('/cart/items', data),

  updateItem: (itemId: string, quantity: number) =>
    apiClient.put<ApiResponse<Cart>>(`/cart/items/${itemId}`, { quantity }),

  removeItem: (itemId: string) =>
    apiClient.delete<ApiResponse<Cart>>(`/cart/items/${itemId}`),

  clear: () =>
    apiClient.delete<ApiResponse<null>>('/cart'),
}
