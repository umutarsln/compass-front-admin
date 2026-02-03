"use client"

import { useParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { formatDateFull, formatDateShort } from "@/lib/date-format"
import { PageBody } from "@/components/layout/PageBody"
import { productService } from "@/services/product.service"
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ArrowLeft, Eye, Clock, ShoppingCart, TrendingUp, Loader2 } from "lucide-react"

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} sn`
  const min = Math.floor(seconds / 60)
  const sec = seconds % 60
  return sec > 0 ? `${min} dk ${sec} sn` : `${min} dk`
}

export default function ProductAnalyticsPage() {
  const params = useParams()
  const productId = params?.productId as string

  const { data: product, isLoading: productLoading, error: productError } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productService.getById(productId),
    enabled: !!productId,
  })

  const { data: report, isLoading: reportLoading, error: reportError } = useQuery({
    queryKey: ["analytics", "product", productId],
    queryFn: () => analyticsService.getProductReport(productId),
    enabled: !!productId,
  })

  const chartData = report?.daily
    ? [...report.daily].reverse().map((d) => ({
      date: formatDateShort(d.date),
      fullDateLabel: formatDateFull(d.date),
      görüntülenme: d.viewCount,
      süreSn: d.totalTimeSeconds,
      sepeteEkleme: d.cartAddCount,
      sipariş: d.orderCount,
    }))
    : []

  const displayName = report?.product?.name ?? product?.name
  const displaySlug = report?.product?.slug ?? product?.slug
  const isLoading = productLoading || reportLoading
  const isError = productError || reportError
  const notFound = !productLoading && !product && productId

  if (notFound || (productError && (productError as any)?.response?.status === 404)) {
    return (
      <PageBody>
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">Ürün bulunamadı.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/panel/products">Ürünlere dön</Link>
          </Button>
        </div>
      </PageBody>
    )
  }

  if (isError && !product) {
    return (
      <PageBody>
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">Veri yüklenirken bir hata oluştu.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/panel/products">Ürünlere dön</Link>
          </Button>
        </div>
      </PageBody>
    )
  }

  return (
    <PageBody>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/panel/products" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Ürünlere dön
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {displayName ? `${displayName} – Analitik` : "Analitik"}
          </h1>
          {displaySlug && (
            <p className="text-sm text-muted-foreground mt-1">/{displaySlug}</p>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Görüntülenme
                  </CardTitle>
                  <Eye className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {report?.total?.viewCount ?? 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Toplam süre
                  </CardTitle>
                  <Clock className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {formatDuration(report?.total?.totalTimeSeconds ?? 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Sepete ekleme
                  </CardTitle>
                  <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {report?.total?.cartAddCount ?? 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Sipariş
                  </CardTitle>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {report?.total?.orderCount ?? 0}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Line chart - last 30 days */}
            <Card>
              <CardHeader>
                <CardTitle>Son 30 gün – günlük metrikler</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Bu dönemde veri yok
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                        }}
                        labelFormatter={(_, payload) => (payload?.[0]?.payload as { fullDateLabel?: string })?.fullDateLabel ?? ""}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="görüntülenme"
                        name="Görüntülenme"
                        stroke="hsl(var(--chart-1))"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="süreSn"
                        name="Süre (sn)"
                        stroke="hsl(var(--chart-2))"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="sepeteEkleme"
                        name="Sepete ekleme"
                        stroke="hsl(var(--chart-3))"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="sipariş"
                        name="Sipariş"
                        stroke="hsl(var(--chart-4))"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Daily table */}
            <Card>
              <CardHeader>
                <CardTitle>Günlük detay</CardTitle>
              </CardHeader>
              <CardContent>
                {!report?.daily?.length ? (
                  <p className="text-muted-foreground text-center py-8">Veri yok</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tarih</TableHead>
                        <TableHead className="text-right">Görüntülenme</TableHead>
                        <TableHead className="text-right">Süre (sn)</TableHead>
                        <TableHead className="text-right">Sepete ekleme</TableHead>
                        <TableHead className="text-right">Sipariş</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...(report.daily ?? [])].reverse().map((d) => (
                        <TableRow key={d.date}>
                          <TableCell className="font-medium">
                            {formatDateFull(d.date)}
                          </TableCell>
                          <TableCell className="text-right">{d.viewCount}</TableCell>
                          <TableCell className="text-right">{d.totalTimeSeconds}</TableCell>
                          <TableCell className="text-right">{d.cartAddCount}</TableCell>
                          <TableCell className="text-right">{d.orderCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageBody>
  )
}
