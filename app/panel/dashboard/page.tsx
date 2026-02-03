"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { format, sub } from "date-fns"
import { tr } from "date-fns/locale"
import { PageBody } from "@/components/layout/PageBody"
import { formatDateFull, formatDateShort, formatDateTime, formatDateRange } from "@/lib/date-format"
import { analyticsService } from "@/services/analytics.service"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  Eye,
  ShoppingCart,
  Package,
  TrendingUp,
  Loader2,
  Calendar,
  BarChart2,
  Percent,
  Clock,
  FileBarChart,
  ClipboardList,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { orderService, OrderStatus, type Order } from "@/services/order.service"

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)} sn`
  const min = Math.floor(seconds / 60)
  const sec = Math.round(seconds % 60)
  return sec > 0 ? `${min} dk ${sec} sn` : `${min} dk`
}

function orderCustomerName(order: Order): string {
  if (order.shippingAddress) {
    return [order.shippingAddress.firstName, order.shippingAddress.lastName].filter(Boolean).join(" ").trim()
  }
  const guest = [order.guestFirstName, order.guestLastName].filter(Boolean).join(" ").trim()
  return guest || "Misafir"
}

const RANGE_DAYS = [7, 14, 30] as const

function getDateRange(days: number): { from: string; to: string } {
  const to = new Date()
  const from = sub(to, { days })
  return {
    from: format(from, "yyyy-MM-dd"),
    to: format(to, "yyyy-MM-dd"),
  }
}

export default function PanelDashboardPage() {
  const [rangeDays, setRangeDays] = useState<number>(14)
  const { from, to } = useMemo(() => getDateRange(rangeDays), [rangeDays])

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["analytics", "store", "summary"],
    queryFn: () => analyticsService.getStoreSummary(),
  })

  const { data: storeDaily, isLoading: dailyLoading } = useQuery({
    queryKey: ["analytics", "store", "daily", from, to],
    queryFn: () => analyticsService.getStoreDaily(from, to),
  })

  const { data: productsReport, isLoading: productsLoading } = useQuery({
    queryKey: ["analytics", "products", from, to],
    queryFn: () => analyticsService.getProductsReport(from, to, 1, 20),
  })

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ["analytics", "store", "insights", from, to],
    queryFn: () => analyticsService.getStoreInsights(from, to),
  })

  const allOrderStatuses = [
    OrderStatus.PENDING,
    OrderStatus.PAID,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED,
  ] as const
  const orderCountQueries = useQuery({
    queryKey: ["orders", "counts", "all"],
    queryFn: async () => {
      const results = await Promise.all(
        allOrderStatuses.map((status) => orderService.getAll({ status, limit: 1, offset: 0 }))
      )
      return allOrderStatuses.map((status, i) => ({ status, total: results[i]?.total ?? 0 }))
    },
  })
  const orderCountByStatus = useMemo(() => {
    const map: Record<string, number> = {}
    orderCountQueries.data?.forEach(({ status, total }) => { map[status] = total })
    return map
  }, [orderCountQueries.data])
  const pendingStatuses = [
    OrderStatus.PENDING,
    OrderStatus.PAID,
    OrderStatus.PROCESSING,
    OrderStatus.SHIPPED,
  ] as const
  const pendingOrdersCount = useMemo(
    () =>
      (orderCountByStatus[OrderStatus.PENDING] ?? 0) +
      (orderCountByStatus[OrderStatus.PAID] ?? 0) +
      (orderCountByStatus[OrderStatus.PROCESSING] ?? 0) +
      (orderCountByStatus[OrderStatus.SHIPPED] ?? 0),
    [orderCountByStatus]
  )
  const { data: pendingOrdersList } = useQuery({
    queryKey: ["orders", "pending-list"],
    queryFn: async () => {
      const results = await Promise.all(
        pendingStatuses.map((status) => orderService.getAll({ status, limit: 5, offset: 0, sortBy: "createdAt", sortOrder: "DESC" }))
      )
      const merged = results.flatMap((r) => r.orders ?? [])
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      return merged.slice(0, 10)
    },
    enabled: pendingOrdersCount > 0,
  })
  const ordersPieData = useMemo(() => {
    const items = [
      { name: "Ödeme bekleyen", value: orderCountByStatus[OrderStatus.PENDING] ?? 0, status: OrderStatus.PENDING },
      { name: "Aktif siparişler", value: (orderCountByStatus[OrderStatus.PAID] ?? 0) + (orderCountByStatus[OrderStatus.PROCESSING] ?? 0) + (orderCountByStatus[OrderStatus.SHIPPED] ?? 0), status: "ACTIVE" },
      { name: "Tamamlanan", value: orderCountByStatus[OrderStatus.DELIVERED] ?? 0, status: OrderStatus.DELIVERED },
      { name: "İptal edilen", value: orderCountByStatus[OrderStatus.CANCELLED] ?? 0, status: OrderStatus.CANCELLED },
      { name: "İade", value: orderCountByStatus[OrderStatus.REFUNDED] ?? 0, status: OrderStatus.REFUNDED },
    ]
    return items.filter((i) => i.value > 0)
  }, [orderCountByStatus])
  const ORDER_PIE_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"]

  const chartData = useMemo(() => {
    if (!storeDaily || storeDaily.length === 0) return []
    return [...storeDaily].reverse().map((row) => ({
      date: formatDateShort(row.date),
      fullDate: row.date,
      fullDateLabel: formatDateFull(row.date),
      sayfa: row.pageViewCount,
      ürün: row.productViewCount,
      sepeteEkleme: row.cartAddCount,
      sipariş: row.orderCount,
    }))
  }, [storeDaily])

  const topProductsData = useMemo(() => {
    if (!productsReport?.data) return []
    return productsReport.data
      .slice(0, 10)
      .map((p) => ({
        name: p.productName.length > 24 ? p.productName.slice(0, 24) + "…" : p.productName,
        görüntülenme: p.viewCount,
      }))
  }, [productsReport])

  const pageBreakdownChartData = useMemo(() => {
    if (!insights?.pageBreakdown?.length) return []
    return insights.pageBreakdown.map(({ page, count }) => ({
      name: page.length > 20 ? page.slice(0, 20) + "…" : page,
      fullName: page,
      ziyaret: count,
    }))
  }, [insights])

  const pageBreakdownPieData = useMemo(() => {
    if (!insights?.pageBreakdown?.length) return []
    const maxSlices = 6
    const items = insights.pageBreakdown.map(({ page, count }) => ({
      name: page.length > 16 ? page.slice(0, 16) + "…" : page,
      value: count,
      fullName: page,
    }))
    if (items.length <= maxSlices) return items
    const top = items.slice(0, maxSlices - 1)
    const otherSum = items.slice(maxSlices - 1).reduce((s, i) => s + i.value, 0)
    return [...top, { name: "Diğer", value: otherSum, fullName: "Diğer sayfalar" }]
  }, [insights])

  const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"]

  return (
    <PageBody>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Analitik Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Mağaza ve ürün performans raporları
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            {RANGE_DAYS.map((d) => (
              <Button
                key={d}
                variant={rangeDays === d ? "default" : "outline"}
                size="sm"
                onClick={() => setRangeDays(d)}
              >
                Son {d} gün
              </Button>
            ))}
          </div>
        </div>

        {/* Store Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <SummaryCard
            title="Toplam Sayfa Görüntüleme"
            value={summary?.totalPageViews ?? 0}
            icon={Eye}
            loading={summaryLoading}
          />
          <SummaryCard
            title="Ürün Görüntüleme"
            value={summary?.totalProductViews ?? 0}
            icon={Package}
            loading={summaryLoading}
          />
          <SummaryCard
            title="Sepete Ekleme"
            value={summary?.totalCartAdds ?? 0}
            icon={ShoppingCart}
            loading={summaryLoading}
          />
          <SummaryCard
            title="Sipariş"
            value={summary?.totalOrders ?? 0}
            icon={TrendingUp}
            loading={summaryLoading}
          />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Toplam Ciro
              </CardTitle>
              {summaryLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              ) : null}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                ₺{Number(summary?.totalRevenue ?? 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
              </div>
              {summary?.lastAggregationAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Son güncelleme: {formatDateTime(summary.lastAggregationAt)}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Beni bekleyen siparişler (tek kart, sadece sayı) + Sipariş durumları (pie chart) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5" />
                Beni bekleyen siparişler
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Ödeme bekleyen, ödendi, hazırlanıyor veya kargoda – sizin işleminizi bekleyen siparişler
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderCountQueries.isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Yükleniyor…</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-4xl font-bold text-foreground">{pendingOrdersCount.toLocaleString("tr-TR")}</span>
                    <Link href="/panel/orders">
                      <Button variant="outline" size="sm">Siparişlere git</Button>
                    </Link>
                  </div>
                  {pendingOrdersList && pendingOrdersList.length > 0 && (
                    <div className="border rounded-md bg-muted/20 overflow-hidden">
                      <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b shrink-0">
                        Son bekleyen siparişler
                      </div>
                      <div className="max-h-[300px] overflow-y-auto divide-y">
                        {pendingOrdersList.map((order) => (
                          <div
                            key={order.id}
                            className="px-3 py-2 flex items-center justify-between gap-2 min-w-0"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">
                                {orderCustomerName(order)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {order.total.toLocaleString("tr-TR")} {order.currency}
                              </p>
                            </div>
                            <Link href={`/panel/orders/${order.id}`}>
                              <Button variant="ghost" size="sm" className="shrink-0 h-8 gap-1">
                                Detay
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sipariş durumları</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Ödeme bekleyen, aktif, tamamlanan, iptal ve iade dağılımı
              </p>
            </CardHeader>
            <CardContent>
              {orderCountQueries.isLoading ? (
                <div className="h-[260px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : !ordersPieData.length ? (
                <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
                  Henüz sipariş yok
                </div>
              ) : (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ordersPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="45%"
                        outerRadius="80%"
                        paddingAngle={2}
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={{ strokeWidth: 1 }}
                      >
                        {ordersPieData.map((_, index) => (
                          <Cell key={index} fill={ORDER_PIE_COLORS[index % ORDER_PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                        formatter={(value: number) => [value.toLocaleString("tr-TR"), "Adet"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detaylı analiz: oranlar, sayfa kırılımı + sağda pie chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileBarChart className="w-5 h-5" />
              Detaylı analiz ({formatDateRange(from, to)})
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Sepete ekleme / sipariş oranları, ortalama sayfa süresi ve sayfa bazlı ziyaret sayıları
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {insightsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                <div className=" space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-muted/30">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Sepete ekleme oranı
                        </CardTitle>
                        <Percent className="w-4 h-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                          {insights ? `${(insights.cartAddRate * 100).toFixed(1)}%` : "—"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ürün görüntüleyenlerden sepete ekleyenler
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/30">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Siparişe dönüşüm oranı
                        </CardTitle>
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                          {insights ? `${(insights.orderRate * 100).toFixed(1)}%` : "—"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Sepete ekleyenlerden sipariş verenler
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/30">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                          Ort. ürün sayfası süresi
                        </CardTitle>
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-foreground">
                          {insights ? formatDuration(insights.avgTimeOnProductSeconds) : "—"}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ürün detay sayfasında ortalama kalma süresi
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-3">Sayfa kırılımı – hangi sayfada kaç kez ziyaret</h3>
                    {!insights?.pageBreakdown?.length ? (
                      <p className="text-muted-foreground text-sm py-4">Bu dönemde sayfa ziyaret verisi yok</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        <div className="h-[240px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={pageBreakdownChartData} layout="vertical" margin={{ left: 8 }}>
                              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                              <XAxis type="number" className="text-xs" />
                              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                              <Tooltip
                                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                                formatter={(value: number) => [value, "Ziyaret"]}
                                labelFormatter={(_, payload) => (payload?.[0]?.payload as { fullName?: string })?.fullName ?? ""}
                              />
                              <Bar dataKey="ziyaret" name="Ziyaret" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Sayfa</TableHead>
                              <TableHead className="text-right">Ziyaret sayısı</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {insights.pageBreakdown.map(({ page, count }) => (
                              <TableRow key={page}>
                                <TableCell className="font-medium text-sm">{page}</TableCell>
                                <TableCell className="text-right">{count.toLocaleString("tr-TR")}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Store Daily Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5" />
              Mağaza günlük metrikler ({formatDateRange(from, to)})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dailyLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Bu tarih aralığında veri yok
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                    labelFormatter={(_, payload) => (payload?.[0]?.payload as { fullDateLabel?: string })?.fullDateLabel ?? ""}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="sayfa" name="Sayfa görüntüleme" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ürün" name="Ürün görüntüleme" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="sepeteEkleme" name="Sepete ekleme" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="sipariş" name="Sipariş" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Store Daily Table */}
        <Card>
          <CardHeader>
            <CardTitle>Günlük özet tablo</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : !storeDaily?.length ? (
              <p className="text-muted-foreground text-center py-8">Veri yok</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead className="text-right">Sayfa görüntüleme</TableHead>
                    <TableHead className="text-right">Ürün görüntüleme</TableHead>
                    <TableHead className="text-right">Sepete ekleme</TableHead>
                    <TableHead className="text-right">Sipariş</TableHead>
                    <TableHead className="text-right">Ciro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {storeDaily.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {formatDateFull(row.date)}
                      </TableCell>
                      <TableCell className="text-right">{row.pageViewCount}</TableCell>
                      <TableCell className="text-right">{row.productViewCount}</TableCell>
                      <TableCell className="text-right">{row.cartAddCount}</TableCell>
                      <TableCell className="text-right">{row.orderCount}</TableCell>
                      <TableCell className="text-right">
                        ₺{Number(row.totalRevenue).toLocaleString("tr-TR", { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Products report: Bar chart + Table */}
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>En çok görüntülenen ürünler (top 10)</CardTitle>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : topProductsData.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Veri yok
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProductsData} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis type="category" dataKey="name" width={120} className="text-xs" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                    />
                    <Bar dataKey="görüntülenme" name="Görüntülenme" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ürün bazlı özet (seçilen dönem)</CardTitle>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : !productsReport?.data?.length ? (
                <p className="text-muted-foreground text-center py-8">Veri yok</p>
              ) : (
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ürün</TableHead>
                        <TableHead className="text-right">Görüntülenme</TableHead>
                        <TableHead className="text-right">Süre (sn)</TableHead>
                        <TableHead className="text-right">Sepete ekleme</TableHead>
                        <TableHead className="text-right">Sipariş</TableHead>
                        <TableHead className="text-right"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {productsReport.data.map((p) => (
                        <TableRow key={p.productId}>
                          <TableCell>
                            <div className="font-medium text-foreground">{p.productName}</div>
                            {p.productSlug && (
                              <div className="text-xs text-muted-foreground">/{p.productSlug}</div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{p.viewCount}</TableCell>
                          <TableCell className="text-right">{p.totalTimeSeconds}</TableCell>
                          <TableCell className="text-right">{p.cartAddCount}</TableCell>
                          <TableCell className="text-right">{p.orderCount}</TableCell>
                          <TableCell className="text-right">
                            <Link href={p.detailLink}>
                              <Button variant="ghost" size="sm">Analiz</Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageBody>
  )
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  loading: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : (
          <Icon className="w-4 h-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value.toLocaleString("tr-TR")}</div>
      </CardContent>
    </Card>
  )
}
