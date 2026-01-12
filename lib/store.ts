import { create } from "zustand"
import { persist } from "zustand/middleware"
import { accessTokenCookie, refreshTokenCookie } from "./cookies"
import api from "./api"

export interface AuthUser {
  id: string
  email: string
  firstname: string
  lastname: string
  phone: string
  roles: string[]
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
  fetchUserData: () => Promise<void>
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

          // Eğer cookie'lerde token varsa ama store'da yoksa, cookie'lerden yükle
          const currentState = get()
          if (accessToken && refreshToken && (!currentState.accessToken || !currentState.refreshToken)) {
            set({
              accessToken,
              refreshToken,
            })
          }
        }
      },
      fetchUserData: async () => {
        // User bilgisini backend'den al
        const currentState = get()
        if (currentState.accessToken && !currentState.user) {
          try {
            const response = await api.get('/users/me')
            const userData = response.data

            console.log("userData:", userData);

            set({
              user: {
                id: userData.id,
                email: userData.email,
                firstname: userData.firstname,
                lastname: userData.lastname,
                phone: userData.phone,
                roles: userData.roles || [],
                createdAt: userData.createdAt,
                updatedAt: userData.updatedAt,
              },
            })
          } catch (error: any) {
            console.error('Failed to fetch user data:', error)
            // Token geçersizse temizle
            if (error.response?.status === 401) {
              get().clearAuth()
            }
          }
        }
      },
    }),
    {
      name: "auth-storage",
    }
  )
)
