"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { authService, LoginDto } from "@/services/auth.service"
import { useAuthStore } from "@/lib/store"

export function useAuth() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { accessToken, refreshToken, user, setAuth, clearAuth } = useAuthStore()

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginDto) => {
      const response = await authService.login(data)
      return response
    },
    onSuccess: (data) => {
      // Token'ları localStorage'a kaydet
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", data.accessToken)
        localStorage.setItem("refreshToken", data.refreshToken)
      }
      
      // Zustand store'a kaydet
      setAuth({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user || undefined,
      })

      // Dashboard'a yönlendir
      router.push("/dashboard")
    },
    onError: (error: any) => {
      console.error("Login error:", error)
      throw error
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        try {
          await authService.logout({ refreshToken })
        } catch (error) {
          // Logout hatası olsa bile client-side temizlik yap
          console.error("Logout error:", error)
        }
      }
    },
    onSuccess: () => {
      // LocalStorage'dan token'ları temizle
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")
      }

      // Zustand store'u temizle
      clearAuth()

      // Query cache'i temizle
      queryClient.clear()

      // Login sayfasına yönlendir
      router.push("/login")
    },
  })

  // Refresh token mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      if (!refreshToken) {
        throw new Error("Refresh token bulunamadı")
      }
      const response = await authService.refresh({ refreshToken })
      return response
    },
    onSuccess: (data) => {
      // Yeni token'ları localStorage'a kaydet
      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", data.accessToken)
        if (data.refreshToken) {
          localStorage.setItem("refreshToken", data.refreshToken)
        }
      }

      // Zustand store'u güncelle
      setAuth({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || refreshToken,
        user: user || undefined,
      })
    },
    onError: () => {
      // Refresh token geçersizse logout yap
      logoutMutation.mutate()
    },
  })

  // Login fonksiyonu
  const login = (data: LoginDto) => {
    loginMutation.mutate(data)
  }

  // Logout fonksiyonu
  const logout = () => {
    logoutMutation.mutate()
  }

  // Refresh token fonksiyonu
  const refresh = () => {
    refreshMutation.mutate()
  }

  // Kullanıcı giriş yapmış mı?
  const isAuthenticated = !!accessToken && !!user

  // Kullanıcı admin mi?
  const isAdmin = user?.role === "ADMIN"

  return {
    // State
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isAdmin,

    // Actions
    login,
    logout,
    refresh,

    // Loading states
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    isRefreshing: refreshMutation.isPending,

    // Errors
    loginError: loginMutation.error,
    logoutError: logoutMutation.error,
    refreshError: refreshMutation.error,
  }
}
