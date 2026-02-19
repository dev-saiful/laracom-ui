import apiClient from './client'
import type { ApiResponse, PaginatedResponse, Review } from '@/types'

export const reviewsApi = {
  list: (productSlug: string, params?: { verified?: boolean; page?: number }) =>
    apiClient.get<PaginatedResponse<Review>>(`/products/${productSlug}/reviews`, { params }),

  store: (data: { product_id: string; rating: number; title?: string; body?: string }) =>
    apiClient.post<ApiResponse<Review>>('/reviews', data),

  update: (id: string, data: { rating?: number; title?: string; body?: string }) =>
    apiClient.put<ApiResponse<Review>>(`/reviews/${id}`, data),

  destroy: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/reviews/${id}`),

  markHelpful: (id: string) =>
    apiClient.post<ApiResponse<{ helpful: boolean }>>(`/reviews/${id}/helpful`),
}
