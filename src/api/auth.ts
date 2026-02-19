import apiClient from './client'
import type { ApiResponse, AuthTokens, LoginPayload, OtpPayload, RegisterPayload, User } from '@/types'

export const authApi = {
  register: (data: RegisterPayload) =>
    apiClient.post<ApiResponse<null>>('/auth/register', data),

  verifyOtp: (data: OtpPayload) =>
    apiClient.post<ApiResponse<AuthTokens>>('/auth/verify-otp', data),

  resendOtp: (email: string) =>
    apiClient.post<ApiResponse<null>>('/auth/resend-otp', { email }),

  login: (data: LoginPayload) =>
    apiClient.post<ApiResponse<AuthTokens>>('/auth/login', data),

  refreshToken: (refreshToken: string) =>
    apiClient.post<ApiResponse<AuthTokens>>('/auth/refresh-token', { refresh_token: refreshToken }),

  logout: () =>
    apiClient.post<ApiResponse<null>>('/auth/logout'),

  me: () =>
    apiClient.get<ApiResponse<User>>('/auth/me'),

  updateProfile: (data: { name?: string; phone?: string; current_password?: string; password?: string; password_confirmation?: string }) =>
    apiClient.put<ApiResponse<User>>('/auth/profile', data),

  forgotPassword: (email: string) =>
    apiClient.post<ApiResponse<null>>('/auth/forgot-password', { email }),

  resetPassword: (data: { email: string; token: string; password: string; password_confirmation: string }) =>
    apiClient.post<ApiResponse<null>>('/auth/reset-password', data),
}
