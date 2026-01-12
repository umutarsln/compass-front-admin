"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, isAdmin, isRefreshing } = useAuth()

  useEffect(() => {
    // Refresh işlemi devam ediyorsa bekle
    if (isRefreshing) {
      return
    }

    // Kullanıcı giriş yapmamışsa veya admin değilse login'e yönlendir
    if (!isAuthenticated || !isAdmin) {
      router.push("/login")
    }
  }, [isAuthenticated, isAdmin, isRefreshing, router])

  // Loading durumunda veya yetkisiz kullanıcıda null döndür
  if (isRefreshing || !isAuthenticated || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
