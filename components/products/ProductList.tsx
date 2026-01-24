"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { productService, Product, ProductType, GetProductsParams } from "@/services/product.service"
import { useToast } from "@/components/ui/use-toast"
import { categoryService, Category } from "@/services/category.service"
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Loader2, Filter, X, Plus, Edit, Trash2, Columns, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type SortField = "name" | "basePrice" | "createdAt" | "isActive" | "isFeatured" | null
type SortOrder = "asc" | "desc"

const ITEMS_PER_PAGE = 10

// Sütun tanımları
type ColumnConfig = {
  id: string
  label: string
  sortable: boolean
  defaultVisible: boolean
  width?: string
  sortField?: SortField
}

const COLUMN_DEFINITIONS: ColumnConfig[] = [
  { id: 'name', label: 'Ürün Adı', sortable: true, defaultVisible: true, sortField: 'name' },
  { id: 'type', label: 'Tip', sortable: false, defaultVisible: false },
  { id: 'sku', label: 'SKU', sortable: false, defaultVisible: false },
  { id: 'price', label: 'Fiyat', sortable: true, defaultVisible: true, sortField: 'basePrice' },
  { id: 'categories', label: 'Kategoriler', sortable: false, defaultVisible: false },
  { id: 'tags', label: 'Etiketler', sortable: false, defaultVisible: false },
  { id: 'status', label: 'Durum', sortable: true, defaultVisible: true, sortField: 'isActive' },
  { id: 'createdAt', label: 'Oluşturulma', sortable: true, defaultVisible: false, sortField: 'createdAt' },
  { id: 'actions', label: 'İşlemler', sortable: false, defaultVisible: true },
]

const DEFAULT_VISIBLE_COLUMNS = COLUMN_DEFINITIONS
  .filter(col => col.defaultVisible)
  .map(col => col.id)

// localStorage hook
const useColumnVisibility = () => {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_VISIBLE_COLUMNS
    const stored = localStorage.getItem('productListColumns')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        return parsed.visibleColumns || DEFAULT_VISIBLE_COLUMNS
      } catch {
        return DEFAULT_VISIBLE_COLUMNS
      }
    }
    return DEFAULT_VISIBLE_COLUMNS
  })

  const updateVisibleColumns = (columns: string[]) => {
    setVisibleColumns(columns)
    localStorage.setItem('productListColumns', JSON.stringify({ visibleColumns: columns }))
  }

  return { visibleColumns, updateVisibleColumns }
}

