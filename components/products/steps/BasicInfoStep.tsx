"use client"

import { Controller } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Textarea } from "@/components/ui/textarea"
import TurndownService from "turndown"

interface BasicInfoStepProps {
  control: any
  register: any
  errors: any
  htmlDescription: string
  setHtmlDescription: (html: string) => void
}

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
})

export function BasicInfoStep({
  control,
  register,
  errors,
  htmlDescription,
  setHtmlDescription,
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
        <Label htmlFor="description">Ürün Açıklaması *</Label>
        <div className="mt-1">
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <RichTextEditor
                content={htmlDescription}
                onChange={(html) => {
                  setHtmlDescription(html)
                  const markdown = html
                    ? turndownService.turndown(html)
                    : ""
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
