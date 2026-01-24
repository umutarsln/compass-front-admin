"use client"

import { usePathname } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"

export default function PanelLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    // Ürün ekleme ve düzenleme sayfalarında sidebar'ı gizle
    const hideSidebar = pathname === "/panel/products/new" ||
        (pathname?.startsWith("/panel/products/") && pathname !== "/panel/products")

    return (
        <ProtectedRoute>
            <div className="flex h-screen w-full overflow-hidden bg-background">
                {/* Sidebar - Ürün ekleme/düzenleme sayfalarında gizli */}
                {!hideSidebar && <Sidebar />}

                {/* Main Content Area */}
                <main className="flex flex-1 flex-col overflow-y-auto bg-background">
                    {/* Header - Ürün ekleme/düzenleme sayfalarında gizli */}
                    <Header hideSidebar={hideSidebar} />

                    {/* Page Content */}
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    )
}
