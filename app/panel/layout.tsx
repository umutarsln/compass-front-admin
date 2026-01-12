"use client"

import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"

export default function PanelLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <ProtectedRoute>
            <div className="flex h-screen w-full overflow-hidden bg-background">
                {/* Sidebar */}
                <Sidebar />

                {/* Main Content Area */}
                <main className="flex flex-1 flex-col overflow-y-auto bg-background">
                    {/* Header */}
                    <Header />

                    {/* Page Content */}
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    )
}
