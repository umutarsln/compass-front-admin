"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { productService, Product, ProductType, GetProductsParams } from "@/services/product.service"
import { categoryService, Category } from "@/services/category.service"
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Loader2, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SortField = "name" | "basePrice" | "createdAt" | "isActive" | "isFeatured" | null
type SortOrder = "asc" | "desc"

const ITEMS_PER_PAGE = 10

export function ProductList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<ProductType | "all">("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [currentPage, setCurrentPage] = useState(1)

  // Kategorileri getir
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getAll(),
  })

  // Query parametreleri
  const queryParams: GetProductsParams = {
    ...(typeFilter !== "all" && { type: typeFilter }),
    ...(categoryFilter !== "all" && { categoryId: categoryFilter }),
  }

  // Ürün listesi
  const { data: products, isLoading } = useQuery({
    queryKey: ["products", queryParams],
    queryFn: () => productService.getAll(queryParams),
  })

  // Client-side sorting
  const sortedProducts = products
    ? [...products].sort((a, b) => {
        if (!sortField) return 0

        let aValue: string | number | boolean = ""
        let bValue: string | number | boolean = ""

        switch (sortField) {
          case "name":
            aValue = a.name.toLowerCase()
            bValue = b.name.toLowerCase()
            break
          case "basePrice":
            aValue = a.basePrice
            bValue = b.basePrice
            break
          case "createdAt":
            aValue = new Date(a.createdAt).getTime()
            bValue = new Date(b.createdAt).getTime()
            break
          case "isActive":
            aValue = a.isActive
            bValue = b.isActive
            break
          case "isFeatured":
            aValue = a.isFeatured
            bValue = b.isFeatured
            break
        }

        if (typeof aValue === "boolean" && typeof bValue === "boolean") {
          if (aValue === bValue) return 0
          return sortOrder === "asc" ? (aValue ? -1 : 1) : aValue ? 1 : -1
        }

        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
        return 0
      })
    : []

  // Client-side search
  const filteredProducts = sortedProducts.filter((product) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      product.name.toLowerCase().includes(query) ||
      product.sku?.toLowerCase().includes(query) ||
      product.slug.toLowerCase().includes(query)
    )
  })

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, typeFilter, categoryFilter])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4 text-primary" />
    ) : (
      <ArrowDown className="w-4 h-4 text-primary" />
    )
  }

  const getTypeLabel = (type: ProductType) => {
    const labels: Record<ProductType, string> = {
      SIMPLE: "Basit",
      VARIANT: "Varyant",
      BUNDLE: "Paket",
    }
    return labels[type]
  }

  const getTypeColor = (type: ProductType) => {
    const colors: Record<ProductType, string> = {
      SIMPLE: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      VARIANT: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      BUNDLE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    }
    return colors[type]
  }

  const calculateFinalPrice = (product: Product) => {
    if (product.isOnSale && product.discountPercent) {
      return product.basePrice * (1 - product.discountPercent / 100)
    }
    return product.basePrice
  }

  const hasActiveFilters = typeFilter !== "all" || categoryFilter !== "all" || searchQuery

  const clearFilters = () => {
    setTypeFilter("all")
    setCategoryFilter("all")
    setSearchQuery("")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm">
      {/* Filters & Search Bar */}
      <div className="border-b border-border px-6 py-4 space-y-4">
        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ürün ara (isim, SKU, slug)..."
              className="w-full h-12 pl-10 pr-4 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Filtreleri Temizle
            </Button>
          )}
        </div>

        {/* Filter Row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtreler:</span>
          </div>
          
          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ProductType | "all")}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Ürün Tipi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Tipler</SelectItem>
              <SelectItem value="SIMPLE">Basit</SelectItem>
              <SelectItem value="VARIANT">Varyant</SelectItem>
              <SelectItem value="BUNDLE">Paket</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  Ürün Adı
                  {getSortIcon("name")}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Tip
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <button
                  onClick={() => handleSort("basePrice")}
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  Fiyat
                  {getSortIcon("basePrice")}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Kategoriler
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Etiketler
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <button
                  onClick={() => handleSort("isActive")}
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  Durum
                  {getSortIcon("isActive")}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <button
                  onClick={() => handleSort("createdAt")}
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  Oluşturulma
                  {getSortIcon("createdAt")}
                </button>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedProducts && paginatedProducts.length > 0 ? (
              paginatedProducts.map((product) => (
                <tr
                  key={product.id}
                  className="hover:bg-muted/50 transition-colors duration-150"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-foreground">
                        {product.name}
                      </div>
                      {product.slug && (
                        <div className="text-xs text-muted-foreground mt-1">
                          /{product.slug}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                        product.type
                      )}`}
                    >
                      {getTypeLabel(product.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-muted-foreground font-mono">
                      {product.sku || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      {product.isOnSale && product.discountPercent ? (
                        <>
                          <div className="text-sm font-medium text-foreground">
                            ₺{calculateFinalPrice(product).toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground line-through">
                            ₺{product.basePrice.toFixed(2)}
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400">
                            %{product.discountPercent.toFixed(1)} indirim
                          </div>
                        </>
                      ) : (
                        <div className="text-sm font-medium text-foreground">
                          ₺{product.basePrice.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {product.categories && product.categories.length > 0 ? (
                        product.categories.slice(0, 2).map((category: any) => (
                          <span
                            key={category.id}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground"
                          >
                            {category.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                      {product.categories && product.categories.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{product.categories.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {product.tags && product.tags.length > 0 ? (
                        product.tags.slice(0, 2).map((tag: any) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs"
                            style={{
                              backgroundColor: `${tag.color}20`,
                              color: tag.color,
                            }}
                          >
                            {tag.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                      {product.tags && product.tags.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{product.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          product.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {product.isActive ? "Aktif" : "Pasif"}
                      </span>
                      {product.isFeatured && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          Öne Çıkan
                        </span>
                      )}
                      {product.isOnSale && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                          İndirimde
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-muted-foreground">
                      {new Date(product.createdAt).toLocaleDateString("tr-TR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        Düzenle
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        Sil
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center">
                  <div className="text-sm text-muted-foreground">
                    {hasActiveFilters
                      ? "Arama kriterlerine uygun ürün bulunamadı."
                      : "Henüz ürün bulunmuyor."}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info & Pagination */}
      <div className="border-t border-border px-6 py-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {filteredProducts.length > 0 ? (
              <>
                {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} / {filteredProducts.length} ürün gösteriliyor
                {products && products.length !== filteredProducts.length && (
                  <span className="ml-2">
                    ({products.length} üründen filtrelenmiş)
                  </span>
                )}
              </>
            ) : (
              "Ürün bulunamadı"
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Önceki
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="min-w-[40px]"
                      >
                        {page}
                      </Button>
                    )
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return (
                      <span key={page} className="px-2 text-muted-foreground">
                        ...
                      </span>
                    )
                  }
                  return null
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Sonraki
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
