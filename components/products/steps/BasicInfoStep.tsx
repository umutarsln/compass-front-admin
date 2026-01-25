"use client"

import { Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

interface BasicInfoStepProps {
  control: any
  register: any
  errors: any
  markdownDescription: string
  setMarkdownDescription: (markdown: string) => void
}

export function BasicInfoStep({
  control,
  register,
  errors,
  markdownDescription,
  setMarkdownDescription,
}: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Temel Bilgiler
        </h3>
        <p className="text-sm text-muted-foreground">
          Ürünün temel bilgilerini girin.
        </p>
      </div>

      <div>
        <Label htmlFor="name">Ürün Adı *</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="Örn: Örnek Ürün"
          className="mt-1"
        />
        {errors.name && (
          <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="subtitle">Alt Başlık</Label>
        <Input
          id="subtitle"
          {...register("subtitle")}
          placeholder="Örn: Kısa ve öz ürün açıklaması (liste görünümünde gösterilir)"
          className="mt-1"
        />
        {errors.subtitle && (
          <p className="text-sm text-red-600 mt-1">{errors.subtitle.message}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Ürün listesinde ürün adının altında gösterilecek kısa açıklama (opsiyonel)
        </p>
      </div>

      <div>
        <Label htmlFor="description">Ürün Açıklaması *</Label>
        <div className="mt-1">
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                content={markdownDescription || field.value || ""}
                onChange={(markdown) => {
                  setMarkdownDescription(markdown)
                  field.onChange(markdown)
                }}
                placeholder="Ürün açıklamasını buraya yazın..."
              />
            )}
          />
        </div>
        {errors.description && (
          <p className="text-sm text-red-600 mt-1">
            {errors.description.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Zengin metin editörü ile formatlanmış içerik oluşturabilirsiniz.
        </p>
      </div>


      <div className="flex items-center gap-6">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isActive"
            {...register("isActive")}
            className="w-4 h-4 rounded border-border"
          />
          <Label htmlFor="isActive" className="cursor-pointer">
            Aktif
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isFeatured"
            {...register("isFeatured")}
            className="w-4 h-4 rounded border-border"
          />
          <Label htmlFor="isFeatured" className="cursor-pointer">
            Öne Çıkan
          </Label>
        </div>
      </div>
    </div>
  )
}
