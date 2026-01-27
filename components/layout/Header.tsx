"use client"

import { useState } from "react"
import { Search, Bell, ArrowLeft, Trash2 } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { cacheService } from "@/services/cache.service"
import { useToast } from "@/components/ui/use-toast"

interface HeaderProps {
  title?: string
  hideSidebar?: boolean
}

export function Header({ title, hideSidebar = false }: HeaderProps) {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")
  const [isClearingCache, setIsClearingCache] = useState(false)
  const { isAdmin } = useAuth()
  const { toast } = useToast()

  // Back URL'i belirle
  const getBackUrl = () => {
    if (!pathname) return "/panel/products"

    // Ürün ekleme sayfasından ürünler listesine dön
    if (pathname === "/panel/products/new") {
      return "/panel/products"
    }

    // Ürün düzenleme sayfasından ürünler listesine dön
    if (pathname.startsWith("/panel/products/") && pathname !== "/panel/products") {
      return "/panel/products"
    }

    // Kişiselleştirme form detay sayfasından formlar listesine dön
    if (pathname.startsWith("/panel/personalization/forms/") && pathname !== "/panel/personalization/forms") {
      return "/panel/personalization/forms"
    }

    // Varsayılan olarak dashboard'a dön
    return "/panel/dashboard"
  }

  // Pathname'e göre başlık belirle
  const getPageTitle = () => {
    if (title) return title

    // Exact match'ler için pathMap
    const pathMap: Record<string, string> = {
      "/panel/dashboard": "Ana Sayfa",
      "/panel/orders": "Siparişler",
      "/panel/products": "Ürünler",
      "/panel/products/new": "Ürün Ekle",
      "/panel/customers": "Müşteriler",
      "/panel/admins": "Adminler",
      "/panel/media": "Medya",
      "/panel/docs": "Dokümantasyon",
      "/panel/store": "Mağaza",
      "/panel/settings": "Ayarlar",
    }

    // Önce exact match kontrolü
    if (pathname && pathMap[pathname]) {
      return pathMap[pathname]
    }

    // Dinamik route'lar için pattern matching
    if (pathname) {
      // Ürün düzenleme sayfası: /panel/products/[slug]
      if (pathname.startsWith("/panel/products/") && pathname !== "/panel/products/new") {
        return "Ürün Düzenle"
      }

      // Sipariş detay sayfası: /panel/orders/[id]
      if (pathname.startsWith("/panel/orders/") && pathname !== "/panel/orders") {
        return "Sipariş Detayı"
      }

      // Dokümantasyon detay sayfası: /panel/docs/[module]
      if (pathname.startsWith("/panel/docs/") && pathname !== "/panel/docs") {
        return "Dokümantasyon"
      }
    }

    return "Ana Sayfa"
  }

  // Cache temizleme fonksiyonu
  const handleClearCache = async () => {
    if (!isAdmin) {
      toast({
        variant: "destructive",
        title: "Yetkisiz İşlem",
        description: "Bu işlem için admin yetkisi gereklidir.",
      })
      return
    }

    setIsClearingCache(true)
    try {
      const result = await cacheService.clearCache()
      toast({
        variant: "success",
        title: "Cache Temizlendi",
        description: result.deletedKeys === -1
          ? "Tüm cache başarıyla temizlendi."
          : `${result.deletedKeys} adet cache key başarıyla temizlendi.`,
      })
    } catch (error: any) {
      console.error("Cache temizleme hatası:", error)
      toast({
        variant: "destructive",
        title: "Hata",
        description: error?.response?.data?.message || "Cache temizlenirken bir hata oluştu.",
      })
    } finally {
      setIsClearingCache(false)
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        {hideSidebar && (
          <Link
            href={getBackUrl()}
            className="flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )}
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

        {/* Cache Clear Button (Admin Only) */}
        {isAdmin && (
          <button
            onClick={handleClearCache}
            disabled={isClearingCache}
            className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-hover hover:text-foreground transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Tüm Cache'leri Temizle"
          >
            <Trash2 className={`w-4 h-4 ${isClearingCache ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Cache Temizle</span>
          </button>
        )}

        {/* Notifications */}
        <button className="relative flex items-center justify-center rounded-full text-muted-foreground hover:bg-hover hover:text-foreground transition-all duration-200 p-2 hover:scale-110 active:scale-95 group">
          <Bell className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
        </button>
      </div>
    </header>
  )
}
