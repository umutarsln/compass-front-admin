"use client"

import { useState } from "react"
import { Search, Bell } from "lucide-react"
import { usePathname } from "next/navigation"

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")

  // Pathname'e göre başlık belirle
  const getPageTitle = () => {
    if (title) return title

    const pathMap: Record<string, string> = {
      "/panel/dashboard": "Ana Sayfa",
      "/panel/orders": "Siparişler",
      "/panel/products": "Ürünler",
      "/panel/customers": "Müşteriler",
      "/panel/admins": "Adminler",
      "/panel/media": "Medya",
      "/panel/docs": "Dokümantasyon",
      "/panel/store": "Mağaza",
      "/panel/settings": "Ayarlar",
    }

    return pathMap[pathname] || "Ana Sayfa"
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold leading-tight text-foreground">
          {getPageTitle()}
        </h2>
      </div>
      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="group flex w-64 items-center rounded-lg bg-muted px-3 py-2 transition-all duration-200 hover:bg-muted/80 focus-within:bg-muted/80 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/30">
          <Search className="text-muted-foreground text-xl w-5 h-5 transition-colors duration-200 group-focus-within:text-primary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ara..."
            className="ml-2 w-full bg-transparent text-sm font-normal text-foreground placeholder-muted-foreground focus:outline-none border-none focus:ring-0 p-0 transition-colors duration-200"
          />
        </div>

        {/* Notifications */}
        <button className="relative flex items-center justify-center rounded-full text-muted-foreground hover:bg-hover hover:text-foreground transition-all duration-200 p-2 hover:scale-110 active:scale-95 group">
          <Bell className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
        </button>
      </div>
    </header>
  )
}
