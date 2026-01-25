"use client"

import { useQuery } from "@tanstack/react-query"
import { productService, Product } from "@/services/product.service"
import { stockService } from "@/services/stock.service"
import { Loader2, Package, Image as ImageIcon, Tag, FolderTree, DollarSign, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { marked } from "marked"

interface SummaryStepProps {
  productId?: string | null
  productType?: "SIMPLE" | "VARIANT" | "BUNDLE"
}

export function SummaryStep({ productId, productType = "SIMPLE" }: SummaryStepProps) {
  // Ürün bilgilerini getir
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productService.getById(productId!),
    enabled: !!productId,
  })

  // Stock bilgilerini getir
  const { data: stock, isLoading: isLoadingStock } = useQuery({
    queryKey: ["stock", "PRODUCT", productId],
    queryFn: () => stockService.getStock("PRODUCT", productId!),
    enabled: !!productId && productType === "SIMPLE",
  })

  // Gallery bilgilerini getir
  const { data: gallery, isLoading: isLoadingGallery } = useQuery({
    queryKey: ["productGallery", productId, null],
    queryFn: () => productService.getProductGalleryByProduct(productId!),
    enabled: !!productId,
  })

  // Varyasyon kombinasyonlarını getir (VARIANT ürünler için)
  const { data: variantCombinations = [], isLoading: isLoadingCombinations } = useQuery({
    queryKey: ["variantCombinations", productId],
    queryFn: () => productService.getVariantCombinationsByProduct(productId!),
    enabled: !!productId && productType === "VARIANT",
  })

  if (!productId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            Özet görüntülemek için önce ürünü oluşturmanız gerekiyor.
          </p>
        </div>
      </div>
    )
  }

  if (isLoadingProduct || isLoadingStock || isLoadingGallery || isLoadingCombinations) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 border border-red-200 bg-red-50 rounded-lg">
          <p className="text-sm text-red-800">Ürün bulunamadı.</p>
        </div>
      </div>
    )
  }

  const finalPrice = product.discountedPrice
    ? Number(product.discountedPrice)
    : Number(product.basePrice)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Ürün Özeti
        </h3>
        <p className="text-sm text-muted-foreground">
          Ürün bilgilerini gözden geçirin. Tüm bilgiler doğruysa "Kaydet" butonuna tıklayın.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Temel Bilgiler */}
        <div className="space-y-4 p-4 border border-border rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <h4 className="font-semibold text-foreground">Temel Bilgiler</h4>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ürün Adı:</span>
              <span className="font-medium text-foreground">{product.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slug:</span>
              <span className="font-medium text-foreground">{product.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tip:</span>
              <span className="font-medium text-foreground">{product.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fiyat:</span>
              <span className="font-medium text-foreground">
                ₺{Number(product.basePrice).toFixed(2)}
                {product.discountedPrice && (
                  <span className="ml-2 text-green-600">
                    (₺{finalPrice.toFixed(2)} - İndirimli)
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Durum:</span>
              <span className={`font-medium ${product.isActive ? "text-green-600" : "text-red-600"}`}>
                {product.isActive ? "Aktif" : "Pasif"}
              </span>
            </div>
            {product.sku && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">SKU:</span>
                <span className="font-medium text-foreground">{product.sku}</span>
              </div>
            )}
          </div>
          {product.description && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Açıklama:</p>
              <div
                className="text-sm prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: marked(product.description) }}
              />
            </div>
          )}
        </div>

        {/* Kategoriler ve Tag'ler */}
        <div className="space-y-4 p-4 border border-border rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <FolderTree className="w-5 h-5 text-muted-foreground" />
            <h4 className="font-semibold text-foreground">Kategoriler & Tag'ler</h4>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Kategoriler:</p>
              {product.categories && product.categories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {product.categories.map((category: any) => (
                    <span
                      key={category.id}
                      className="px-2 py-1 text-xs bg-primary/10 text-primary rounded"
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Kategori seçilmedi</p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Tag'ler:</p>
              {product.tags && product.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag: any) => (
                    <span
                      key={tag.id}
                      className="px-2 py-1 text-xs rounded"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Tag seçilmedi</p>
              )}
            </div>
          </div>
        </div>

        {/* Stok Bilgileri */}
        {productType === "SIMPLE" && stock && (
          <div className="space-y-4 p-4 border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-muted-foreground" />
              <h4 className="font-semibold text-foreground">Stok Bilgileri</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mevcut Stok:</span>
                <span className="font-medium text-foreground">{stock.availableQuantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rezerve Edilmiş:</span>
                <span className="font-medium text-yellow-600">{stock.reservedQuantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Satışa Hazır:</span>
                <span
                  className={`font-medium ${
                    stock.availableQuantity - stock.reservedQuantity > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {stock.availableQuantity - stock.reservedQuantity}
                </span>
              </div>
              {stock.lowStockThreshold !== null && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Düşük Stok Eşiği:</span>
                  <span className="font-medium text-foreground">{stock.lowStockThreshold}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Galeri Bilgileri */}
        {gallery && (
          <div className="space-y-4 p-4 border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon className="w-5 h-5 text-muted-foreground" />
              <h4 className="font-semibold text-foreground">Galeri</h4>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-2">Ana Resim:</p>
                {gallery.mainImage && (
                  <img
                    src={gallery.mainImage.s3Url}
                    alt={gallery.mainImage.displayName || gallery.mainImage.filename}
                    className="w-full h-32 object-cover rounded border border-border"
                  />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">Thumbnail:</p>
                {gallery.thumbnailImage && (
                  <img
                    src={gallery.thumbnailImage.s3Url}
                    alt={gallery.thumbnailImage.displayName || gallery.thumbnailImage.filename}
                    className="w-full h-32 object-cover rounded border border-border"
                  />
                )}
              </div>
              {gallery.detailImages && gallery.detailImages.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Detay Resimler ({gallery.detailImages.length}):
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {gallery.detailImages.map((image: any) => (
                      <img
                        key={image.id}
                        src={image.s3Url}
                        alt={image.displayName || image.filename}
                        className="w-full h-20 object-cover rounded border border-border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Varyasyon Kombinasyonları (VARIANT ürünler için) */}
        {productType === "VARIANT" && variantCombinations.length > 0 && (
          <div className="space-y-4 p-4 border border-border rounded-lg md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-muted-foreground" />
              <h4 className="font-semibold text-foreground">Varyasyon Kombinasyonları</h4>
              <span className="text-xs text-muted-foreground">
                (Sadece seçilebilir ve satışta olanlar gösteriliyor)
              </span>
            </div>
            <div className="space-y-3">
              {/* Sadece seçilebilir ve satışta olan kombinasyonları göster */}
              {variantCombinations
                .filter((combination) => combination.isActive && !combination.isDisabled)
                .map((combination) => {
                  const combinationLabel = combination.variantValues
                    .map((value: any) => {
                      const optionName = value.variantOption?.name || "Bilinmeyen"
                      return `${optionName}: ${value.value}`
                    })
                    .join(" • ")

                  return (
                    <div
                      key={combination.id}
                      className="p-3 border border-border rounded-lg space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{combinationLabel}</div>
                          {combination.sku && (
                            <div className="text-xs text-muted-foreground font-mono mt-1">
                              SKU: {combination.sku}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            Satışta
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            Seçilebilir
                          </Badge>
                        </div>
                      </div>
                      {combination.stock && (
                        <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-border">
                          <div>
                            <span className="text-muted-foreground">Mevcut:</span>
                            <span className="ml-1 font-medium">
                              {combination.stock.availableQuantity || 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Rezerve:</span>
                            <span className="ml-1 font-medium text-yellow-600">
                              {combination.stock.reservedQuantity || 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Kullanılabilir:</span>
                            <span
                              className={`ml-1 font-medium ${
                                (combination.stock.availableQuantity || 0) -
                                  (combination.stock.reservedQuantity || 0) >
                                0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {(combination.stock.availableQuantity || 0) -
                                (combination.stock.reservedQuantity || 0)}
                            </span>
                          </div>
                        </div>
                      )}
                      {combination.galleries && combination.galleries.length > 0 && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground mb-2">Galeri:</p>
                          <div className="flex gap-2">
                            {combination.galleries[0].mainImage && (
                              <img
                                src={combination.galleries[0].mainImage.s3Url}
                                alt="Ana resim"
                                className="w-16 h-16 object-cover rounded border border-border"
                              />
                            )}
                            {combination.galleries[0].thumbnailImage && (
                              <img
                                src={combination.galleries[0].thumbnailImage.s3Url}
                                alt="Thumbnail"
                                className="w-16 h-16 object-cover rounded border border-border"
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              {variantCombinations.filter(
                (combination) => combination.isActive && !combination.isDisabled
              ).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Seçilebilir ve satışta olan kombinasyon bulunamadı.
                </p>
              )}
            </div>
          </div>
        )}

        {/* SEO Bilgileri */}
        {(product.seoTitle || product.seoDescription || product.seoKeywords) && (
          <div className="space-y-4 p-4 border border-border rounded-lg md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-muted-foreground" />
              <h4 className="font-semibold text-foreground">SEO Bilgileri</h4>
            </div>
            <div className="space-y-2 text-sm">
              {product.seoTitle && (
                <div>
                  <span className="text-muted-foreground">SEO Başlık:</span>
                  <p className="font-medium text-foreground mt-1">{product.seoTitle}</p>
                </div>
              )}
              {product.seoDescription && (
                <div>
                  <span className="text-muted-foreground">SEO Açıklama:</span>
                  <p className="font-medium text-foreground mt-1">{product.seoDescription}</p>
                </div>
              )}
              {product.seoKeywords && product.seoKeywords.length > 0 && (
                <div>
                  <span className="text-muted-foreground">SEO Anahtar Kelimeler:</span>
                  <p className="font-medium text-foreground mt-1">
                    {product.seoKeywords.join(", ")}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
