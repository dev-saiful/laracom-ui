import apiClient from './client'
import type { ApiResponse, CheckoutPayload, Order, PaginatedResponse } from '@/types'

export const ordersApi = {
  checkout: (data: CheckoutPayload) =>
    apiClient.post<ApiResponse<Order>>('/orders/checkout', data),

  guestCheckout: (data: CheckoutPayload & { guest_email: string; guest_phone: string; items: unknown[] }) =>
    apiClient.post<ApiResponse<Order>>('/orders/guest-checkout', data),

  history: (page = 1) =>
    apiClient.get<PaginatedResponse<Order>>('/orders', { params: { page } }),

  show: (id: string) =>
    apiClient.get<ApiResponse<Order>>(`/orders/${id}`),

  cancel: (id: string) =>
    apiClient.post<ApiResponse<Order>>(`/orders/${id}/cancel`),

  track: (orderNumber: string) =>
    apiClient.get<ApiResponse<{ order_number: string; status: string; tracking_number?: string; created_at: string; updated_at: string }>>(`/orders/track/${orderNumber}`),
}
