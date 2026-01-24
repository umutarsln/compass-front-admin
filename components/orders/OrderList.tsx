"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { orderService, OrderStatus, GetOrdersParams } from "@/services/order.service"
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Loader2, Eye, X, Columns, Filter } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

const statusColors: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  [OrderStatus.PAID]: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  [OrderStatus.PROCESSING]: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  [OrderStatus.SHIPPED]: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400",
  [OrderStatus.DELIVERED]: "bg-green-500/10 text-green-700 dark:text-green-400",
  [OrderStatus.CANCELLED]: "bg-red-500/10 text-red-700 dark:text-red-400",
  [OrderStatus.REFUNDED]: "bg-gray-500/10 text-gray-700 dark:text-gray-400",
}

const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "Beklemede",
  [OrderStatus.PAID]: "Ödendi",
  [OrderStatus.PROCESSING]: "Hazırlanıyor",
  [OrderStatus.SHIPPED]: "Kargoda",
  [OrderStatus.DELIVERED]: "Teslim Edildi",
  [OrderStatus.CANCELLED]: "İptal Edildi",
  [OrderStatus.REFUNDED]: "İade Edildi",
}

type SortField = 'createdAt' | 'updatedAt' | 'total' | 'status' | 'orderNo'
type SortOrder = 'ASC' | 'DESC'

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
  { id: 'orderNo', label: 'Sipariş No', sortable: true, defaultVisible: true, sortField: 'orderNo' },
  { id: 'customer', label: 'Müşteri', sortable: true, defaultVisible: true, sortField: 'createdAt' },
  { id: 'total', label: 'Toplam', sortable: true, defaultVisible: true, sortField: 'total' },
  { id: 'status', label: 'Durum', sortable: true, defaultVisible: true, sortField: 'status' },
  { id: 'date', label: 'Tarih', sortable: true, defaultVisible: true, sortField: 'createdAt' },
  { id: 'updatedAt', label: 'Güncelleme', sortable: true, defaultVisible: false, sortField: 'updatedAt' },
  { id: 'actions', label: 'İşlemler', sortable: false, defaultVisible: true },
]

const DEFAULT_VISIBLE_COLUMNS = COLUMN_DEFINITIONS
  .filter(col => col.defaultVisible)
  .map(col => col.id)

// localStorage hook
const useColumnVisibility = () => {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_VISIBLE_COLUMNS
    const stored = localStorage.getItem('orderListColumns')
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
    localStorage.setItem('orderListColumns', JSON.stringify({ visibleColumns: columns }))
  }

  return { visibleColumns, updateVisibleColumns }
}

