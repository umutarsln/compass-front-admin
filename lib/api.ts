import axios from "axios"
import { accessTokenCookie, refreshTokenCookie } from "./cookies"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.shawk.com.tr"

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Request interceptor - Token ekleme
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = accessTokenCookie.get()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Token yenileme ve hata yönetimi
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    // 401 hatası ve token yenileme denenmemişse
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = refreshTokenCookie.get()
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          })

          const { accessToken, refreshToken: newRefreshToken } = response.data

          accessTokenCookie.set(accessToken)
          if (newRefreshToken) {
            refreshTokenCookie.set(newRefreshToken)
          }

          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh token geçersizse logout
        accessTokenCookie.remove()
        refreshTokenCookie.remove()
        window.location.href = "/login"
        return Promise.reject(refreshError)
      }
    }

    // Sadece 500+ server hatalarını console'a yazdır
    // 4xx client hatalarını (401, 403, 404 vb.) sessizce handle et
    if (status && status >= 500) {
      console.error("Server Error:", {
        status,
        message: error.response?.data?.message || error.message,
        url: originalRequest?.url,
      })
    }

    return Promise.reject(error)
  }
)

export default api
