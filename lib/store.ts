import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface AuthUser {
  id: string
  email: string
  firstname: string
  lastname: string
  phone: string
  role?: "USER" | "ADMIN"
  createdAt?: string
  updatedAt?: string
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  setAuth: (tokens: { accessToken: string; refreshToken: string; user?: AuthUser }) => void
  clearAuth: () => void
  initializeFromStorage: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setAuth: (tokens) => {
        // LocalStorage'a da kaydet (axios interceptor için)
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", tokens.accessToken)
          localStorage.setItem("refreshToken", tokens.refreshToken)
        }
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: tokens.user || null,
        })
      },
      clearAuth: () => {
        // LocalStorage'dan da temizle
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken")
          localStorage.removeItem("refreshToken")
        }
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
        })
      },
      initializeFromStorage: () => {
        // Sayfa yüklendiğinde localStorage'dan token'ları yükle
        if (typeof window !== "undefined") {
          const accessToken = localStorage.getItem("accessToken")
          const refreshToken = localStorage.getItem("refreshToken")
          
          if (accessToken && refreshToken) {
            set({
              accessToken,
              refreshToken,
            })
          }
        }
      },
    }),
    {
      name: "auth-storage",
    }
  )
)
