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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  productService,
  VariantOption,
  VariantValue,
  CreateVariantOptionDto,
  CreateVariantValueDto,
} from "@/services/product.service"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Trash2, Edit2, X, Palette, Type } from "lucide-react"
import { cn } from "@/lib/utils"

interface VariantsStepProps {
  productId?: string | null
}

export function VariantsStep({ productId }: VariantsStepProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Dialog states
  const [isOptionDialogOpen, setIsOptionDialogOpen] = useState(false)
  const [isValueDialogOpen, setIsValueDialogOpen] = useState(false)
  const [editingOption, setEditingOption] = useState<VariantOption | null>(null)
  const [editingValue, setEditingValue] = useState<VariantValue | null>(null)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)

  // Form states
  const [optionName, setOptionName] = useState("")
  const [optionType, setOptionType] = useState<"COLOR" | "TEXT">("TEXT")
  const [optionDisplayOrder, setOptionDisplayOrder] = useState(0)
  const [optionIsRequired, setOptionIsRequired] = useState(true)

  const [valueValue, setValueValue] = useState("")
  const [valueColorCode, setValueColorCode] = useState("#000000")
  const [valuePriceDelta, setValuePriceDelta] = useState(0)
  const [valueDisplayOrder, setValueDisplayOrder] = useState(0)
  const [valueIsActive, setValueIsActive] = useState(true)

  // Get variant options
  const { data: variantOptions = [], isLoading } = useQuery({
    queryKey: ["variantOptions", productId],
    queryFn: () => productService.getVariantOptionsByProduct(productId!),
    enabled: !!productId,
  })

  // Create variant option mutation
  const createOptionMutation = useMutation({
    mutationFn: (data: CreateVariantOptionDto) =>
      productService.createVariantOption(productId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variantOptions", productId] })
      toast({
        title: "Başarılı",
        description: "Varyasyon seçeneği başarıyla oluşturuldu.",
      })
      handleCloseOptionDialog()
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description:
          error.response?.data?.message || "Varyasyon seçeneği oluşturulurken bir hata oluştu.",
        variant: "destructive",
      })
    },
  })

  // Update variant option mutation
  const updateOptionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateVariantOptionDto> }) =>
      productService.updateVariantOption(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variantOptions", productId] })
      toast({
        title: "Başarılı",
        description: "Varyasyon seçeneği başarıyla güncellendi.",
      })
      handleCloseOptionDialog()
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description:
          error.response?.data?.message || "Varyasyon seçeneği güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    },
  })

  // Delete variant option mutation
  const deleteOptionMutation = useMutation({
    mutationFn: (id: string) => productService.deleteVariantOption(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variantOptions", productId] })
      toast({
        title: "Başarılı",
        description: "Varyasyon seçeneği başarıyla silindi.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description:
          error.response?.data?.message || "Varyasyon seçeneği silinirken bir hata oluştu.",
        variant: "destructive",
      })
    },
  })

  // Create variant value mutation
  const createValueMutation = useMutation({
    mutationFn: (data: CreateVariantValueDto) =>
      productService.createVariantValue(selectedOptionId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variantOptions", productId] })
      toast({
        title: "Başarılı",
        description: "Varyasyon değeri başarıyla oluşturuldu.",
      })
      handleCloseValueDialog()
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description:
          error.response?.data?.message || "Varyasyon değeri oluşturulurken bir hata oluştu.",
        variant: "destructive",
      })
    },
  })

  // Update variant value mutation
  const updateValueMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateVariantValueDto> }) =>
      productService.updateVariantValue(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variantOptions", productId] })
      toast({
        title: "Başarılı",
        description: "Varyasyon değeri başarıyla güncellendi.",
      })
      handleCloseValueDialog()
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description:
          error.response?.data?.message || "Varyasyon değeri güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    },
  })

  // Delete variant value mutation
  const deleteValueMutation = useMutation({
    mutationFn: (id: string) => productService.deleteVariantValue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variantOptions", productId] })
      toast({
        title: "Başarılı",
        description: "Varyasyon değeri başarıyla silindi.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description:
          error.response?.data?.message || "Varyasyon değeri silinirken bir hata oluştu.",
        variant: "destructive",
      })
    },
  })

  const handleOpenOptionDialog = (option?: VariantOption) => {
    if (option) {
      setEditingOption(option)
      setOptionName(option.name)
      setOptionType(option.type)
      setOptionDisplayOrder(option.displayOrder)
      setOptionIsRequired(option.isRequired)
    } else {
      setEditingOption(null)
      setOptionName("")
      setOptionType("TEXT")
      setOptionDisplayOrder(0)
      setOptionIsRequired(true)
    }
    setIsOptionDialogOpen(true)
  }

  const handleCloseOptionDialog = () => {
    setIsOptionDialogOpen(false)
    setEditingOption(null)
    setOptionName("")
    setOptionType("TEXT")
    setOptionDisplayOrder(0)
    setOptionIsRequired(true)
  }

  const handleSaveOption = () => {
    if (!optionName.trim()) {
      toast({
        title: "Hata",
        description: "Varyasyon seçeneği adı gereklidir.",
        variant: "destructive",
      })
      return
    }

    const data: CreateVariantOptionDto = {
      name: optionName.trim(),
      type: optionType,
      displayOrder: optionDisplayOrder,
      isRequired: optionIsRequired,
    }

    if (editingOption) {
      updateOptionMutation.mutate({ id: editingOption.id, data })
    } else {
      createOptionMutation.mutate(data)
    }
  }

  const handleOpenValueDialog = (optionId: string, value?: VariantValue) => {
    setSelectedOptionId(optionId)
    if (value) {
      setEditingValue(value)
      setValueValue(value.value)
      setValueColorCode(value.colorCode || "#000000")
      setValuePriceDelta(value.priceDelta)
      setValueDisplayOrder(value.displayOrder)
      setValueIsActive(value.isActive)
    } else {
      setEditingValue(null)
      setValueValue("")
      setValueColorCode("#000000")
      setValuePriceDelta(0)
      setValueDisplayOrder(0)
      setValueIsActive(true)
    }
    setIsValueDialogOpen(true)
  }

  const handleCloseValueDialog = () => {
    setIsValueDialogOpen(false)
    setEditingValue(null)
    setSelectedOptionId(null)
    setValueValue("")
    setValueColorCode("#000000")
    setValuePriceDelta(0)
    setValueDisplayOrder(0)
    setValueIsActive(true)
  }

  const handleSaveValue = () => {
    if (!valueValue.trim()) {
      toast({
        title: "Hata",
        description: "Varyasyon değeri gereklidir.",
        variant: "destructive",
      })
      return
    }

    const selectedOption = variantOptions.find((opt) => opt.id === selectedOptionId)
    if (!selectedOption) {
      toast({
        title: "Hata",
        description: "Varyasyon seçeneği bulunamadı.",
        variant: "destructive",
      })
      return
    }

    const data: CreateVariantValueDto = {
      value: valueValue.trim(),
      colorCode: selectedOption.type === "COLOR" ? valueColorCode : null,
      priceDelta: valuePriceDelta,
      displayOrder: valueDisplayOrder,
      isActive: valueIsActive,
    }

    if (editingValue) {
      updateValueMutation.mutate({ id: editingValue.id, data })
    } else {
      createValueMutation.mutate(data)
    }
  }

  if (!productId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            Varyasyon ayarlarını yapabilmek için önce ürünü oluşturmanız gerekiyor.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Varyasyon Ayarları
        </h3>
        <p className="text-sm text-muted-foreground">
          Varyasyon seçeneklerini ve değerlerini ayarlayın. Renk tipi varyasyonlar için renk
          kodu, yazı tipi varyasyonlar için metin değerleri kullanılır.
        </p>
      </div>

      {/* Varyasyon Seçenekleri */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-semibold text-foreground">Varyasyon Seçenekleri</h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOpenOptionDialog()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Varyasyon Seçeneği
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Yükleniyor...
          </div>
        ) : variantOptions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
            Henüz varyasyon seçeneği eklenmedi. Yeni varyasyon seçeneği eklemek için yukarıdaki
            butona tıklayın.
          </div>
        ) : (
          <div className="space-y-4">
            {variantOptions.map((option) => (
              <div
                key={option.id}
                className="border border-border rounded-lg p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {option.type === "COLOR" ? (
                      <Palette className="w-5 h-5 text-primary" />
                    ) : (
                      <Type className="w-5 h-5 text-primary" />
                    )}
                    <div>
                      <h5 className="font-semibold text-foreground">{option.name}</h5>
                      <p className="text-xs text-muted-foreground">
                        {option.type === "COLOR" ? "Renk Tipi" : "Yazı Tipi"} • Sıra:{" "}
                        {option.displayOrder} • {option.isRequired ? "Zorunlu" : "Opsiyonel"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenOptionDialog(option)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (
                          confirm(
                            `"${option.name}" varyasyon seçeneğini silmek istediğinize emin misiniz? Bu işlem tüm varyasyon değerlerini de silecektir.`
                          )
                        ) {
                          deleteOptionMutation.mutate(option.id)
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {/* Varyasyon Değerleri */}
                <div className="ml-8 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Değerler</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenValueDialog(option.id)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Değer Ekle
                    </Button>
                  </div>
                  {option.values && option.values.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {option.values.map((value) => (
                        <div
                          key={value.id}
                          className={cn(
                            "relative flex items-center gap-2 p-2 border rounded-lg",
                            !value.isActive && "opacity-50"
                          )}
                        >
                          {option.type === "COLOR" && value.colorCode ? (
                            <div
                              className="w-6 h-6 rounded border border-border"
                              style={{ backgroundColor: value.colorCode }}
                            />
                          ) : null}
                          <span className="text-sm flex-1">{value.value}</span>
                          {Number(value.priceDelta) !== 0 && (
                            <span className="text-xs text-muted-foreground">
                              {Number(value.priceDelta) > 0 ? "+" : ""}
                              {Number(value.priceDelta).toFixed(2)}₺
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleOpenValueDialog(option.id, value)}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => {
                                if (
                                  confirm(
                                    `"${value.value}" değerini silmek istediğinize emin misiniz?`
                                  )
                                ) {
                                  deleteValueMutation.mutate(value.id)
                                }
                              }}
                            >
                              <X className="w-3 h-3 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Henüz değer eklenmedi.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Varyasyon Seçeneği Dialog */}
      <Dialog open={isOptionDialogOpen} onOpenChange={setIsOptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingOption ? "Varyasyon Seçeneğini Düzenle" : "Yeni Varyasyon Seçeneği"}
            </DialogTitle>
            <DialogDescription>
              Varyasyon seçeneği adını, tipini ve diğer ayarlarını belirleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="optionName">Varyasyon Seçeneği Adı *</Label>
              <Input
                id="optionName"
                value={optionName}
                onChange={(e) => setOptionName(e.target.value)}
                placeholder="Örn: Renk, Beden, Boyut"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="optionType">Varyasyon Tipi *</Label>
              <Select
                value={optionType}
                onValueChange={(value: "COLOR" | "TEXT") => setOptionType(value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COLOR">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Renk
                    </div>
                  </SelectItem>
                  <SelectItem value="TEXT">
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      Yazı Tipi
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {optionType === "COLOR"
                  ? "Renk tipi varyasyonlar için renk kodu kullanılır."
                  : "Yazı tipi varyasyonlar için metin değerleri kullanılır (örn: S, M, L)."}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="optionDisplayOrder">Görüntülenme Sırası</Label>
                <Input
                  id="optionDisplayOrder"
                  type="number"
                  min="0"
                  value={optionDisplayOrder}
                  onChange={(e) => setOptionDisplayOrder(parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="optionIsRequired"
                  checked={optionIsRequired}
                  onChange={(e) => setOptionIsRequired(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <Label htmlFor="optionIsRequired" className="cursor-pointer">
                  Zorunlu
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseOptionDialog}>
              İptal
            </Button>
            <Button
              type="button"
              onClick={handleSaveOption}
              disabled={createOptionMutation.isPending || updateOptionMutation.isPending}
            >
              {editingOption ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Varyasyon Değeri Dialog */}
      <Dialog open={isValueDialogOpen} onOpenChange={setIsValueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingValue ? "Varyasyon Değerini Düzenle" : "Yeni Varyasyon Değeri"}
            </DialogTitle>
            <DialogDescription>
              Varyasyon değerini ve fiyat farkını belirleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="valueValue">Değer *</Label>
              <Input
                id="valueValue"
                value={valueValue}
                onChange={(e) => setValueValue(e.target.value)}
                placeholder="Örn: Kırmızı, XL, Büyük"
                className="mt-1"
              />
            </div>
            {selectedOptionId &&
              variantOptions.find((opt) => opt.id === selectedOptionId)?.type === "COLOR" && (
                <div>
                  <Label htmlFor="valueColorCode">Renk Kodu *</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="relative">
                      <input
                        type="color"
                        id="valueColorCode"
                        value={valueColorCode}
                        onChange={(e) => setValueColorCode(e.target.value)}
                        className="w-16 h-10 rounded border border-border cursor-pointer appearance-none bg-transparent"
                        style={{
                          backgroundColor: valueColorCode,
                        }}
                      />
                    </div>
                    <Input
                      value={valueColorCode}
                      onChange={(e) => {
                        const hex = e.target.value
                        // Hex format kontrolü
                        if (/^#[0-9A-Fa-f]{0,6}$/.test(hex) || hex === "") {
                          setValueColorCode(hex)
                        }
                      }}
                      placeholder="#000000"
                      className="flex-1 font-mono"
                      maxLength={7}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Renk seçmek için renk kutusuna tıklayın veya hex kodunu girin (örn: #FF0000).
                  </p>
                </div>
              )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="valuePriceDelta">Fiyat Farkı (₺)</Label>
                <Input
                  id="valuePriceDelta"
                  type="number"
                  step="0.01"
                  value={valuePriceDelta}
                  onChange={(e) => setValuePriceDelta(parseFloat(e.target.value) || 0)}
                  className="mt-1"
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Bu değer seçildiğinde ürün fiyatına eklenecek/çıkarılacak miktar.
                </p>
              </div>
              <div>
                <Label htmlFor="valueDisplayOrder">Görüntülenme Sırası</Label>
                <Input
                  id="valueDisplayOrder"
                  type="number"
                  min="0"
                  value={valueDisplayOrder}
                  onChange={(e) => setValueDisplayOrder(parseInt(e.target.value) || 0)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="valueIsActive"
                checked={valueIsActive}
                onChange={(e) => setValueIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <Label htmlFor="valueIsActive" className="cursor-pointer">
                Aktif
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCloseValueDialog}>
              İptal
            </Button>
            <Button
              type="button"
              onClick={handleSaveValue}
              disabled={createValueMutation.isPending || updateValueMutation.isPending}
            >
              {editingValue ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