export function OrderList() {
  const router = useRouter()
  const { visibleColumns, updateVisibleColumns } = useColumnVisibility()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL")
  const [sortBy, setSortBy] = useState<SortField>("createdAt")
  const [sortOrder, setSortOrder] = useState<SortOrder>("DESC")
  const [page, setPage] = useState(1)
  const limit = 20

  // Debounced search - backend'de arama yapılacak
  const [debouncedSearch, setDebouncedSearch] = useState("")
  
  // Debounce search query
  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1) // Reset to first page on search
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Query parametreleri
  const queryParams: GetOrdersParams = {
    limit,
    offset: (page - 1) * limit,
    ...(statusFilter !== "ALL" && { status: statusFilter }),
    ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
    sortBy,
    sortOrder,
  }

  // Sipariş listesi
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["orders", queryParams],
    queryFn: () => orderService.getAll(queryParams),
  })

  const totalPages = ordersData ? Math.ceil(ordersData.total / limit) : 1

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setSortBy(field)
      setSortOrder('DESC')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground opacity-50" />
    }
    return sortOrder === 'ASC' ? (
      <ArrowUp className="w-3.5 h-3.5 text-primary" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-primary" />
    )
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

  const hasActiveFilters = statusFilter !== "ALL" || searchQuery

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
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sipariş ara..."
              className="pl-9 pr-9 h-10 text-sm"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Filtreler:</span>
            </div>
            
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value as OrderStatus | "ALL")
              setPage(1)
            }}>
              <SelectTrigger className="w-full sm:w-[180px] h-9 text-sm">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tüm Durumlar</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Aktif Filtreler */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                {statusFilter !== "ALL" && (
                  <Badge variant="secondary" className="gap-1">
                    Durum: {statusLabels[statusFilter]}
                    <button
                      onClick={() => setStatusFilter("ALL")}
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
                  onClick={() => {
                    setStatusFilter("ALL")
                    setSearchQuery("")
                  }}
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
            </div>
          </div>
        </div>

        {/* Sipariş Listesi */}
        <div className="overflow-hidden">
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
                          <SortIcon field={column.sortField} />
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
              {!ordersData || ordersData.orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumnDefinitions.length} className="text-center py-8 text-muted-foreground">
                    {debouncedSearch ? "Arama kriterlerine uygun sipariş bulunamadı" : "Sipariş bulunamadı"}
                  </TableCell>
                </TableRow>
              ) : (
                ordersData.orders.map((order) => (
                  <TableRow key={order.id}>
                    {visibleColumnDefinitions.map((column) => {
                      switch (column.id) {
                        case 'orderNo':
                          return (
                            <TableCell key={column.id}>
                              <div className="flex flex-col gap-0.5">
                                <span className="font-mono text-sm font-semibold">{order.orderNo}</span>
                                <span className="text-xs text-muted-foreground font-mono">{order.id.slice(0, 8)}...</span>
                              </div>
                            </TableCell>
                          )
                        case 'customer':
                          return (
                            <TableCell key={column.id}>
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium text-sm">
                                  {order.userId
                                    ? "Kayıtlı Kullanıcı"
                                    : `${order.guestFirstName || ""} ${order.guestLastName || ""}`.trim() || "Misafir"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {order.guestEmail || order.guestPhone || "-"}
                                </span>
                                {order.guestPhone && order.guestEmail && (
                                  <span className="text-xs text-muted-foreground">{order.guestPhone}</span>
                                )}
                              </div>
                            </TableCell>
                          )
                        case 'total':
                          return (
                            <TableCell key={column.id} className="whitespace-nowrap">
                              <span className="font-semibold text-sm">
                                {order.total.toFixed(2)} {order.currency}
                              </span>
                            </TableCell>
                          )
                        case 'status':
                          return (
                            <TableCell key={column.id} className="whitespace-nowrap">
                              <Badge className={statusColors[order.status]}>
                                {statusLabels[order.status]}
                              </Badge>
                            </TableCell>
                          )
                        case 'date':
                          return (
                            <TableCell key={column.id} className="whitespace-nowrap">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm text-foreground">
                                  {format(new Date(order.createdAt), "dd MMM yyyy", { locale: tr })}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(order.createdAt), "HH:mm", { locale: tr })}
                                </span>
                              </div>
                            </TableCell>
                          )
                        case 'updatedAt':
                          return (
                            <TableCell key={column.id} className="whitespace-nowrap">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-sm text-foreground">
                                  {format(new Date(order.updatedAt), "dd MMM yyyy", { locale: tr })}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(order.updatedAt), "HH:mm", { locale: tr })}
                                </span>
                              </div>
                            </TableCell>
                          )
                        case 'actions':
                          return (
                            <TableCell key={column.id} className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/panel/orders/${order.id}`)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Detay
                              </Button>
                            </TableCell>
                          )
                        default:
                          return null
                      }
                    })}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

      </div>

      {/* Footer Info & Pagination */}
      <div className="border-t border-border px-4 py-3 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {ordersData && ordersData.total > 0 ? (
              <>
                <span className="font-medium text-foreground">{ordersData.total}</span>
                <span className="ml-1">sipariş</span>
                {debouncedSearch && (
                  <span className="ml-2 text-muted-foreground">
                    - "<span className="font-medium text-foreground">{debouncedSearch}</span>" için arama sonuçları
                  </span>
                )}
              </>
            ) : (
              "Sipariş bulunamadı"
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
              >
                Önceki
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      className="min-w-[40px]"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isLoading}
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
