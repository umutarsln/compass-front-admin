"use client"

import { Controller } from "react-hook-form"
import { ProductType } from "@/services/product.service"
import { Package, Layers } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductTypeStepProps {
  control: any
  errors: any
  productType?: ProductType
  isEditMode?: boolean
}

export function ProductTypeStep({
  control,
  errors,
  productType,
  isEditMode = false,
}: ProductTypeStepProps) {
  const types = [
    {
      value: "SIMPLE" as ProductType,
      label: "Basit Ürün",
      description: "Tek bir varyasyonu olan standart ürün",
      icon: Package,
    },
    {
      value: "VARIANT" as ProductType,
      label: "Varyant Ürün",
      description: "Farklı varyasyonları olan ürün (renk, beden vb.)",
      icon: Layers,
    },
    // BUNDLE seçeneği şimdilik kaldırıldı - sonradan eklenecek
    // {
    //   value: "BUNDLE" as ProductType,
    //   label: "Paket Ürün",
    //   description: "Birden fazla ürünün birleşiminden oluşan paket",
    //   icon: Box,
    // },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Ürün Tipi Seçimi
        </h3>
        {isEditMode ? (
          <p className="text-sm text-muted-foreground">
            Ürün tipi düzenleme modunda değiştirilemez.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Oluşturmak istediğiniz ürünün tipini seçin. Bu seçim daha sonra
            değiştirilemez.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {types.map((type) => {
          const Icon = type.icon
          return (
            <Controller
              key={type.value}
              name="type"
              control={control}
              render={({ field }) => (
                <button
                  type="button"
                  onClick={() => !isEditMode && field.onChange(type.value)}
                  disabled={isEditMode}
                  className={cn(
                    "relative flex flex-col items-start p-6 rounded-lg border-2 transition-all text-left",
                    field.value === type.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
                    isEditMode && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={cn(
                        "p-2 rounded-md",
                        field.value === type.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {type.label}
                      </h4>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {type.description}
                  </p>
                  {field.value === type.value && (
                    <div className="absolute top-2 right-2">
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      </div>
                    </div>
                  )}
                </button>
              )}
            />
          )
        })}
      </div>

      {errors.type && (
        <p className="text-sm text-red-600">{errors.type.message}</p>
      )}
    </div>
  )
}
