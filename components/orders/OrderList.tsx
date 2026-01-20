"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { orderService, OrderStatus, GetOrdersParams } from "@/services/order.service"
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Loader2, Eye, Package } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
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

export function OrderList() {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL")
  const [page, setPage] = useState(1)
  const limit = 20

  // Query parametreleri
  const queryParams: GetOrdersParams = {
    limit,
    offset: (page - 1) * limit,
    ...(statusFilter !== "ALL" && { status: statusFilter }),
  }

  // Sipariş listesi
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["orders", queryParams],
    queryFn: () => orderService.getAll(queryParams),
  })

  // Status güncelleme mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      orderService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] })
      toast({
        title: "Başarılı",
        description: "Sipariş durumu güncellendi",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.response?.data?.message || "Sipariş durumu güncellenemedi",
        variant: "destructive",
      })
    },
  })

  // Client-side search
  const filteredOrders = ordersData?.orders.filter((order) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      order.id.toLowerCase().includes(query) ||
      order.guestEmail?.toLowerCase().includes(query) ||
      order.guestPhone?.includes(query) ||
      order.guestFirstName?.toLowerCase().includes(query) ||
      order.guestLastName?.toLowerCase().includes(query) ||
      order.shippingAddress?.address.toLowerCase().includes(query)
    )
  }) || []

  const totalPages = ordersData ? Math.ceil(ordersData.total / limit) : 1

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateStatusMutation.mutate({ id: orderId, status: newStatus })
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
        {/* Filtreler */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Sipariş ID, email, telefon veya adres ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as OrderStatus | "ALL")}>
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
        </div>

        {/* Sipariş Listesi */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sipariş ID</TableHead>
                <TableHead>Müşteri</TableHead>
                <TableHead>Toplam</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Tarih</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Sipariş bulunamadı
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">{order.id.slice(0, 8)}...</TableCell>
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
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold">
                        {order.total.toFixed(2)} {order.currency}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}
                        disabled={updateStatusMutation.isPending}
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(order.createdAt), "dd MMM yyyy, HH:mm", { locale: tr })}
                      </span>
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
              Toplam {ordersData?.total || 0} sipariş
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Önceki
              </Button>
              <div className="flex items-center px-4 text-sm">
                Sayfa {page} / {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
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
