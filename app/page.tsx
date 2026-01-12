"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isAdmin } = useAuth()

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      router.push("/panel")
    } else {
      router.push("/login")
    }
  }, [isAuthenticated, isAdmin, router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Yönlendiriliyor...</p>
      </div>
    </div>
  )
}
