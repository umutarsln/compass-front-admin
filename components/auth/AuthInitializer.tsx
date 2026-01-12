"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/lib/store"

interface AuthInitializerProps {
  children: React.ReactNode
}

export function AuthInitializer({ children }: AuthInitializerProps) {
  const initializeFromStorage = useAuthStore((state) => state.initializeFromStorage)

  useEffect(() => {
    // Sayfa yüklendiğinde localStorage'dan token'ları yükle
    initializeFromStorage()
  }, [initializeFromStorage])

  return <>{children}</>
}
