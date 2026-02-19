import apiClient from './client'
import type { ApiResponse, Category, PaginatedResponse, Product, ProductFilters, ReviewStats } from '@/types'

export const productsApi = {
  list: (filters?: ProductFilters) =>
    apiClient.get<PaginatedResponse<Product>>('/products', { params: filters }),

  featured: () =>
    apiClient.get<ApiResponse<Product[]>>('/products/featured'),

  show: (slug: string) =>
    apiClient.get<ApiResponse<Product>>(`/products/${slug}`),

  related: (slug: string) =>
    apiClient.get<ApiResponse<Product[]>>(`/products/${slug}/related`),

  reviewStats: (slug: string) =>
    apiClient.get<ApiResponse<ReviewStats>>(`/products/${slug}/review-stats`),
}

export const categoriesApi = {
  list: () =>
    apiClient.get<ApiResponse<Category[]>>('/categories'),

  show: (slug: string) =>
    apiClient.get<ApiResponse<Category>>(`/categories/${slug}`),
}
