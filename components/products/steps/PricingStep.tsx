"use client"

import { Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProductType } from "@/services/product.service"

interface PricingStepProps {
  control: any
  register: any
  errors: any
  productType?: ProductType
}

/**
 * Fiyat alanına yazılan noktalı veya virgüllü değeri güvenli şekilde number'a çevirir.
 */
function parsePriceFieldValue(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) {
    return undefined
  }

  const normalized = trimmed.includes(",")
    ? trimmed.replace(/\./g, "").replace(",", ".")
    : trimmed
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function PricingStep({
  control,
  register,
  errors,
  productType = "SIMPLE",
}: PricingStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Fiyatlandırma
        </h3>
        <p className="text-sm text-muted-foreground">
          Ürün fiyatlandırma bilgilerini girin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="basePrice">Temel Fiyat (₺) *</Label>
          <Controller
            name="basePrice"
            control={control}
            render={({ field }) => (
              <Input
                id="basePrice"
                type="text"
                inputMode="decimal"
                {...field}
                value={field.value ?? ""}
                onChange={(e) => {
                  field.onChange(parsePriceFieldValue(e.target.value) ?? 0)
                }}
                placeholder="0.00"
                className="mt-1"
              />
            )}
          />
          {errors.basePrice && (
            <p className="text-sm text-red-600 mt-1">
              {errors.basePrice.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {productType === "VARIANT" && "Varyant kombinasyonları için varsayılan fiyat"}
            {productType === "BUNDLE" && "Bundle paketinin temel fiyatı"}
            {productType === "SIMPLE" && "Ürünün satış fiyatı"}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="discountedPrice">İndirimli Fiyat (₺)</Label>
            <Controller
              name="discountedPrice"
              control={control}
              render={({ field }) => (
                <Input
                  id="discountedPrice"
                  type="text"
                  inputMode="decimal"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const numValue = parsePriceFieldValue(e.target.value)
                    if (numValue === undefined) {
                      field.onChange(undefined)
                    } else if (numValue >= 0) {
                      field.onChange(numValue)
                    }
                  }}
                  placeholder="0.00"
                  className="mt-1"
                />
              )}
            />
            {errors.discountedPrice && (
              <p className="text-sm text-red-600 mt-1">
                {errors.discountedPrice.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              İndirimli fiyat direkt olarak bu değer kullanılacaktır.
            </p>
          </div>
        </div>
      </div>

      {productType === "VARIANT" && (
        <div className="p-4 bg-blue-50  border border-blue-200  rounded-lg">
          <p className="text-sm text-blue-800 ">
            <strong>Varyant Ürünler:</strong> Her varyant kombinasyonu için ayrı fiyat belirleyebilirsiniz.
            Bu fiyat, varyant kombinasyonları oluşturulurken override edilebilir.
          </p>
        </div>
      )}

      {productType === "BUNDLE" && (
        <div className="p-4 bg-blue-50  border border-blue-200  rounded-lg">
          <p className="text-sm text-blue-800 ">
            <strong>Bundle Ürünler:</strong> Bundle paketinin toplam fiyatını belirleyin.
            Bundle içindeki ürünlerin fiyatları ayrı ayrı yönetilir.
          </p>
        </div>
      )}
    </div>
  )
}
