"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { ShoppingCart } from "lucide-react"
import Image from "next/image"
import { StoreProduct, StoreProductListResponse } from "@/services/store.service"

interface StoreProductsProps {
  productsData: StoreProductListResponse
}

export function StoreProducts({ productsData }: StoreProductsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentPage = Number(searchParams.get("page")) || 1
  const currentOrderBy = searchParams.get("orderBy") || "created_at_desc"

  const updateSearchParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    
    router.push(`/panel/store?${params.toString()}`)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleOrderChange = (orderBy: string) => {
    updateSearchParams({ orderBy })
  }

  const handlePageChange = (page: number) => {
    updateSearchParams({ page: page.toString() })
  }

  const getProductImage = (product: StoreProduct) => {
    return (
      product.gallery?.thumbnailImage?.s3Url ||
      product.gallery?.mainImage?.s3Url ||
      "/placeholder-product.png"
    )
  }

  // Backend'den gelen price zaten hesaplanmış final fiyat (discountedPrice + priceDelta veya basePrice + priceDelta)
  // Bu yüzden direkt product.price kullanıyoruz
  const getFinalPrice = (product: StoreProduct) => {
    return product.price
  }

  return (
    <div className="flex-1 min-w-0">
      {/* Arama ve Sıralama */}
      <div className="mb-6 space-y-4">
        {/* Sıralama - Sağ Üst */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {productsData.total} ürün gösteriliyor
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Sırala:</Label>
            <Select value={currentOrderBy} onValueChange={handleOrderChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at_desc">Yeni Eklenenler</SelectItem>
                <SelectItem value="created_at_asc">Eski Eklenenler</SelectItem>
                <SelectItem value="price_asc">Fiyat: Düşükten Yükseğe</SelectItem>
                <SelectItem value="price_desc">Fiyat: Yüksekten Düşüğe</SelectItem>
                <SelectItem value="name_asc">İsim: A-Z</SelectItem>
                <SelectItem value="name_desc">İsim: Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Ürünler Grid */}
      {productsData.products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {productsData.products.map((product) => {
              const finalPrice = getFinalPrice(product)
              const hasDiscount = product.discountedPrice !== null && product.discountedPrice !== undefined
              const imageUrl = getProductImage(product)

              return (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative aspect-square bg-muted">
                    {imageUrl && (
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    )}
                    {hasDiscount && (
                      <Badge
                        className="absolute top-2 right-2 bg-red-500"
                        variant="default"
                      >
                        İndirimli
                      </Badge>
                    )}
                    {product.stock.usableQuantity === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="destructive">Stokta Yok</Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg line-clamp-2 min-h-[3rem]">
                        {product.name}
                      </h3>
                      {product.subtitle && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.subtitle}
                        </p>
                      )}

                      {/* Varyasyon Değerleri */}
                      {product.variantValues && product.variantValues.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {product.variantValues.map((variant) => (
                            <Badge
                              key={variant.id}
                              variant="outline"
                              className="text-xs"
                              style={
                                variant.colorCode
                                  ? {
                                      borderColor: variant.colorCode,
                                      color: variant.colorCode,
                                    }
                                  : {}
                              }
                            >
                              {variant.variantOption.name}: {variant.value}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Kategoriler */}
                      {product.categories && product.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {product.categories.slice(0, 2).map((category) => (
                            <Badge key={category.id} variant="secondary" className="text-xs">
                              {category.name}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Fiyat */}
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-primary">
                          ₺{finalPrice.toFixed(2)}
                        </span>
                        {hasDiscount && (
                          <span className="text-sm text-muted-foreground line-through">
                            ₺{product.basePrice.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Stok Bilgisi */}
                      <div className="text-xs text-muted-foreground">
                        Stok: {product.stock.usableQuantity} adet
                      </div>

                      {/* Sepete Ekle Butonu */}
                      <Button
                        className="w-full"
                        disabled={product.stock.usableQuantity === 0}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Sepete Ekle
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          {productsData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Önceki
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: productsData.totalPages }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === productsData.totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                  )
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center gap-1">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2">...</span>
                      )}
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => handlePageChange(page)}
                        size="sm"
                      >
                        {page}
                      </Button>
                    </div>
                  ))}
              </div>
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === productsData.totalPages}
              >
                Sonraki
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Ürün bulunamadı.</p>
        </div>
      )}
    </div>
  )
}
