"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { useAuthStore } from "@/lib/store"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, isAdmin, isRefreshing } = useAuth()
  const accessToken = useAuthStore((state) => state.accessToken)
  const user = useAuthStore((state) => state.user)
  const fetchUserData = useAuthStore((state) => state.fetchUserData)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    // İlk yüklemede user bilgisini kontrol et
    const initializeAuth = async () => {
      if (accessToken && !user) {
        // Token var ama user yok, backend'den al
        await fetchUserData()
      }
      setIsInitializing(false)
    }

    initializeAuth()
  }, [accessToken, user, fetchUserData])

  useEffect(() => {
    // İlk yükleme tamamlandıktan sonra kontrol et
    if (isInitializing || isRefreshing) {
      return
    }

    // Kullanıcı giriş yapmamışsa veya admin değilse login'e yönlendir
    if (!isAuthenticated || !isAdmin) {
      //router.push("/login")
      console.log("Not authenticated or not admin");
      console.log("isAuthenticated:", isAuthenticated);
      console.log("isAdmin:", isAdmin);
    }
  }, [isAuthenticated, isAdmin, isRefreshing, isInitializing, router])

  // Loading durumunda veya yetkisiz kullanıcıda loading göster
  if (isInitializing || isRefreshing || !isAuthenticated || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
