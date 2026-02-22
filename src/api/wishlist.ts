import apiClient from './client'
import type { ApiResponse, WishlistItem } from '@/types'

export const wishlistApi = {
  // Get user's wishlist
  get: () =>
    apiClient.get<ApiResponse<WishlistItem[]>>('/wishlist'),

  // Get wishlist count
  count: () =>
    apiClient.get<ApiResponse<{ count: number }>>('/wishlist/count'),

  // Add product to wishlist
  add: (productId: string) =>
    apiClient.post<ApiResponse<WishlistItem>>('/wishlist', { product_id: productId }),

  // Check if product is in wishlist
  check: (productId: string) =>
    apiClient.get<ApiResponse<{ in_wishlist: boolean }>>(`/wishlist/check/${productId}`),

  // Remove product from wishlist
  remove: (productId: string) =>
    apiClient.delete<ApiResponse<null>>(`/wishlist/${productId}`),

  // Clear entire wishlist
  clear: () =>
    apiClient.delete<ApiResponse<{ removed_count: number }>>('/wishlist'),
}
