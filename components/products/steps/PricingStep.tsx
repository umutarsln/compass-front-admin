"use client"

import { Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProductType } from "@/services/product.service"

interface PricingStepProps {
  control: any
  register: any
  errors: any
  isOnSale: boolean
  productType?: ProductType
}

export function PricingStep({
  control,
  register,
  errors,
  isOnSale,
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
                type="number"
                step="0.01"
                min="0"
                {...field}
                value={field.value ?? ""}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : parseFloat(e.target.value) || 0
                  field.onChange(value)
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
          <div className="flex items-center space-x-2 pt-6">
            <input
              type="checkbox"
              id="isOnSale"
              {...register("isOnSale")}
              className="w-4 h-4 rounded border-border"
            />
            <Label htmlFor="isOnSale" className="cursor-pointer">
              İndirimde
            </Label>
          </div>

          {isOnSale && (
            <div>
              <Label htmlFor="discountedPrice">İndirimli Fiyat (₺)</Label>
              <Controller
                name="discountedPrice"
                control={control}
                render={({ field }) => (
                  <Input
                    id="discountedPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      if (e.target.value === "") {
                        field.onChange(undefined)
                      } else {
                        const numValue = parseFloat(e.target.value)
                        // Geçerli bir sayı ise (NaN değilse ve >= 0)
                        if (!isNaN(numValue) && numValue >= 0) {
                          field.onChange(numValue)
                        } else {
                          // Geçersiz değer ise undefined set et
                          field.onChange(undefined)
                        }
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
          )}
        </div>
      </div>

      {productType === "VARIANT" && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Varyant Ürünler:</strong> Her varyant kombinasyonu için ayrı fiyat belirleyebilirsiniz. 
            Bu fiyat, varyant kombinasyonları oluşturulurken override edilebilir.
          </p>
        </div>
      )}

      {productType === "BUNDLE" && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Bundle Ürünler:</strong> Bundle paketinin toplam fiyatını belirleyin. 
            Bundle içindeki ürünlerin fiyatları ayrı ayrı yönetilir.
          </p>
        </div>
      )}
    </div>
  )
}
