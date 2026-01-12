import { create } from "zustand"
import { persist } from "zustand/middleware"
import { accessTokenCookie, refreshTokenCookie } from "./cookies"

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
        // Cookie'lere kaydet
        if (typeof window !== "undefined") {
          accessTokenCookie.set(tokens.accessToken)
          refreshTokenCookie.set(tokens.refreshToken)
        }
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: tokens.user || null,
        })
      },
      clearAuth: () => {
        // Cookie'lerden temizle
        if (typeof window !== "undefined") {
          accessTokenCookie.remove()
          refreshTokenCookie.remove()
        }
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
        })
      },
      initializeFromStorage: () => {
        // Sayfa yüklendiğinde cookie'lerden token'ları yükle
        if (typeof window !== "undefined") {
          const accessToken = accessTokenCookie.get()
          const refreshToken = refreshTokenCookie.get()
          
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
