/**
 * Centralised cookie helpers for auth token storage.
 *
 * Security attributes applied:
 *  - Secure     : cookie is only sent over HTTPS in production
 *  - SameSite   : 'Strict' prevents CSRF by blocking cross-site sends
 *  - path       : '/' — available across the whole app
 *
 * Note: HttpOnly cannot be set from JS. That protection requires the backend
 * to issue cookies directly. For a Bearer-token architecture like this one,
 * Secure + SameSite=Strict is the strongest client-side protection available.
 */

import Cookies from 'js-cookie'

const IS_PROD = import.meta.env.PROD

const BASE_ATTRS: Cookies.CookieAttributes = {
  path: '/',
  sameSite: 'Strict',
  secure: IS_PROD, // only enforce Secure in production (HTTP in dev)
}

// Access token: short-lived, expire matches JWT TTL (default 60 min)
const ACCESS_TOKEN_KEY = 'lc_access'
// Refresh token: longer-lived (20 160 min = 14 days by default)
const REFRESH_TOKEN_KEY = 'lc_refresh'
// Guest session: persists until cleared on login
const SESSION_ID_KEY = 'lc_session'

// ── Token helpers ────────────────────────────────────────────────────────────

export function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  accessTtlMinutes = 60,
  refreshTtlDays = 14,
): void {
  Cookies.set(ACCESS_TOKEN_KEY, accessToken, {
    ...BASE_ATTRS,
    expires: new Date(Date.now() + accessTtlMinutes * 60 * 1000),
  })
  Cookies.set(REFRESH_TOKEN_KEY, refreshToken, {
    ...BASE_ATTRS,
    expires: refreshTtlDays,
  })
}

export function getAccessToken(): string | undefined {
  return Cookies.get(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | undefined {
  return Cookies.get(REFRESH_TOKEN_KEY)
}

export function clearAuthCookies(): void {
  Cookies.remove(ACCESS_TOKEN_KEY, { path: '/' })
  Cookies.remove(REFRESH_TOKEN_KEY, { path: '/' })
}

// ── Session ID (guest cart tracking) ────────────────────────────────────────

export function getOrCreateSessionId(): string {
  let id = Cookies.get(SESSION_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    Cookies.set(SESSION_ID_KEY, id, {
      ...BASE_ATTRS,
      expires: 30, // 30 days — guest cart lifespan
    })
  }
  return id
}

export function clearSessionId(): void {
  Cookies.remove(SESSION_ID_KEY, { path: '/' })
}
