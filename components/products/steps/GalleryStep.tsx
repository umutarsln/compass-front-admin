"use client"

import { ProductGalleryManager } from "../ProductGalleryManager"

interface GalleryStepProps {
  productId?: string | null
  productType?: "SIMPLE" | "VARIANT" | "BUNDLE"
  variantCombinationId?: string | null
  onValidationChange?: (isValid: boolean) => void
}

export function GalleryStep({
  productId,
  productType = "SIMPLE",
  variantCombinationId,
  onValidationChange,
}: GalleryStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Ürün Resimleri
        </h3>
        <p className="text-sm text-muted-foreground">
          Ürün için ana resim, thumbnail ve detay resimlerini seçin. Değişiklikler otomatik olarak kaydedilir.
        </p>
      </div>

      <ProductGalleryManager
        productId={productId}
        variantCombinationId={variantCombinationId}
        onValidationChange={onValidationChange}
      />
    </div>
  )
}
