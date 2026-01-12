"use client"

import { useState, useEffect, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { X, Image as ImageIcon, Loader2 } from "lucide-react"
import { MediaLibrarySelect } from "@/components/media/MediaLibrarySelect"
import { Upload } from "@/services/upload.service"
import {
  productService,
  CreateProductGalleryDto,
  ProductGallery,
} from "@/services/product.service"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/components/ui/use-toast"

interface ProductGalleryManagerProps {
  productId?: string | null
  variantCombinationId?: string | null
  onValidationChange?: (isValid: boolean) => void
  onGallerySaved?: () => void
}

export function ProductGalleryManager({
  productId,
  variantCombinationId,
  onValidationChange,
  onGallerySaved,
}: ProductGalleryManagerProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Seçilen resimler
  const [mainImage, setMainImage] = useState<Upload | null>(null)
  const [thumbnailImage, setThumbnailImage] = useState<Upload | null>(null)
  const [detailImages, setDetailImages] = useState<Upload[]>([])

  // Modal durumları
  const [isMainImageModalOpen, setIsMainImageModalOpen] = useState(false)
  const [isThumbnailModalOpen, setIsThumbnailModalOpen] = useState(false)
  const [isDetailImagesModalOpen, setIsDetailImagesModalOpen] = useState(false)

  // Mevcut gallery'yi getir
  const { data: existingGallery, isLoading: isLoadingGallery } = useQuery({
    queryKey: ["productGallery", productId, variantCombinationId],
    queryFn: async () => {
      if (!productId && !variantCombinationId) return null

      if (variantCombinationId) {
        return await productService.getProductGalleryByVariant(variantCombinationId)
      } else {
        return await productService.getProductGalleryByProduct(productId!)
      }
    },
    enabled: !!productId || !!variantCombinationId,
  })

  // Mevcut gallery'den resimleri yükle
  useEffect(() => {
    console.log('[ProductGalleryManager] existingGallery changed:', existingGallery);
    if (existingGallery) {
      console.log('[ProductGalleryManager] Loading images from existing gallery:', {
        mainImage: existingGallery.mainImage?.id,
        thumbnailImage: existingGallery.thumbnailImage?.id,
        detailImagesCount: existingGallery.detailImages?.length || 0,
      });
      setMainImage(existingGallery.mainImage)
      setThumbnailImage(existingGallery.thumbnailImage)
      setDetailImages(existingGallery.detailImages || [])
    } else {
      // Eğer existingGallery null ise (henüz yüklenmediyse veya yoksa), state'leri sıfırla
      // Ancak undefined ise (henüz yükleniyor), state'leri değiştirme
      if (existingGallery === null && !isLoadingGallery) {
        console.log('[ProductGalleryManager] No existing gallery found, resetting states');
        setMainImage(null)
        setThumbnailImage(null)
        setDetailImages([])
      }
    }
  }, [existingGallery, isLoadingGallery])

  // Validation durumunu parent'a bildir
  useEffect(() => {
    if (onValidationChange) {
      const isValid = !!(mainImage && thumbnailImage)
      console.log('[ProductGalleryManager] Validation changed:', { isValid, mainImage: !!mainImage, thumbnailImage: !!thumbnailImage });
      onValidationChange(isValid)
    }
  }, [mainImage, thumbnailImage, onValidationChange])

  // Gallery oluşturma mutation
  const createGalleryMutation = useMutation({
    mutationFn: async (data: CreateProductGalleryDto) => {
      if (variantCombinationId) {
        return await productService.createVariantGallery(variantCombinationId, data)
      } else if (productId) {
        return await productService.createProductGallery(productId, data)
      } else {
        throw new Error("productId veya variantCombinationId gerekli")
      }
    },
    onSuccess: (createdGallery) => {
      queryClient.setQueryData(
        ["productGallery", productId, variantCombinationId],
        createdGallery
      )
      // Callback'i çağır
      onGallerySaved?.()
      setMainImage(createdGallery.mainImage)
      setThumbnailImage(createdGallery.thumbnailImage)
      setDetailImages(createdGallery.detailImages || [])
      toast({
        title: "Başarılı",
        description: "Ürün galerisi başarıyla kaydedildi.",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description:
          error.response?.data?.message || "Galeri oluşturulurken bir hata oluştu.",
        variant: "destructive",
      })
    },
  })

  // Gallery güncelleme mutation
  const updateGalleryMutation = useMutation({
    mutationFn: async ({
      galleryId,
      data,
    }: {
      galleryId: string
      data: Partial<CreateProductGalleryDto>
    }) => {
      console.log('[ProductGalleryManager] updateGalleryMutation.mutationFn - START');
      console.log('[ProductGalleryManager] Calling API with:', {
        galleryId,
        data: {
          mainImageId: data.mainImageId,
          thumbnailImageId: data.thumbnailImageId,
          detailImageIds: data.detailImageIds,
          displayOrder: data.displayOrder,
        },
      });

      const result = await productService.updateProductGallery(galleryId, data);

      console.log('[ProductGalleryManager] API Response:', {
        id: result.id,
        mainImageId: result.mainImageId,
        mainImage: result.mainImage ? {
          id: result.mainImage.id,
          filename: result.mainImage.filename,
        } : null,
        thumbnailImageId: result.thumbnailImageId,
        thumbnailImage: result.thumbnailImage ? {
          id: result.thumbnailImage.id,
          filename: result.thumbnailImage.filename,
        } : null,
        detailImagesCount: result.detailImages?.length || 0,
      });
      console.log('[ProductGalleryManager] updateGalleryMutation.mutationFn - END');

      return result;
    },
    onSuccess: (updatedGallery) => {
      console.log('[ProductGalleryManager] updateGalleryMutation.onSuccess - START');
      console.log('[ProductGalleryManager] Updated gallery received:', {
        id: updatedGallery.id,
        mainImage: updatedGallery.mainImage ? {
          id: updatedGallery.mainImage.id,
          filename: updatedGallery.mainImage.filename,
        } : null,
        thumbnailImage: updatedGallery.thumbnailImage ? {
          id: updatedGallery.thumbnailImage.id,
          filename: updatedGallery.thumbnailImage.filename,
        } : null,
        detailImagesCount: updatedGallery.detailImages?.length || 0,
      });

      queryClient.setQueryData(
        ["productGallery", productId, variantCombinationId],
        updatedGallery
      )
      // Callback'i çağır
      onGallerySaved?.()

      console.log('[ProductGalleryManager] Setting state with:', {
        mainImage: updatedGallery.mainImage ? {
          id: updatedGallery.mainImage.id,
          filename: updatedGallery.mainImage.filename,
        } : null,
        thumbnailImage: updatedGallery.thumbnailImage ? {
          id: updatedGallery.thumbnailImage.id,
          filename: updatedGallery.thumbnailImage.filename,
        } : null,
        detailImagesCount: updatedGallery.detailImages?.length || 0,
      });

      setMainImage(updatedGallery.mainImage)
      setThumbnailImage(updatedGallery.thumbnailImage)
      setDetailImages(updatedGallery.detailImages || [])

      console.log('[ProductGalleryManager] State updated');

      toast({
        title: "Başarılı",
        description: "Ürün galerisi başarıyla güncellendi.",
      })
      console.log('[ProductGalleryManager] updateGalleryMutation.onSuccess - END');
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description:
          error.response?.data?.message || "Galeri güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    },
  })

  // Otomatik kaydetme için debounce timer
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Resimler değiştiğinde otomatik kaydet (debounce ile)
  useEffect(() => {
    // Eğer productId veya variantCombinationId yoksa, kaydetme
    if (!productId && !variantCombinationId) {
      return
    }

    // Main image ve thumbnail image zorunlu
    if (!mainImage || !thumbnailImage) {
      return
    }

    // Eğer existingGallery henüz yükleniyorsa bekle
    if (isLoadingGallery) {
      return
    }

    // Debounce: 1 saniye bekle, sonra kaydet
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      const data: CreateProductGalleryDto = {
        mainImageId: mainImage.id,
        thumbnailImageId: thumbnailImage.id,
        detailImageIds: detailImages.map((img) => img.id),
        displayOrder: 0,
      }

      // existingGallery varsa ve geçerli bir id'si varsa güncelle
      if (existingGallery && existingGallery.id && typeof existingGallery.id === "string") {
        const galleryId = existingGallery.id
        if (galleryId && galleryId !== "undefined" && galleryId.length > 0) {
          // Sadece değişiklik varsa güncelle
          const mainImageChanged = existingGallery.mainImage?.id !== mainImage?.id
          const thumbnailImageChanged = existingGallery.thumbnailImage?.id !== thumbnailImage?.id
          const detailImagesChanged =
            JSON.stringify(existingGallery.detailImages?.map((img) => img.id).sort()) !==
            JSON.stringify(detailImages.map((img) => img.id).sort())

          if (mainImageChanged || thumbnailImageChanged || detailImagesChanged) {
            console.log('[ProductGalleryManager] Auto-saving gallery changes...')
            updateGalleryMutation.mutate({ galleryId, data })
          }
        } else {
          // Geçersiz ID, yeni oluştur
          createGalleryMutation.mutate(data)
        }
      } else {
        // existingGallery yok, yeni oluştur
        console.log('[ProductGalleryManager] Auto-creating new gallery...')
        createGalleryMutation.mutate(data)
      }
    }, 1000) // 1 saniye debounce

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [mainImage, thumbnailImage, detailImages, productId, variantCombinationId, existingGallery, isLoadingGallery, createGalleryMutation, updateGalleryMutation])

  // Ana resim seçimi
  const handleMainImageSelect = (uploads: Upload[]) => {
    if (uploads.length > 0) {
      setMainImage(uploads[0])
      setIsMainImageModalOpen(false)
    }
  }

  // Thumbnail resim seçimi
  const handleThumbnailImageSelect = (uploads: Upload[]) => {
    if (uploads.length > 0) {
      setThumbnailImage(uploads[0])
      setIsThumbnailModalOpen(false)
    }
  }

  // Detay resimler seçimi
  const handleDetailImagesSelect = (uploads: Upload[]) => {
    setDetailImages(uploads)
    setIsDetailImagesModalOpen(false)
  }


  // Detay resim sil
  const handleRemoveDetailImage = (index: number) => {
    setDetailImages(detailImages.filter((_, i) => i !== index))
  }

  if (!productId && !variantCombinationId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
          <p className="text-sm text-yellow-800">
            Resim ekleyebilmek için önce ürünü oluşturmanız gerekiyor.
          </p>
        </div>
      </div>
    )
  }

  if (isLoadingGallery) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ana Resim */}
        <div>
          <Label>Ana Resim *</Label>
          <div className="mt-2">
            {mainImage ? (
              <div className="relative border border-border rounded-lg p-4">
                <img
                  src={mainImage.s3Url}
                  alt={mainImage.displayName || mainImage.filename}
                  className="w-full h-48 object-cover rounded"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setMainImage(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsMainImageModalOpen(true)}
                  >
                    Değiştir
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">Ana resim seçin</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMainImageModalOpen(true)}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Resim Seç
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail Resim */}
        <div>
          <Label>Thumbnail Resim *</Label>
          <div className="mt-2">
            {thumbnailImage ? (
              <div className="relative border border-border rounded-lg p-4">
                <img
                  src={thumbnailImage.s3Url}
                  alt={thumbnailImage.displayName || thumbnailImage.filename}
                  className="w-full h-48 object-cover rounded"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => setThumbnailImage(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsThumbnailModalOpen(true)}
                  >
                    Değiştir
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">Thumbnail resim seçin</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsThumbnailModalOpen(true)}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Resim Seç
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detay Resimler */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Detay Resimler</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsDetailImagesModalOpen(true)}
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Resim Ekle
          </Button>
        </div>
        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          {detailImages.map((image, index) => (
            <div
              key={image.id}
              className="relative border border-border rounded-lg overflow-hidden"
            >
              <img
                src={image.s3Url}
                alt={image.displayName || image.filename}
                className="w-full h-32 object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-1 right-1"
                onClick={() => handleRemoveDetailImage(index)}
              >
                <X className="w-3 h-3" />
              </Button>
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                {index + 1}
              </div>
            </div>
          ))}
          {detailImages.length === 0 && (
            <div className="border-2 border-dashed border-border rounded-lg p-4 text-center flex items-center justify-center col-span-full">
              <p className="text-sm text-muted-foreground">Henüz detay resim eklenmedi</p>
            </div>
          )}
        </div>
      </div>


      {/* MediaLibrarySelect Modalleri */}
      <MediaLibrarySelect
        open={isMainImageModalOpen}
        onOpenChange={setIsMainImageModalOpen}
        onSelect={handleMainImageSelect}
        mode="single"
        title="Ana Resim Seç"
        description="Ana resim olarak kullanılacak resmi seçin."
        selectedUploads={mainImage ? [mainImage] : []}
      />

      <MediaLibrarySelect
        open={isThumbnailModalOpen}
        onOpenChange={setIsThumbnailModalOpen}
        onSelect={handleThumbnailImageSelect}
        mode="single"
        title="Thumbnail Resim Seç"
        description="Thumbnail olarak kullanılacak resmi seçin."
        selectedUploads={thumbnailImage ? [thumbnailImage] : []}
      />

      <MediaLibrarySelect
        open={isDetailImagesModalOpen}
        onOpenChange={setIsDetailImagesModalOpen}
        onSelect={handleDetailImagesSelect}
        mode="multiple"
        title="Detay Resimler Seç"
        description="Detay resimlerini sıralı olarak seçin. Seçim sırası korunacaktır."
        selectedUploads={detailImages}
      />
    </div>
  )
}
