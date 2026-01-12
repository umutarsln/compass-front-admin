"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/lib/store"

interface AuthInitializerProps {
  children: React.ReactNode
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const initializeFromStorage = useAuthStore((state) => state.initializeFromStorage)
  const fetchUserData = useAuthStore((state) => state.fetchUserData)
  const accessToken = useAuthStore((state) => state.accessToken)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    // Sayfa yüklendiğinde cookie'lerden token'ları yükle
    initializeFromStorage()
  }, [initializeFromStorage])

  useEffect(() => {
    // Token varsa ama user bilgisi yoksa, backend'den al
    if (accessToken && !user) {
      fetchUserData()
    }
  }, [accessToken, user, fetchUserData])

  return <>{children}</>
}
