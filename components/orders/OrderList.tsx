"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { orderService, OrderStatus, GetOrdersParams } from "@/services/order.service"
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Loader2, Eye, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
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

export function OrderList() {
  const router = useRouter()
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
      return <ArrowUpDown className="w-4 h-4 ml-1 text-muted-foreground" />
    }
    return sortOrder === 'ASC' ? (
      <ArrowUp className="w-4 h-4 ml-1 text-primary" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1 text-primary" />
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-6">
        {/* Advanced Filters */}
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Sipariş no, email, telefon, isim, soyisim, adres ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value as OrderStatus | "ALL")
              setPage(1)
            }}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Durum Filtrele" />
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

            <Select value={sortBy} onValueChange={(value) => {
              setSortBy(value as SortField)
              setPage(1)
            }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sırala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Tarih</SelectItem>
                <SelectItem value="updatedAt">Güncelleme</SelectItem>
                <SelectItem value="total">Tutar</SelectItem>
                <SelectItem value="status">Durum</SelectItem>
                <SelectItem value="orderNo">Sipariş No</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
              className="w-full sm:w-auto"
            >
              {sortOrder === 'ASC' ? <ArrowUp className="w-4 h-4 mr-2" /> : <ArrowDown className="w-4 h-4 mr-2" />}
              {sortOrder === 'ASC' ? 'Artan' : 'Azalan'}
            </Button>
          </div>
        </div>

        {/* Results Info */}
        {ordersData && (
          <div className="text-sm text-muted-foreground">
            Toplam <span className="font-semibold text-foreground">{ordersData.total}</span> sipariş bulundu
            {debouncedSearch && (
              <span className="ml-2">
                - "<span className="font-semibold text-foreground">{debouncedSearch}</span>" için arama sonuçları
              </span>
            )}
          </div>
        )}

        {/* Sipariş Listesi */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button
                    onClick={() => handleSort('orderNo')}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Sipariş No
                    <SortIcon field="orderNo" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('createdAt')}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Müşteri
                    <SortIcon field="createdAt" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('total')}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Toplam
                    <SortIcon field="total" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center hover:text-foreground transition-colors"
                  >
                    Durum
                    <SortIcon field="status" />
                  </button>
                </TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!ordersData || ordersData.orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {debouncedSearch ? "Arama kriterlerine uygun sipariş bulunamadı" : "Sipariş bulunamadı"}
                  </TableCell>
                </TableRow>
              ) : (
                ordersData.orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-semibold">{order.orderNo}</span>
                        <span className="text-xs text-muted-foreground font-mono">{order.id.slice(0, 8)}...</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {order.userId
                            ? "Kayıtlı Kullanıcı"
                            : `${order.guestFirstName || ""} ${order.guestLastName || ""}`.trim() || "Misafir"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {order.guestEmail || order.guestPhone || "-"}
                        </span>
                        {order.guestPhone && order.guestEmail && (
                          <span className="text-xs text-muted-foreground">{order.guestPhone}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {order.total.toFixed(2)} {order.currency}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm text-foreground">
                          {format(new Date(order.createdAt), "dd MMM yyyy", { locale: tr })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(order.createdAt), "HH:mm", { locale: tr })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/panel/orders/${order.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Detay
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Sayfa {page} / {totalPages} - Toplam {ordersData?.total || 0} sipariş
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
              >
                Önceki
              </Button>
              <div className="flex items-center px-4 text-sm">
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
                      variant={page === pageNum ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      className="mx-1"
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
          </div>
        )}
      </div>
    </Card>
  )
}
