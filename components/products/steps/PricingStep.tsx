"use client"

import { Controller, useWatch, type Control, type FieldErrors, type FieldValues } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProductType, type PriceInputCurrency } from "@/services/product.service"

/** PricingStep ile uyumlu form şekli (`ProductForm` alanları). */
export type PricingStepFormValues = {
  basePrice: number
  discountedPrice?: number | null
  priceCurrency: PriceInputCurrency
  discountedPriceCurrency?: PriceInputCurrency
}

interface PricingStepProps<T extends FieldValues = FieldValues> {
  control: Control<T>
  errors: FieldErrors<T>
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

/**
 * Alan doğrulama hatasından güvenli mesaj metni döndürür.
 */
function fieldErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return ""
  }
  const msg = (error as { message?: unknown }).message
  return typeof msg === "string" ? msg : ""
}

/**
 * Ürün fiyatlandırma adımı: TRY veya USD girişi; backend USD saklar.
 */
export function PricingStep<T extends FieldValues>({
  control,
  errors,
  productType = "SIMPLE",
}: PricingStepProps<T>) {
  /** useWatch/Controller için daraltılmış kontrol (react-hook-form overload uyumu). */
  const fvControl = control as unknown as Control<FieldValues>

  const priceCurrency = useWatch({
    control: fvControl,
    name: "priceCurrency",
    defaultValue: "TRY",
  })
  const discountedPriceCurrency = useWatch({
    control: fvControl,
    name: "discountedPriceCurrency",
  })

  /** Alan hataları için genişletilmiş tip (pricing alanları). */
  const fvErrors = errors as FieldErrors<FieldValues>

  const baseSymbol = priceCurrency === "USD" ? "$" : "₺"
  const discountSymbol =
    (discountedPriceCurrency ?? priceCurrency) === "USD" ? "$" : "₺"

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Fiyatlandırma
        </h3>
        <p className="text-sm text-muted-foreground">
          Girdiğiniz tutar seçtiğiniz para birimindedir. Sistem veritabanında USD saklar;
          mağazada güncel kur ile TL gösterilir.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Temel fiyat para birimi</Label>
          <Controller
            name="priceCurrency"
            control={fvControl}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Para birimi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">TRY (₺)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>İndirimli fiyat para birimi</Label>
          <Controller
            name="discountedPriceCurrency"
            control={fvControl}
            render={({ field }) => (
              <Select
                value={field.value ?? "__same__"}
                onValueChange={(v) =>
                  field.onChange(v === "__same__" ? undefined : v)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Temel ile aynı" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__same__">
                    Temel ile aynı ({priceCurrency === "USD" ? "USD" : "TRY"})
                  </SelectItem>
                  <SelectItem value="TRY">TRY (₺)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div>
          <Label htmlFor="basePrice">Temel Fiyat ({baseSymbol}) *</Label>
          <Controller
            name="basePrice"
            control={fvControl}
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
              {fieldErrorMessage(fvErrors.basePrice)}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {productType === "VARIANT" &&
              "Varyant kombinasyonları için varsayılan taban fiyat (USD olarak saklanır)."}
            {productType === "BUNDLE" &&
              "Bundle paketinin temel fiyatı (USD olarak saklanır)."}
            {productType === "SIMPLE" && "Ürünün satış fiyatı (USD olarak saklanır)."}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="discountedPrice">
              İndirimli Fiyat ({discountSymbol})
            </Label>
            <Controller
              name="discountedPrice"
              control={fvControl}
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
                {fieldErrorMessage(fvErrors.discountedPrice)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Doluysa bu tutar indirimli satış fiyatı olarak kullanılır (USD saklanır).
            </p>
          </div>
        </div>
      </div>

      {productType === "VARIANT" && (
        <div className="p-4 bg-blue-50  border border-blue-200  rounded-lg">
          <p className="text-sm text-blue-800 ">
            <strong>Varyant Ürünler:</strong> Varyant değeri fiyat farkları için de TRY/USD girişi
            kullanılır; sistem USD saklar.
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
