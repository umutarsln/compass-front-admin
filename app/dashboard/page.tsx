"use client"

import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { useAuth } from "@/hooks/useAuth"

function DashboardContent() {
  const { user, logout, isLoggingOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Yönetim Paneli</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {user?.firstname} {user?.lastname}
            </span>
            <button
              onClick={() => logout()}
              disabled={isLoggingOut}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isLoggingOut ? "Çıkış yapılıyor..." : "Çıkış Yap"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Hoş Geldiniz!</h2>
          <p className="text-gray-600">
            Admin paneline başarıyla giriş yaptınız. Burada e-ticaret yönetim işlemlerinizi
            gerçekleştirebilirsiniz.
          </p>
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
