"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { storeService, StoreProductQuery } from "@/services/store.service"
import { categoryService } from "@/services/category.service"
import { tagService } from "@/services/tag.service"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, X, ShoppingCart } from "lucide-react"
import Image from "next/image"

export default function StorePage() {
  const [filters, setFilters] = useState<StoreProductQuery>({
    page: 1,
    limit: 20,
    orderBy: "created_at_desc",
  })

  const [searchInput, setSearchInput] = useState("")
  const [priceRange, setPriceRange] = useState({ min: "", max: "" })

  // Ürünleri getir
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["storeProducts", filters],
    queryFn: () => storeService.getProducts(filters),
  })

  // Kategorileri getir
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getAll(),
  })

  // Tag'leri getir
  const { data: tags = [] } = useQuery({
    queryKey: ["tags"],
    queryFn: () => tagService.getAll(),
  })

  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      search: searchInput || undefined,
      page: 1,
    }))
  }

  const handleCategoryChange = (categoryId: string) => {
    setFilters((prev) => ({
      ...prev,
      categoryId: categoryId === "all" ? undefined : categoryId,
      page: 1,
    }))
  }

  const handleTagChange = (tagId: string) => {
    const currentTagIds = filters.tagIds?.split(",") || []
    const newTagIds = currentTagIds.includes(tagId)
      ? currentTagIds.filter((id) => id !== tagId)
      : [...currentTagIds, tagId]

    setFilters((prev) => ({
      ...prev,
      tagIds: newTagIds.length > 0 ? newTagIds.join(",") : undefined,
      page: 1,
    }))
  }

  const handlePriceRangeApply = () => {
    setFilters((prev) => ({
      ...prev,
      minPrice: priceRange.min ? Number(priceRange.min) : undefined,
      maxPrice: priceRange.max ? Number(priceRange.max) : undefined,
      page: 1,
    }))
  }

  const handleOrderChange = (orderBy: string) => {
    setFilters((prev) => ({
      ...prev,
      orderBy: orderBy as StoreProductQuery["orderBy"],
    }))
  }

  const clearFilters = () => {
    setSearchInput("")
    setPriceRange({ min: "", max: "" })
    setFilters({
      page: 1,
      limit: 20,
      orderBy: "created_at_desc",
    })
  }

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const getProductImage = (product: any) => {
    return (
      product.gallery?.thumbnailImage?.s3Url ||
      product.gallery?.mainImage?.s3Url ||
      "/placeholder-product.png"
    )
  }

  const calculateFinalPrice = (product: any) => {
    if (product.isOnSale && product.discountPercent) {
      return product.price * (1 - product.discountPercent / 100)
    }
    return product.price
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Mağaza</h1>
        <p className="text-muted-foreground">
          {productsData?.total || 0} ürün bulundu
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sol Sütun - Filtreler */}
        <aside className="w-64 flex-shrink-0">
          <Card className="sticky top-4">
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Kategori Filtresi */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Kategori</Label>
                  <Select
                    value={filters.categoryId || "all"}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Kategoriler</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Fiyat Aralığı */}
                <div className="space-y-2">
                  <Label className="text-base font-semibold">Fiyat Aralığı</Label>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Min Fiyat"
                      value={priceRange.min}
                      onChange={(e) =>
                        setPriceRange((prev) => ({ ...prev, min: e.target.value }))
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Max Fiyat"
                      value={priceRange.max}
                      onChange={(e) =>
                        setPriceRange((prev) => ({ ...prev, max: e.target.value }))
                      }
                    />
                    <Button onClick={handlePriceRangeApply} size="sm" className="w-full">
                      Uygula
                    </Button>
                  </div>
                </div>

                {/* Tag Filtreleri */}
                {tags.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">Tag'ler</Label>
                    <div className="flex flex-col gap-2">
                      {tags.map((tag) => {
                        const isSelected = filters.tagIds?.split(",").includes(tag.id)
                        return (
                          <Badge
                            key={tag.id}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer justify-start w-full"
                            onClick={() => handleTagChange(tag.id)}
                            style={
                              isSelected && tag.color
                                ? {
                                    backgroundColor: tag.color,
                                    color: "white",
                                    borderColor: tag.color,
                                  }
                                : tag.color
                                  ? {
                                      borderColor: tag.color,
                                      color: tag.color,
                                    }
                                  : {}
                            }
                          >
                            {tag.name}
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Filtreleri Temizle */}
                {(filters.categoryId ||
                  filters.tagIds ||
                  filters.minPrice !== undefined ||
                  filters.maxPrice !== undefined) && (
                  <div>
                    <Button variant="outline" onClick={clearFilters} size="sm" className="w-full">
                      <X className="w-4 h-4 mr-2" />
                      Filtreleri Temizle
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Sağ Sütun - Ürünler */}
        <div className="flex-1 min-w-0">
          {/* Arama ve Sıralama */}
          <div className="mb-6 space-y-4">
            {/* Arama Bar */}
            <div className="flex gap-2">
              <Input
                placeholder="Ürün ara..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} size="icon">
                <Search className="w-4 h-4" />
              </Button>
            </div>

            {/* Sıralama - Sağ Üst */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {productsData?.total || 0} ürün gösteriliyor
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">Sırala:</Label>
                <Select
                  value={filters.orderBy || "created_at_desc"}
                  onValueChange={handleOrderChange}
                >
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
          {isLoadingProducts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : productsData && productsData.products.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {productsData.products.map((product) => {
                  const finalPrice = calculateFinalPrice(product)
                  const hasDiscount = product.isOnSale && product.discountPercent
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
                            %{product.discountPercent?.toFixed(0)} İndirim
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
                    onClick={() => handlePageChange(filters.page! - 1)}
                    disabled={filters.page === 1}
                  >
                    Önceki
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: productsData.totalPages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === productsData.totalPages ||
                          (page >= filters.page! - 1 && page <= filters.page! + 1)
                      )
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center gap-1">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2">...</span>
                          )}
                          <Button
                            variant={filters.page === page ? "default" : "outline"}
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
                    onClick={() => handlePageChange(filters.page! + 1)}
                    disabled={filters.page === productsData.totalPages}
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
      </div>
    </div>
  )
}
