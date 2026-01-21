"use client"

import { useAuth } from "@/hooks/useAuth"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Settings,
  Store,
  LogOut,
  Shield,
  Image,
  BookOpen,
} from "lucide-react"

interface NavItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
}

const navItems: NavItem[] = [
  {
    label: "Ana Sayfa",
    icon: LayoutDashboard,
    path: "/panel/dashboard",
  },
  {
    label: "Siparişler",
    icon: ShoppingCart,
    path: "/panel/orders",
  },
  {
    label: "Ürünler",
    icon: Package,
    path: "/panel/products",
  },
  {
    label: "Mağaza",
    icon: Store,
    path: "/panel/store",
  },
  {
    label: "Müşteriler",
    icon: Users,
    path: "/panel/customers",
  },
  {
    label: "Adminler",
    icon: Shield,
    path: "/panel/admins",
  },
  {
    label: "Medya",
    icon: Image,
    path: "/panel/media",
  },
  {
    label: "Dokümantasyon",
    icon: BookOpen,
    path: "/panel/docs",
  },
  {
    label: "Ayarlar",
    icon: Settings,
    path: "/panel/settings",
  },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    logout()
  }

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-card">
      <div className="flex h-full flex-col justify-between p-4">
        <div className="flex flex-col gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 cursor-pointer group">
            <div className="bg-primary/10 flex items-center justify-center rounded-lg size-10 text-primary group-hover:bg-primary/20 transition-all duration-200 group-hover:scale-105">
              <Store className="text-2xl" />
            </div>
            <h1 className="text-lg font-bold leading-normal tracking-tight text-foreground group-hover:text-primary transition-colors duration-200">
              Admin Paneli
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2 mt-4">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.path || pathname.startsWith(item.path + "/")

              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium leading-normal transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-hover hover:text-foreground hover:shadow-sm active:scale-[0.98]"
                  )}
                >
                  <Icon className={cn(
                    "w-5 h-5 transition-transform duration-200",
                    !isActive && "group-hover:scale-110"
                  )} />
                  <p>{item.label}</p>
                </button>
              )
            })}
          </nav>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 px-3 py-4 border-t border-border group">
          <div className="bg-primary/10 flex items-center justify-center rounded-full size-10 text-primary font-semibold group-hover:bg-primary/20 transition-all duration-200 group-hover:scale-105 cursor-pointer">
            {user?.firstname?.[0]?.toUpperCase() || "A"}
            {user?.lastname?.[0]?.toUpperCase() || ""}
          </div>
          <div className="flex flex-col flex-1 min-w-0 cursor-pointer">
            <p className="text-sm font-medium leading-tight text-foreground truncate group-hover:text-primary transition-colors duration-200">
              {user?.firstname} {user?.lastname}
            </p>
            <p className="text-xs text-muted-foreground truncate group-hover:text-foreground transition-colors duration-200">
              {user?.email || "admin@example.com"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 hover:scale-110 active:scale-95"
            title="Çıkış Yap"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
