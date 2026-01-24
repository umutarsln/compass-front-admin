"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { stockService, Stock, UpdateStockDto, SellableType } from "@/services/stock.service"
import { productService, Product } from "@/services/product.service"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Package, AlertCircle, Hash } from "lucide-react"
import { ProductType } from "@/services/product.service"

interface StockStepProps {
  productId?: string | null
  productType?: ProductType
  variantCombinationId?: string | null
  onStockSaved?: () => void // Stock kaydedildiğinde çağrılacak callback
  onStockChange?: (stock: {
    availableQuantity: number
    lowStockThreshold: number | null
    sku: string
  }) => void
  initialStock?: {
    availableQuantity: number
    lowStockThreshold: number | null
    sku: string
  }
}

export function StockStep({
  productId,
  productType,
  variantCombinationId,
  onStockSaved,
  onStockChange,
  initialStock,
}: StockStepProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [availableQuantity, setAvailableQuantity] = useState<number>(initialStock?.availableQuantity || 0)
  const [lowStockThreshold, setLowStockThreshold] = useState<number | null>(initialStock?.lowStockThreshold ?? null)
  const [sku, setSku] = useState<string>(initialStock?.sku || "")
  
  // productId yoksa sadece frontend state'inde tut, backend'e kaydetme
  const isPreviewMode = !productId && !variantCombinationId

  // Otomatik kaydetme için debounce timer'ları
  const stockSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const skuSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Stock bilgisini getir
  const sellableType: SellableType =
    productType === "VARIANT" && variantCombinationId
      ? "VARIANT_COMBINATION"
      : "PRODUCT"

  const sellableId = variantCombinationId || productId

  // Product bilgisini getir (SKU için)
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productService.getById(productId!),
    enabled: !!productId && !variantCombinationId,
  })

  // Varyasyonlu ürünler için toplam stok bilgisini getir
  const { 
    data: totalStock, 
    isLoading: isLoadingTotalStock 
  } = useQuery({
    queryKey: ["productTotalStock", productId],
    queryFn: () => productService.getProductTotalStock(productId!),
    enabled: !!productId && productType === "VARIANT" && !variantCombinationId,
  })

  // Basit ürünler için stok bilgisini getir
  const { 
    data: stock, 
    isLoading: isLoadingStock,
    error: stockError,
    refetch: refetchStock
  } = useQuery({
    queryKey: ["stock", sellableType, sellableId],
    queryFn: () => stockService.getStock(sellableType, sellableId!),
    enabled: !!sellableId && productType === "SIMPLE" && !variantCombinationId, // Sadece basit ürünler için
    retry: false, // 404 hatası için retry yapma
  })

  const isLoading = isLoadingStock || isLoadingProduct || isLoadingTotalStock

  // Stock verileri geldiğinde state'leri güncelle
  useEffect(() => {
    if (stock) {
      setAvailableQuantity(stock.availableQuantity || 0)
      setLowStockThreshold(stock.lowStockThreshold ?? null)
    } else if (stockError) {
      const errorStatus = (stockError as any)?.response?.status
      if (errorStatus === 404) {
        // Stock yoksa, state'leri sıfırla (backend updateStock çağrısında otomatik oluşturacak)
        setAvailableQuantity(0)
        setLowStockThreshold(null)
      }
    }
  }, [stock, stockError])

  // Product verileri geldiğinde SKU'yu güncelle (sadece productId varsa)
  useEffect(() => {
    if (!isPreviewMode && product) {
      setSku(product.sku || "")
    }
  }, [product, isPreviewMode])

  // Stock değişikliklerini parent'a bildir (preview mode için)
  useEffect(() => {
    if (onStockChange) {
      onStockChange({
        availableQuantity,
        lowStockThreshold,
        sku,
      })
    }
  }, [availableQuantity, lowStockThreshold, sku, onStockChange])

  // Stock güncelleme mutation (stock yoksa otomatik oluşturur)
  const updateStockMutation = useMutation({
    mutationFn: (data: UpdateStockDto) => {
      if (!sellableId) {
        throw new Error("Sellable ID is required")
      }
      return stockService.updateStock(sellableType, sellableId, data)
    },
    onSuccess: (updatedStock) => {
      // Cache'i direkt güncelle
      queryClient.setQueryData(
        ["stock", sellableType, sellableId],
        updatedStock
      )
      // State'leri güncelle
      setAvailableQuantity(updatedStock.availableQuantity || 0)
      setLowStockThreshold(updatedStock.lowStockThreshold ?? null)
      // Diğer query'leri invalidate et
      queryClient.invalidateQueries({ queryKey: ["stock"] })
      queryClient.invalidateQueries({ queryKey: ["product", productId] })
      if (onStockSaved) {
        onStockSaved()
      }
      toast({
        title: "Başarılı",
        description: "Stok bilgisi güncellendi.",
      })
    },
    onError: (error: any) => {
      console.error("[StockStep] Stock update error:", error)
      toast({
        title: "Hata",
        description:
          error.response?.data?.message || error.message || "Stok güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    },
  })

  // SKU güncelleme mutation
  const updateSkuMutation = useMutation({
    mutationFn: (newSku: string) =>
      productService.update(productId!, { sku: newSku || undefined }),
    onSuccess: (updatedProduct) => {
      // Cache'i direkt güncelle
      queryClient.setQueryData(
        ["product", productId],
        updatedProduct
      )
      // State'i güncelle
      setSku(updatedProduct.sku || "")
      // Diğer query'leri invalidate et
      queryClient.invalidateQueries({ queryKey: ["products"] })
      if (onStockSaved) {
        onStockSaved()
      }
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description:
          error.response?.data?.message || "SKU güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    },
  })

  // Stok değişikliklerini otomatik kaydet (debounce ile) - Sadece basit ürünler için
  useEffect(() => {
    // Preview mode'da kaydetme
    if (isPreviewMode) return
    
    // Varyasyonlu ürünlerde stok düzenlenemez
    if (productType === "VARIANT" && !variantCombinationId) return
    
    // Sadece basit ürünler için çalış
    if (productType !== "SIMPLE") return
    
    if (!sellableId || isLoadingStock || updateStockMutation.isPending) return

    // Stock varsa, değerler değişmediyse kaydetme
    if (stock) {
      const hasChanged =
        availableQuantity !== stock.availableQuantity ||
        lowStockThreshold !== (stock.lowStockThreshold ?? null)

      if (!hasChanged) return
    }

    // Debounce: 1 saniye bekle, sonra kaydet
    if (stockSaveTimeoutRef.current) {
      clearTimeout(stockSaveTimeoutRef.current)
    }

    stockSaveTimeoutRef.current = setTimeout(() => {
      updateStockMutation.mutate({
        availableQuantity,
        lowStockThreshold: lowStockThreshold ?? undefined,
      })
    }, 1000) // 1 saniye debounce

    return () => {
      if (stockSaveTimeoutRef.current) {
        clearTimeout(stockSaveTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableQuantity, lowStockThreshold, sellableId, stock, productType, isLoadingStock])

  // SKU değişikliklerini otomatik kaydet (debounce ile) - sadece productId varsa
  useEffect(() => {
    if (isPreviewMode || !productId || !product || isLoadingProduct) return

    // Eğer SKU değişmediyse kaydetme
    const hasChanged = sku !== (product.sku || "")

    if (!hasChanged) return

    // Debounce: 1 saniye bekle, sonra kaydet
    if (skuSaveTimeoutRef.current) {
      clearTimeout(skuSaveTimeoutRef.current)
    }

    skuSaveTimeoutRef.current = setTimeout(() => {
      updateSkuMutation.mutate(sku)
    }, 1000) // 1 saniye debounce

    return () => {
      if (skuSaveTimeoutRef.current) {
        clearTimeout(skuSaveTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sku, productId])

  if (isLoading && !isPreviewMode) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Varyasyonlu ürünler için toplam stok bilgisi
  const isVariantProduct = productType === "VARIANT" && !variantCombinationId
  
  // Stock yoksa veya hata varsa, varsayılan değerler kullan
  const reservedQuantity = isVariantProduct 
    ? (totalStock?.totalReserved || 0)
    : (stock?.reservedQuantity || 0)
  
  const totalAvailableQuantity = isVariantProduct
    ? (totalStock?.totalAvailable || 0)
    : (stock?.availableQuantity || availableQuantity)
  
  const totalAvailable = isVariantProduct
    ? (totalStock?.totalAvailableAfterReserve || 0)
    : (availableQuantity - reservedQuantity)
  
  const displayStock = isVariantProduct
    ? {
        availableQuantity: totalStock?.totalAvailable || 0,
        reservedQuantity: totalStock?.totalReserved || 0,
        lowStockThreshold: null, // Varyasyonlu ürünlerde threshold yok
      }
    : (stock || {
        availableQuantity: availableQuantity,
        reservedQuantity: 0,
        lowStockThreshold: lowStockThreshold,
      })

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Stok Yönetimi
        </h3>
        <p className="text-sm text-muted-foreground">
          {isVariantProduct ? (
            <>
              Varyasyonlu ürünlerde stok bilgisi, tüm varyasyon kombinasyonlarının stoklarının toplamıdır. 
              Stok düzenlemesi için lütfen <strong>Varyasyon Kombinasyonları</strong> adımına gidin.
            </>
          ) : (
            <>
              Ürün stok bilgilerini ve SKU kodunu yönetin. Stok miktarı, düşük stok
              uyarısı eşiği ve SKU kodunu ayarlayabilirsiniz.
              {isPreviewMode && " Ürün oluşturulduktan sonra kaydedilecektir."}
            </>
          )}
        </p>
      </div>

      {/* SKU Bölümü - Sadece basit ürünler için */}
      {!variantCombinationId && (
        <div className="p-4 border border-border rounded-lg bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <Hash className="w-5 h-5 text-muted-foreground" />
            <h4 className="font-semibold text-foreground">SKU (Stok Kodu)</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="sku">SKU Kodu</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Örn: PRD-001"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ürün için benzersiz stok kodu. Bu alan opsiyoneldir.
              </p>
            </div>
            <div className="flex items-end">
              {updateSkuMutation.isPending && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Kaydediliyor...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mevcut Stok Bilgileri */}
        <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-muted-foreground" />
            <h4 className="font-semibold text-foreground">Mevcut Durum</h4>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Toplam Stok:
              </span>
              <span className="font-semibold text-foreground">
                {displayStock.availableQuantity}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Rezerve Edilmiş:
              </span>
              <span className="font-semibold text-yellow-600">
                {reservedQuantity}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-sm font-medium text-foreground">
                Satışa Hazır:
              </span>
              <span
                className={`font-bold ${
                  totalAvailable > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {totalAvailable}
              </span>
            </div>
          </div>
        </div>

        {/* Stok Ayarları - Sadece basit ürünler için */}
        {!isVariantProduct && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="availableQuantity">
                Mevcut Stok Miktarı *
              </Label>
              <Input
                id="availableQuantity"
                type="number"
                min="0"
                value={availableQuantity}
                onChange={(e) =>
                  setAvailableQuantity(parseInt(e.target.value) || 0)
                }
                className="mt-1"
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Toplam stok miktarını girin.
              </p>
            </div>

            <div>
              <Label htmlFor="lowStockThreshold">
                Düşük Stok Uyarısı Eşiği
              </Label>
              <Input
                id="lowStockThreshold"
                type="number"
                min="0"
                value={lowStockThreshold ?? ""}
                onChange={(e) =>
                  setLowStockThreshold(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className="mt-1"
                placeholder="Opsiyonel"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Stok bu miktarın altına düştüğünde uyarı verilecektir.
              </p>
            </div>
          </div>
        )}

        {/* Varyasyonlu ürünler için bilgilendirme */}
        {isVariantProduct && (
          <div className="space-y-4 p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">Varyasyon Kombinasyonları Stok Bilgisi</h4>
            </div>
            <p className="text-sm text-blue-800 mb-3">
              Bu ürünün stok bilgisi, tüm varyasyon kombinasyonlarının stoklarının toplamıdır. 
              Stok düzenlemesi için <strong>Varyasyon Kombinasyonları</strong> adımına gidin.
            </p>
            {totalStock && totalStock.combinations && totalStock.combinations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs font-medium text-blue-900 mb-2">
                  Kombinasyon Detayları ({totalStock.combinations.length} kombinasyon):
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {totalStock.combinations.map((combo, index) => (
                    <div key={combo.combinationId || index} className="flex justify-between text-xs text-blue-700">
                      <span>Kombinasyon #{index + 1}:</span>
                      <span className="font-medium">
                        {combo.availableQuantity} adet
                        {combo.reservedQuantity > 0 && (
                          <span className="text-yellow-600 ml-1">
                            ({combo.reservedQuantity} rezerve)
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stok Durumu Uyarıları - Sadece basit ürünler için */}
      {!isVariantProduct && lowStockThreshold !== null && availableQuantity <= lowStockThreshold && (
        <div className="flex items-center gap-3 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <p className="text-sm text-yellow-800">
            Stok miktarı düşük stok eşiğinin altında veya eşit. (
            {availableQuantity} / {lowStockThreshold})
          </p>
        </div>
      )}

      {totalAvailable < 0 && (
        <div className="flex items-center gap-3 p-4 border border-red-200 bg-red-50 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-800">
            Rezerve edilmiş stok, mevcut stoktan fazla. Lütfen stok miktarını
            artırın.
          </p>
        </div>
      )}

      {/* Kaydetme Durumu */}
      {(updateStockMutation.isPending || updateSkuMutation.isPending) && (
        <div className="flex items-center justify-end pt-4 border-t border-border">
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Değişiklikler kaydediliyor...
          </div>
        </div>
      )}
    </div>
  )
}
