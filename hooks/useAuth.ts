"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { authService, LoginDto } from "@/services/auth.service"
import { useAuthStore } from "@/lib/store"
import { accessTokenCookie, refreshTokenCookie } from "@/lib/cookies"
import { useToast } from "@/components/ui/use-toast"
import { useEffect } from "react"

export function useAuth() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { accessToken, refreshToken, user, setAuth, clearAuth } = useAuthStore()


  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginDto) => {
      const response = await authService.login(data)
      return response
    },
    onSuccess: (data) => {
      // Zustand store'a kaydet (cookie'ler otomatik set edilir)
      // Backend'den gelen user'ı roles array'i ile birlikte kaydet
      const userData = data.user
        ? {
          ...data.user,
          roles: (data.user as any).roles || [],
        }
        : undefined

      console.log("userData:", userData);

      setAuth({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: userData,
      })

      // Başarı mesajı göster
      toast({
        variant: "success",
        title: "Giriş Başarılı",
        description: "Yönetim paneline yönlendiriliyorsunuz...",
      })

      // Panel'e yönlendir
      router.push("/panel/dashboard")
    },
    onError: (error: any) => {
      // Sadece 500+ server hatalarını logla
      const status = error.response?.status
      if (status && status >= 500) {
        console.error("Login server error:", error)
      }
      // 4xx hatalarını (401, 403 vb.) sessizce handle et, throw etme
      if (status && status < 500) {
        // Client hatası, sessizce handle et
        return
      }
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
      // Zustand store'u temizle (cookie'ler otomatik temizlenir)
      clearAuth()

      // Query cache'i temizle
      queryClient.clear()

      // Başarı mesajı göster
      toast({
        variant: "success",
        title: "Çıkış Yapıldı",
        description: "Güvenli bir şekilde çıkış yaptınız.",
      })

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
      // Zustand store'u güncelle (cookie'ler otomatik set edilir)
      // refreshToken mutationFn'de zaten null kontrolü yapıldı, bu noktada null olamaz
      setAuth({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken || refreshToken!,
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
  const isAdmin = user?.roles?.includes("ADMIN") ?? false

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
