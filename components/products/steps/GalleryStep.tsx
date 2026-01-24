"use client"

import { ProductGalleryManager } from "../ProductGalleryManager"
import { Upload } from "@/services/upload.service"

interface GalleryStepProps {
  productId?: string | null
  productType?: "SIMPLE" | "VARIANT" | "BUNDLE"
  variantCombinationId?: string | null
  onValidationChange?: (isValid: boolean) => void
  onGalleryChange?: (gallery: {
    mainImage: Upload | null
    thumbnailImage: Upload | null
    detailImages: Upload[]
  }) => void
  initialGallery?: {
    mainImage: Upload | null
    thumbnailImage: Upload | null
    detailImages: Upload[]
  }
}

export function GalleryStep({
  productId,
  productType = "SIMPLE",
  variantCombinationId,
  onValidationChange,
  onGalleryChange,
  initialGallery,
}: GalleryStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Ürün Resimleri
        </h3>
        <p className="text-sm text-muted-foreground">
          Ürün için ana resim, thumbnail ve detay resimlerini seçin.
          {productId ? " Değişiklikler otomatik olarak kaydedilir." : " Ürün oluşturulduktan sonra kaydedilecektir."}
        </p>
      </div>

      <ProductGalleryManager
        productId={productId}
        variantCombinationId={variantCombinationId}
        onValidationChange={onValidationChange}
        onGalleryChange={onGalleryChange}
        initialGallery={initialGallery}
      />
    </div>
  )
}
