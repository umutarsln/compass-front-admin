"use client"

import { Fragment } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { orderService, OrderStatus, PaymentProvider } from "@/services/order.service"
import { Loader2, Package, User, MapPin, CreditCard, FileText, ArrowLeft, ExternalLink, Image as ImageIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import Image from "next/image"
import Link from "next/link"
import { PersonalizationSummary } from "@/components/personalization/PersonalizationSummary"

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

const paymentProviderLabels: Record<PaymentProvider, string> = {
  [PaymentProvider.IYZICO]: "Iyzico",
  [PaymentProvider.IBAN_EFT]: "IBAN EFT",
}

interface OrderDetailProps {
  orderId: string
}

export function OrderDetail({ orderId }: OrderDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Sipariş detayı
  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => orderService.getById(orderId),
  })

  // Status güncelleme mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: OrderStatus) => orderService.updateStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] })
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!order) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Sipariş bulunamadı</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/panel/orders")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Sipariş Detayı</h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground">Sipariş No: <span className="font-mono font-semibold text-foreground">{order.orderNo || order.id}</span></p>
              <span className="text-muted-foreground">•</span>
              <p className="text-sm text-muted-foreground">ID: <span className="font-mono text-foreground">{order.id.slice(0, 8)}...</span></p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={order.status}
            onValueChange={(value) => updateStatusMutation.mutate(value as OrderStatus)}
            disabled={updateStatusMutation.isPending}
          >
            <SelectTrigger className="w-[180px]">
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sol Kolon - Ana Bilgiler */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Ürünler */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Sipariş Ürünleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün</TableHead>
                    <TableHead className="text-right">Miktar</TableHead>
                    <TableHead className="text-right">Birim Fiyat</TableHead>
                    <TableHead className="text-right">Toplam</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => {
                    // Get product image - variant gallery first, then product gallery
                    const productImage = item.variant?.galleries?.[0]?.thumbnailImage?.s3Url ||
                      item.variant?.galleries?.[0]?.mainImage?.s3Url ||
                      item.product?.galleries?.[0]?.thumbnailImage?.s3Url ||
                      item.product?.galleries?.[0]?.mainImage?.s3Url ||
                      null

                    // Get product link
                    const productLink = item.product?.slug
                      ? `/panel/products/${item.product.slug}`
                      : null

                    return (
                      <Fragment key={item.id}>
                        <TableRow>
                          <TableCell>
                            <div className="flex gap-4">
                              {/* Product Image */}
                              <div className="relative w-16 h-16 shrink-0 bg-secondary rounded overflow-hidden">
                                {productImage ? (
                                  <Image
                                    src={productImage}
                                    alt={item.productName}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                  </div>
                                )}
                              </div>

                              {/* Product Info - kişiselleştirme burada değil, aşağıda ayrı satırda */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start gap-2">
                                  <span className="font-medium">{item.productName}</span>
                                  {productLink && (
                                    <Link
                                      href={productLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="shrink-0"
                                    >
                                      <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                                    </Link>
                                  )}
                                </div>
                                {item.variantId && (
                                  <span className="text-sm text-muted-foreground block mt-1">
                                    Varyant ID: {item.variantId.slice(0, 8)}...
                                  </span>
                                )}
                                <div className="text-xs text-muted-foreground mt-1">
                                  Ürün ID: {item.productId.slice(0, 8)}...
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {item.discountedPrice ? (
                              <div className="flex flex-col items-end">
                                <span className="font-medium text-primary">
                                  {item.discountedPrice.toFixed(2)} {item.currency}
                                </span>
                              </div>
                            ) : (
                              <span>{item.unitPrice.toFixed(2)} {item.currency}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {item.totalPrice.toFixed(2)} {item.currency}
                          </TableCell>
                        </TableRow>
                        {/* Kişiselleştirme ayrı satırda, tam genişlikte */}
                        {item.personalization && (
                          <TableRow>
                            <TableCell colSpan={4} className="bg-muted/30 p-4">
                              <PersonalizationSummary
                                personalization={item.personalization}
                                readOnly
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Adres Bilgileri */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Teslimat Adresi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.shippingAddress ? (
                  <div className="flex flex-col gap-2 text-sm">
                    <p className="font-medium">
                      {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                    </p>
                    <p className="text-muted-foreground">{order.shippingAddress.phone}</p>
                    <p className="text-muted-foreground">{order.shippingAddress.address}</p>
                    <p className="text-muted-foreground">
                      {order.shippingAddress.district} / {order.shippingAddress.city}
                    </p>
                    <p className="text-muted-foreground">
                      {order.shippingAddress.postalCode} {order.shippingAddress.country && `- ${order.shippingAddress.country}`}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Adres bilgisi yok</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Fatura Adresi
                </CardTitle>
              </CardHeader>
              <CardContent>
                {order.billingAddress ? (
                  <div className="flex flex-col gap-2 text-sm">
                    <p className="font-medium">
                      {order.billingAddress.firstName} {order.billingAddress.lastName}
                    </p>
                    <p className="text-muted-foreground">{order.billingAddress.phone}</p>
                    <p className="text-muted-foreground">{order.billingAddress.address}</p>
                    <p className="text-muted-foreground">
                      {order.billingAddress.district} / {order.billingAddress.city}
                    </p>
                    <p className="text-muted-foreground">
                      {order.billingAddress.postalCode} {order.billingAddress.country && `- ${order.billingAddress.country}`}
                    </p>
                    {order.billingAddress.taxNumber && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-muted-foreground">
                          <span className="font-medium">Vergi No:</span> {order.billingAddress.taxNumber}
                        </p>
                        {order.billingAddress.taxOffice && (
                          <p className="text-muted-foreground">
                            <span className="font-medium">Vergi Dairesi:</span> {order.billingAddress.taxOffice}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Fatura adresi bilgisi yok</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notlar */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Sipariş Notları
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sağ Kolon - Özet */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Müşteri Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {order.user ? (
                <div className="flex flex-col gap-2">
                  <Badge variant="outline">Kayıtlı Kullanıcı</Badge>
                  <p className="text-sm">
                    <span className="font-medium">Ad Soyad:</span> {order.user.firstname} {order.user.lastname}
                  </p>
                  {order.user.email && (
                    <p className="text-sm">
                      <span className="font-medium">Email:</span> {order.user.email}
                    </p>
                  )}
                  {order.user.phone && (
                    <p className="text-sm">
                      <span className="font-medium">Telefon:</span> {order.user.phone}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">User ID: {order.userId}</p>
                </div>
              ) : order.userId ? (
                <div className="flex flex-col gap-2">
                  <Badge variant="outline">Kayıtlı Kullanıcı</Badge>
                  <p className="text-sm text-muted-foreground">User ID: {order.userId}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Badge variant="outline">Misafir Müşteri</Badge>
                  {order.guestFirstName && (
                    <p className="text-sm">
                      <span className="font-medium">Ad Soyad:</span> {order.guestFirstName} {order.guestLastName}
                    </p>
                  )}
                  {order.guestEmail && (
                    <p className="text-sm">
                      <span className="font-medium">Email:</span> {order.guestEmail}
                    </p>
                  )}
                  {order.guestPhone && (
                    <p className="text-sm">
                      <span className="font-medium">Telefon:</span> {order.guestPhone}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sipariş Özeti</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Ara Toplam</span>
                <span>{order.subtotal.toFixed(2)} {order.currency}</span>
              </div>
              {order.shippingCost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Kargo</span>
                  <span>{order.shippingCost.toFixed(2)} {order.currency}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>İndirim</span>
                  <span>-{order.discount.toFixed(2)} {order.currency}</span>
                </div>
              )}
              <div className="border-t pt-3 flex justify-between font-semibold">
                <span>Toplam</span>
                <span>{order.total.toFixed(2)} {order.currency}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sipariş Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Durum</span>
                <Badge className={statusColors[order.status]}>{statusLabels[order.status]}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ödeme Yöntemi</span>
                {order.paymentProvider ? (
                  <Badge variant="outline">
                    {paymentProviderLabels[order.paymentProvider]}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Oluşturulma</span>
                <span>{format(new Date(order.createdAt), "dd MMM yyyy, HH:mm", { locale: tr })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Güncellenme</span>
                <span>{format(new Date(order.updatedAt), "dd MMM yyyy, HH:mm", { locale: tr })}</span>
              </div>
              {order.cartId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sepet ID</span>
                  <span className="font-mono text-xs">{order.cartId.slice(0, 8)}...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
