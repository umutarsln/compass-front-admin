/**
 * Cookie utility functions
 */

// Cookie isimlerini environment'tan al
const ACCESS_TOKEN_COOKIE_NAME =
  process.env.NEXT_PUBLIC_ACCESS_TOKEN_COOKIE_NAME || "accessToken"
const REFRESH_TOKEN_COOKIE_NAME =
  process.env.NEXT_PUBLIC_REFRESH_TOKEN_COOKIE_NAME || "refreshToken"

// Cookie options
const COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 7, // 7 gün (refresh token için)
}

/**
 * Cookie set et
 */
export function setCookie(name: string, value: string, days: number = 7) {
  if (typeof window === "undefined") return

  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)

  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=${COOKIE_OPTIONS.path};SameSite=${COOKIE_OPTIONS.sameSite}${COOKIE_OPTIONS.secure ? ";Secure" : ""}`
}

/**
 * Cookie get et
 */
export function getCookie(name: string): string | null {
  if (typeof window === "undefined") return null

  const nameEQ = name + "="
  const ca = document.cookie.split(";")
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === " ") c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
  }
  return null
}

/**
 * Cookie sil
 */
export function deleteCookie(name: string) {
  if (typeof window === "undefined") return

  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=${COOKIE_OPTIONS.path};`
}

/**
 * Access token cookie işlemleri
 */
export const accessTokenCookie = {
  set: (token: string) => {
    // Access token 15 dakika (0.25 gün)
    setCookie(ACCESS_TOKEN_COOKIE_NAME, token, 0.25)
  },
  get: () => getCookie(ACCESS_TOKEN_COOKIE_NAME),
  remove: () => deleteCookie(ACCESS_TOKEN_COOKIE_NAME),
  name: ACCESS_TOKEN_COOKIE_NAME,
}

/**
 * Refresh token cookie işlemleri
 */
export const refreshTokenCookie = {
  set: (token: string) => {
    // Refresh token 7 gün
    setCookie(REFRESH_TOKEN_COOKIE_NAME, token, 7)
  },
  get: () => getCookie(REFRESH_TOKEN_COOKIE_NAME),
  remove: () => deleteCookie(REFRESH_TOKEN_COOKIE_NAME),
  name: REFRESH_TOKEN_COOKIE_NAME,
}
