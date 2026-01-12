"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface SEOStepProps {
  register: any
}

export function SEOStep({ register }: SEOStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          SEO Ayarları
        </h3>
        <p className="text-sm text-muted-foreground">
          Arama motorları için SEO bilgilerini girin. Bu alanlar opsiyoneldir.
        </p>
      </div>

      <div>
        <Label htmlFor="seoTitle">SEO Başlık</Label>
        <Input
          id="seoTitle"
          {...register("seoTitle")}
          placeholder="SEO için başlık"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="seoDescription">SEO Açıklama</Label>
        <Textarea
          id="seoDescription"
          {...register("seoDescription")}
          placeholder="SEO için açıklama"
          className="mt-1"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="seoKeywords">SEO Anahtar Kelimeler</Label>
        <Input
          id="seoKeywords"
          {...register("seoKeywords")}
          placeholder="Anahtar kelimeler (virgülle ayırın)"
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Örn: ürün, e-ticaret, satış
        </p>
      </div>
    </div>
  )
}
