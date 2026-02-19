import type { AxiosError } from 'axios'

export interface ApiErrorBody {
  success: false
  error?: string
  errorCode?: string
  fieldErrors?: Record<string, string>
  message?: string
}

/**
 * Extract a human-readable message from any thrown value.
 * Works with Axios errors, plain Errors, and strings.
 */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!err) return fallback

  const axiosErr = err as AxiosError<ApiErrorBody>

  if (axiosErr.response?.data) {
    const body = axiosErr.response.data
    // Prefer specific error field, then message field
    return body.error || body.message || fallback
  }

  // Network / timeout
  if (axiosErr.code === 'ECONNABORTED' || axiosErr.message?.includes('timeout')) {
    return 'Request timed out. Please check your connection and try again.'
  }
  if (axiosErr.code === 'ERR_NETWORK' || !axiosErr.response) {
    return 'Network error. Please check your connection.'
  }

  if (err instanceof Error) return err.message

  return fallback
}

/**
 * Extract field-level validation errors from a 422 response.
 */
export function getFieldErrors(err: unknown): Record<string, string> {
  const axiosErr = err as AxiosError<ApiErrorBody>
  return axiosErr.response?.data?.fieldErrors ?? {}
}

/**
 * Returns true if the error is a specific HTTP status code.
 */
export function isHttpError(err: unknown, status: number): boolean {
  const axiosErr = err as AxiosError
  return axiosErr.response?.status === status
}

/**
 * Returns true if the error is a validation error (422).
 */
export function isValidationError(err: unknown): boolean {
  return isHttpError(err, 422)
}
