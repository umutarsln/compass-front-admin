"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  productService,
  VariantCombination,
  UpdateVariantCombinationDto,
} from "@/services/product.service"
import { stockService } from "@/services/stock.service"
import { useToast } from "@/components/ui/use-toast"
import { Plus, RefreshCw, Edit2, Image as ImageIcon, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import { ProductGalleryManager } from "../ProductGalleryManager"

interface VariantCombinationsStepProps {
  productId?: string | null
  productType?: string
}

export function VariantCombinationsStep({
  productId,
  productType,
}: VariantCombinationsStepProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const [editingCombination, setEditingCombination] = useState<VariantCombination | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isGalleryDialogOpen, setIsGalleryDialogOpen] = useState(false)
  const [selectedCombinationId, setSelectedCombinationId] = useState<string | null>(null)

  // Form states
  const [sku, setSku] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [isDisabled, setIsDisabled] = useState(false)
  
  // Stock dialog states
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false)
  const [selectedCombinationForStock, setSelectedCombinationForStock] = useState<VariantCombination | null>(null)
  const [availableQuantity, setAvailableQuantity] = useState(0)
  const [lowStockThreshold, setLowStockThreshold] = useState<number | null>(null)
  const [stockSku, setStockSku] = useState("")

  // Get variant combinations
  const { data: variantCombinations = [], isLoading, refetch } = useQuery({
    queryKey: ["variantCombinations", productId],
    queryFn: () => productService.getVariantCombinationsByProduct(productId!),
    enabled: !!productId,
  })

  // Generate all combinations mutation
  const generateCombinationsMutation = useMutation({
    mutationFn: () => productService.generateAllVariantCombinations(productId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variantCombinations", productId] })
      toast({
        title: "Başarılı",
        description: "Tüm varyasyon kombinasyonları başarıyla oluşturuldu.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description:
          error.response?.data?.message ||
          "Varyasyon kombinasyonları oluşturulurken bir hata oluştu.",
        variant: "destructive",
      })
    },
  })

  // Update combination mutation
  const updateCombinationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVariantCombinationDto }) =>
      productService.updateVariantCombination(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variantCombinations", productId] })
      queryClient.invalidateQueries({ queryKey: ["variantOptions", productId] })
      toast({
        title: "Başarılı",
        description: "Varyasyon kombinasyonu başarıyla güncellendi.",
      })
      handleCloseEditDialog()
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description:
          error.response?.data?.message ||
          "Varyasyon kombinasyonu güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    },
  })


  // Quick toggle mutations
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      productService.updateVariantCombination(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variantCombinations", productId] })
    },
  })

  const toggleDisabledMutation = useMutation({
    mutationFn: ({ id, isDisabled }: { id: string; isDisabled: boolean }) =>
      productService.updateVariantCombination(id, { isDisabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variantCombinations", productId] })
    },
  })

  // Stock update mutation
  const updateStockMutation = useMutation({
    mutationFn: ({ combinationId, data }: { combinationId: string; data: { availableQuantity: number; lowStockThreshold?: number | null } }) =>
      stockService.updateStock("VARIANT_COMBINATION", combinationId, {
        availableQuantity: data.availableQuantity,
        lowStockThreshold: data.lowStockThreshold ?? undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variantCombinations", productId] })
      queryClient.invalidateQueries({ queryKey: ["stock"] })
      toast({
        title: "Başarılı",
        description: "Stok bilgisi başarıyla güncellendi.",
      })
      handleCloseStockDialog()
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description:
          error.response?.data?.message ||
          "Stok bilgisi güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    },
  })

  const handleOpenEditDialog = (combination?: VariantCombination) => {
    if (combination) {
      setEditingCombination(combination)
      setSku(combination.sku || "")
      setIsActive(combination.isActive)
      setIsDisabled(combination.isDisabled)
    } else {
      setEditingCombination(null)
      setSku("")
      setIsActive(true)
      setIsDisabled(false)
    }
    setIsEditDialogOpen(true)
  }

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false)
    setEditingCombination(null)
    setSku("")
    setIsActive(true)
    setIsDisabled(false)
  }

  const handleSaveCombination = () => {
    if (!editingCombination) return

    const data: UpdateVariantCombinationDto = {
      sku: sku.trim() || null,
      isActive,
      isDisabled,
    }

    updateCombinationMutation.mutate({ id: editingCombination.id, data })
  }

  const handleOpenStockDialog = (combination: VariantCombination) => {
    setSelectedCombinationForStock(combination)
    setAvailableQuantity(combination.stock?.availableQuantity || 0)
    setLowStockThreshold(combination.stock?.lowStockThreshold || null)
    setStockSku(combination.sku || "")
    setIsStockDialogOpen(true)
  }

  const handleCloseStockDialog = () => {
    setIsStockDialogOpen(false)
    setSelectedCombinationForStock(null)
    setAvailableQuantity(0)
    setLowStockThreshold(null)
    setStockSku("")
  }

  const handleSaveStock = () => {
    if (!selectedCombinationForStock) return

    // Önce SKU'yu güncelle (eğer değiştiyse)
    if (stockSku !== selectedCombinationForStock.sku) {
      updateCombinationMutation.mutate({
        id: selectedCombinationForStock.id,
        data: {
          sku: stockSku.trim() || null,
        },
      })
    }

    // Sonra stoku güncelle
    updateStockMutation.mutate({
      combinationId: selectedCombinationForStock.id,
      data: {
        availableQuantity,
        lowStockThreshold: lowStockThreshold || null,
      },
    })
  }

  const handleOpenGalleryDialog = (combinationId: string) => {
    setSelectedCombinationId(combinationId)
    setIsGalleryDialogOpen(true)
  }

  const handleCloseGalleryDialog = () => {
    setIsGalleryDialogOpen(false)
    setSelectedCombinationId(null)
  }

  const getCombinationLabel = (combination: VariantCombination): string => {
    return combination.variantValues
      .map((value) => {
        const optionName = value.variantOption?.name || "Bilinmeyen"
        return `${optionName}: ${value.value}`
      })
      .join(" • ")
  }

  if (!productId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            Varyasyon kombinasyonlarını yönetebilmek için önce ürünü oluşturmanız gerekiyor.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Varyasyon Kombinasyonları
        </h3>
        <p className="text-sm text-muted-foreground">
          Tüm varyasyon kombinasyonlarını oluşturun ve her birini özelleştirin. Her kombinasyon
          için SKU, fiyat, satış durumu, seçilebilirlik ve resim galerisi ayarlayabilirsiniz.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => generateCombinationsMutation.mutate()}
            disabled={generateCombinationsMutation.isPending}
          >
            <RefreshCw
              className={cn(
                "w-4 h-4 mr-2",
                generateCombinationsMutation.isPending && "animate-spin"
              )}
            />
            Tüm Kombinasyonları Oluştur
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Yenile
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Toplam: {variantCombinations.length} kombinasyon
        </div>
      </div>

      {/* Combinations Table */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
      ) : variantCombinations.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
          Henüz varyasyon kombinasyonu oluşturulmadı. Tüm kombinasyonları otomatik oluşturmak
          için yukarıdaki butona tıklayın.
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kombinasyon</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Galeri</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variantCombinations.map((combination) => (
                <TableRow
                  key={combination.id}
                  className={cn(
                    !combination.isActive && "opacity-50",
                    combination.isDisabled && "bg-muted"
                  )}
                >
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{getCombinationLabel(combination)}</div>
                      {combination.isDisabled && (
                        <Badge variant="secondary" className="text-xs">
                          Seçilemez
                        </Badge>
                      )}
                      {!combination.isActive && (
                        <Badge variant="outline" className="text-xs">
                          Satış Dışı
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm">
                      {combination.sku || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {combination.priceOverride ? (
                      <div>
                        <div className="font-semibold">
                          ₺{Number(combination.priceOverride).toFixed(2)}
                        </div>
                        <div className="text-xs text-muted-foreground">Override</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Varsayılan</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={combination.isActive}
                          onCheckedChange={(checked) => {
                            toggleActiveMutation.mutate({
                              id: combination.id,
                              isActive: checked,
                            })
                          }}
                          disabled={toggleActiveMutation.isPending}
                        />
                        <Label className="text-xs cursor-pointer">
                          {combination.isActive ? "Satışta" : "Satış Dışı"}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={!combination.isDisabled}
                          onCheckedChange={(checked) => {
                            toggleDisabledMutation.mutate({
                              id: combination.id,
                              isDisabled: !checked,
                            })
                          }}
                          disabled={toggleDisabledMutation.isPending}
                        />
                        <Label className="text-xs cursor-pointer">
                          {combination.isDisabled ? "Seçilemez" : "Seçilebilir"}
                        </Label>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {combination.stock ? (
                      <div className="space-y-1">
                        <div className="text-sm font-semibold">
                          Mevcut: {combination.stock.availableQuantity || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Rezerve: {combination.stock.reservedQuantity || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Kullanılabilir:{" "}
                          {(combination.stock.availableQuantity || 0) -
                            (combination.stock.reservedQuantity || 0)}
                        </div>
                        {combination.stock.lowStockThreshold !== null && (
                          <div className="text-xs text-muted-foreground">
                            Eşik: {combination.stock.lowStockThreshold}
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-1 w-full"
                          onClick={() => handleOpenStockDialog(combination)}
                        >
                          <Package className="w-3 h-3 mr-1" />
                          Stok Düzenle
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <span className="text-muted-foreground text-sm">Stok yok</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-1 w-full"
                          onClick={() => handleOpenStockDialog(combination)}
                        >
                          <Package className="w-3 h-3 mr-1" />
                          Stok Ekle
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenGalleryDialog(combination.id)}
                    >
                      <ImageIcon className="w-4 h-4 mr-1" />
                      {combination.galleries && Array.isArray(combination.galleries) && combination.galleries.length > 0
                        ? "Galeri"
                        : "Ekle"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Combination Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Varyasyon Kombinasyonunu Düzenle</DialogTitle>
            <DialogDescription>
              {editingCombination && getCombinationLabel(editingCombination)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Örn: PROD-RED-L"
                className="mt-1 font-mono"
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <div className="flex-1">
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Satışta
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Bu kombinasyon müşteriler tarafından satın alınabilir mi?
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isDisabled"
                  checked={!isDisabled}
                  onCheckedChange={(checked) => setIsDisabled(!checked)}
                />
                <div className="flex-1">
                  <Label htmlFor="isDisabled" className="cursor-pointer">
                    Seçilebilir
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Bu kombinasyon müşteriler tarafından seçilebilir mi? (Örn: Plastik + Kırmızı = Seçilemez)
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseEditDialog}>
              İptal
            </Button>
            <Button
              type="button"
              onClick={handleSaveCombination}
              disabled={updateCombinationMutation.isPending}
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gallery Dialog */}
      {selectedCombinationId && (
        <Dialog open={isGalleryDialogOpen} onOpenChange={setIsGalleryDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Kombinasyon Galerisi</DialogTitle>
              <DialogDescription>
                Bu kombinasyon için resim galerisini yönetin.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <ProductGalleryManager
                productId={null}
                productType={productType}
                variantCombinationId={selectedCombinationId}
                onValidationChange={() => {}}
                onGallerySaved={() => {
                  // Varyasyon kombinasyonlarını yeniden yükle
                  queryClient.invalidateQueries({ queryKey: ["variantCombinations", productId] })
                }}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseGalleryDialog}>
                Kapat
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Stock Dialog */}
      {selectedCombinationForStock && (
        <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Stok Yönetimi</DialogTitle>
              <DialogDescription>
                {getCombinationLabel(selectedCombinationForStock)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="stockSku">SKU</Label>
                <Input
                  id="stockSku"
                  value={stockSku}
                  onChange={(e) => setStockSku(e.target.value)}
                  placeholder="Örn: PROD-RED-L"
                  className="mt-1 font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Bu kombinasyon için benzersiz SKU kodu.
                </p>
              </div>
              <div>
                <Label htmlFor="availableQuantity">Mevcut Stok *</Label>
                <Input
                  id="availableQuantity"
                  type="number"
                  min="0"
                  value={availableQuantity}
                  onChange={(e) => setAvailableQuantity(parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Bu kombinasyon için toplam mevcut stok miktarı.
                </p>
              </div>
              <div>
                <Label htmlFor="lowStockThreshold">Düşük Stok Eşiği</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="0"
                  value={lowStockThreshold || ""}
                  onChange={(e) =>
                    setLowStockThreshold(e.target.value ? parseInt(e.target.value) : null)
                  }
                  placeholder="Boş bırakılabilir"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Stok bu değerin altına düştüğünde uyarı verilir.
                </p>
              </div>
              {selectedCombinationForStock.stock && (
                <div className="p-3 bg-muted rounded-lg space-y-1">
                  <div className="text-sm font-semibold">Mevcut Durum</div>
                  <div className="text-xs text-muted-foreground">
                    Rezerve: {selectedCombinationForStock.stock.reservedQuantity || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Kullanılabilir:{" "}
                    {(selectedCombinationForStock.stock.availableQuantity || 0) -
                      (selectedCombinationForStock.stock.reservedQuantity || 0)}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseStockDialog}>
                İptal
              </Button>
              <Button
                type="button"
                onClick={handleSaveStock}
                disabled={updateStockMutation.isPending}
              >
                Kaydet
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