export function ProductList() {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { visibleColumns, updateVisibleColumns } = useColumnVisibility()
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<ProductType | "all">("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)

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

  // Ürün silme mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
      toast({
        title: "Başarılı",
        description: "Ürün başarıyla silindi.",
      })
      setDeletingProductId(null)
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.response?.data?.message || "Ürün silinirken bir hata oluştu.",
        variant: "destructive",
      })
      setDeletingProductId(null)
    },
  })

  // Ürün silme handler
  const handleDelete = async (product: Product) => {
    if (!confirm(`"${product.name}" ürününü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
      return
    }
    setDeletingProductId(product.id)
    deleteMutation.mutate(product.id)
  }

  // Düzenle butonu handler
  const handleEdit = (product: Product) => {
    router.push(`/panel/products/${product.slug}`)
  }

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
          aValue = Number(a.basePrice)
          bValue = Number(b.basePrice)
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
      return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground opacity-50" />
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-primary" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-primary" />
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
    const basePrice = Number(product.basePrice)
    if (product.isOnSale && product.discountedPrice) {
      return Number(product.discountedPrice)
    }
    return basePrice
  }

  const hasActiveFilters = typeFilter !== "all" || categoryFilter !== "all" || searchQuery

  const clearFilters = () => {
    setTypeFilter("all")
    setCategoryFilter("all")
    setSearchQuery("")
  }

  // Sütun görünürlüğü yönetimi
  const toggleColumn = (columnId: string) => {
    if (columnId === 'actions') return // İşlemler sütunu her zaman görünür olmalı
    const newVisibleColumns = visibleColumns.includes(columnId)
      ? visibleColumns.filter(id => id !== columnId)
      : [...visibleColumns, columnId]
    updateVisibleColumns(newVisibleColumns)
  }

  const selectAllColumns = () => {
    updateVisibleColumns(COLUMN_DEFINITIONS.map(col => col.id))
  }

  const deselectAllColumns = () => {
    updateVisibleColumns(['actions']) // Sadece işlemler sütunu kalır
  }

  const resetToDefault = () => {
    updateVisibleColumns(DEFAULT_VISIBLE_COLUMNS)
  }

  // Görünür sütunları filtrele
  const visibleColumnDefinitions = COLUMN_DEFINITIONS.filter(col => visibleColumns.includes(col.id))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Filters & Search Bar */}
      <div className="border-b border-border p-4 space-y-3">
        {/* Search & Actions */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ürün ara..."
              className="w-full h-10 pl-9 pr-4 rounded-md border border-border bg-background text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          
          {/* Aktif Filtreler */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              {typeFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Tip: {getTypeLabel(typeFilter)}
                  <button
                    onClick={() => setTypeFilter("all")}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {categoryFilter !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Kategori: {categories?.find(c => c.id === categoryFilter)?.name || categoryFilter}
                  <button
                    onClick={() => setCategoryFilter("all")}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Arama: {searchQuery}
                  <button
                    onClick={() => setSearchQuery("")}
                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 gap-1.5 text-xs"
              >
                <X className="w-3 h-3" />
                Temizle
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-9">
                  <Columns className="w-4 h-4" />
                  Sütunlar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Sütunları Seç</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {COLUMN_DEFINITIONS.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={visibleColumns.includes(column.id)}
                    onCheckedChange={() => toggleColumn(column.id)}
                    disabled={column.id === 'actions'}
                  >
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={selectAllColumns}
                  className="text-xs"
                >
                  Tümünü Seç
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={deselectAllColumns}
                  className="text-xs"
                >
                  Tümünü Kaldır
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={resetToDefault}
                  className="text-xs"
                >
                  Varsayılana Dön
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              onClick={() => router.push("/panel/products/new")}
              size="sm"
              className="gap-2 h-9"
            >
              <Plus className="w-4 h-4" />
              Yeni Ürün
            </Button>
          </div>
        </div>

        {/* Filter Row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Filtreler:</span>
          </div>
          
          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ProductType | "all")}>
            <SelectTrigger className="w-[140px] h-9 text-sm">
              <SelectValue placeholder="Ürün Tipi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Tipler</SelectItem>
              <SelectItem value="SIMPLE">Basit</SelectItem>
              <SelectItem value="VARIANT">Varyant</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] h-9 text-sm">
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
      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumnDefinitions.map((column) => (
              <TableHead
                key={column.id}
                className={column.id === 'actions' ? 'text-right' : 'text-left'}
                style={{ width: column.width }}
              >
                {column.sortable && column.sortField ? (
                  <button
                    onClick={() => handleSort(column.sortField!)}
                    className="flex items-center gap-2 hover:text-foreground transition-colors w-full text-left group"
                  >
                    <span className="font-medium text-xs uppercase tracking-wider">{column.label}</span>
                    <span className="ml-auto">
                      {getSortIcon(column.sortField)}
                    </span>
                  </button>
                ) : (
                  <span className="font-medium text-xs uppercase tracking-wider">{column.label}</span>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedProducts && paginatedProducts.length > 0 ? (
            paginatedProducts.map((product) => (
              <TableRow key={product.id}>
                {visibleColumnDefinitions.map((column) => {
                  switch (column.id) {
                    case 'name':
                      return (
                        <TableCell key={column.id}>
                          <div className="flex flex-col gap-1">
                            <div className="font-medium text-foreground">
                              {product.name}
                            </div>
                            {product.subtitle && (
                              <div className="text-xs text-muted-foreground">
                                {product.subtitle}
                              </div>
                            )}
                            {product.slug && (
                              <div className="text-xs text-muted-foreground font-mono">
                                /{product.slug}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      )
                    case 'type':
                      return (
                        <TableCell key={column.id} className="whitespace-nowrap">
                          <Badge
                            variant="secondary"
                            className={getTypeColor(product.type)}
                          >
                            {getTypeLabel(product.type)}
                          </Badge>
                        </TableCell>
                      )
                    case 'sku':
                      return (
                        <TableCell key={column.id} className="whitespace-nowrap">
                          <div className="text-sm text-muted-foreground font-mono">
                            {product.sku || "-"}
                          </div>
                        </TableCell>
                      )
                    case 'price':
                      return (
                        <TableCell key={column.id} className="whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            {product.isOnSale && product.discountedPrice ? (
                              <>
                                <div className="font-semibold text-foreground">
                                  ₺{calculateFinalPrice(product).toFixed(2)}
                                </div>
                                <div className="text-xs text-muted-foreground line-through">
                                  ₺{Number(product.basePrice).toFixed(2)}
                                </div>
                                <Badge variant="outline" className="w-fit text-xs mt-0.5 border-green-500 text-green-700 dark:text-green-400">
                                  İndirimli
                                </Badge>
                              </>
                            ) : (
                              <div className="font-semibold text-foreground">
                                ₺{Number(product.basePrice).toFixed(2)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      )
                    case 'categories':
                      return (
                        <TableCell key={column.id}>
                          <div className="flex flex-wrap gap-1">
                            {product.categories && product.categories.length > 0 ? (
                              <>
                                {product.categories.slice(0, 2).map((category: any) => (
                                  <Badge key={category.id} variant="secondary" className="text-xs">
                                    {category.name}
                                  </Badge>
                                ))}
                                {product.categories.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{product.categories.length - 2}
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                      )
                    case 'tags':
                      return (
                        <TableCell key={column.id}>
                          <div className="flex flex-wrap gap-1">
                            {product.tags && product.tags.length > 0 ? (
                              <>
                                {product.tags.slice(0, 2).map((tag: any) => (
                                  <Badge
                                    key={tag.id}
                                    variant="outline"
                                    className="text-xs"
                                    style={{
                                      borderColor: tag.color,
                                      color: tag.color,
                                    }}
                                  >
                                    {tag.name}
                                  </Badge>
                                ))}
                                {product.tags.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{product.tags.length - 2}
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                      )
                    case 'status':
                      return (
                        <TableCell key={column.id} className="whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant={product.isActive ? "default" : "destructive"}
                              className="w-fit text-xs"
                            >
                              {product.isActive ? "Aktif" : "Pasif"}
                            </Badge>
                            {product.isFeatured && (
                              <Badge variant="outline" className="w-fit text-xs border-yellow-500 text-yellow-700 dark:text-yellow-400">
                                Öne Çıkan
                              </Badge>
                            )}
                            {product.isOnSale && (
                              <Badge variant="outline" className="w-fit text-xs border-orange-500 text-orange-700 dark:text-orange-400">
                                İndirimde
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      )
                    case 'createdAt':
                      return (
                        <TableCell key={column.id} className="whitespace-nowrap">
                          <div className="text-sm text-muted-foreground">
                            {new Date(product.createdAt).toLocaleDateString("tr-TR", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                        </TableCell>
                      )
                    case 'actions':
                      return (
                        <TableCell key={column.id} className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(product)}
                              disabled={deletingProductId === product.id}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Düzenle
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              onClick={() => handleDelete(product)}
                              disabled={deletingProductId === product.id || deleteMutation.isPending}
                            >
                              {deletingProductId === product.id ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4 mr-1" />
                              )}
                              Sil
                            </Button>
                          </div>
                        </TableCell>
                      )
                    default:
                      return null
                  }
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={visibleColumnDefinitions.length} className="text-center py-12">
                <div className="text-sm text-muted-foreground">
                  {hasActiveFilters
                    ? "Arama kriterlerine uygun ürün bulunamadı."
                    : "Henüz ürün bulunmuyor."}
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Footer Info & Pagination */}
      <div className="border-t border-border px-4 py-3 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {filteredProducts.length > 0 ? (
              <>
                <span className="font-medium text-foreground">{startIndex + 1}-{Math.min(endIndex, filteredProducts.length)}</span>
                <span className="mx-1">/</span>
                <span className="font-medium text-foreground">{filteredProducts.length}</span>
                <span className="ml-1">ürün</span>
                {products && products.length !== filteredProducts.length && (
                  <span className="ml-2 text-muted-foreground">
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
