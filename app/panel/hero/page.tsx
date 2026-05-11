"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { ImageIcon, Loader2, Pencil, Plus, RotateCcw, Save, Trash2 } from "lucide-react"
import { MediaLibrarySelect } from "@/components/media/MediaLibrarySelect"
import { PageBody } from "@/components/layout/PageBody"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { heroSlideService, HeroSlide } from "@/services/hero-slide.service"
import { Upload } from "@/services/upload.service"

interface HeroSlideFormState {
  uploadId?: string
  imageUrl: string
  title: string
  altText: string
  sortOrder: number
  isActive: boolean
}

const emptyForm: HeroSlideFormState = {
  uploadId: undefined,
  imageUrl: "",
  title: "",
  altText: "",
  sortOrder: 0,
  isActive: true,
}

/** Relative görsel yollarını admin önizlemesi için storefront URL ile tamamlar. */
function getPreviewImageUrl(imageUrl: string): string {
  if (!imageUrl.startsWith("/")) return imageUrl
  const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL || "http://localhost:3000"
  return `${storefrontUrl.replace(/\/+$/, "")}${imageUrl}`
}

/** Hero slaytını form alanlarına dönüştürür. */
function getFormFromSlide(slide: HeroSlide): HeroSlideFormState {
  return {
    uploadId: slide.uploadId ?? undefined,
    imageUrl: slide.imageUrl,
    title: slide.title ?? "",
    altText: slide.altText,
    sortOrder: slide.sortOrder,
    isActive: slide.isActive,
  }
}

/** Ana sayfa hero görsellerini admin panelinden yönetir. */
export default function HeroPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [form, setForm] = useState<HeroSlideFormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mediaOpen, setMediaOpen] = useState(false)
  const { toast } = useToast()

  const selectedUploads = useMemo<Upload[]>(() => {
    const selectedSlide = slides.find((slide) => slide.id === editingId)
    return selectedSlide?.upload ? [selectedSlide.upload] : []
  }, [editingId, slides])

  useEffect(() => {
    loadSlides()
  }, [])

  /** Backend'den hero slaytlarını yükler. */
  async function loadSlides(): Promise<void> {
    try {
      setLoading(true)
      const data = await heroSlideService.getAll()
      setSlides(data)
      setForm((current) => ({ ...current, sortOrder: data.length }))
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error?.response?.data?.message || "Hero görselleri yüklenirken bir hata oluştu.",
      })
    } finally {
      setLoading(false)
    }
  }

  /** Formu yeni slayt ekleme moduna döndürür. */
  function resetForm(): void {
    setEditingId(null)
    setForm({ ...emptyForm, sortOrder: slides.length })
  }

  /** Medya kütüphanesinden seçilen görseli forma yerleştirir. */
  function handleMediaSelect(uploads: Upload[]): void {
    const upload = uploads[0]
    if (!upload) return

    setForm((current) => ({
      ...current,
      uploadId: upload.id,
      imageUrl: upload.s3Url,
      altText: current.altText || upload.seoTitle || upload.displayName || upload.filename,
    }))
    setMediaOpen(false)
  }

  /** Seçilen slaytı düzenleme modunda forma taşır. */
  function handleEdit(slide: HeroSlide): void {
    setEditingId(slide.id)
    setForm(getFormFromSlide(slide))
  }

  /** Formdaki slaytı oluşturur veya günceller. */
  async function handleSave(): Promise<void> {
    if (!form.imageUrl.trim()) {
      toast({
        variant: "destructive",
        title: "Görsel gerekli",
        description: "Hero slaytı için medya kütüphanesinden bir görsel seçin.",
      })
      return
    }

    try {
      setSaving(true)
      const payload = {
        uploadId: form.uploadId,
        imageUrl: form.imageUrl,
        title: form.title || null,
        altText: form.altText || "Ana sayfa hero görseli",
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      }

      if (editingId) {
        await heroSlideService.update(editingId, payload)
      } else {
        await heroSlideService.create(payload)
      }

      toast({
        variant: "success",
        title: "Başarılı",
        description: "Hero slaytı kaydedildi.",
      })
      resetForm()
      await loadSlides()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error?.response?.data?.message || "Hero slaytı kaydedilirken bir hata oluştu.",
      })
    } finally {
      setSaving(false)
    }
  }

  /** Slaytı yayına alma/kapatma durumunu hızlıca değiştirir. */
  async function handleToggleActive(slide: HeroSlide): Promise<void> {
    try {
      await heroSlideService.update(slide.id, { isActive: !slide.isActive })
      await loadSlides()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error?.response?.data?.message || "Slayt durumu güncellenemedi.",
      })
    }
  }

  /** Slaytı hero listesinden siler. */
  async function handleDelete(slide: HeroSlide): Promise<void> {
    if (!window.confirm("Bu hero slaytı silinsin mi? Medya dosyası silinmez.")) return

    try {
      await heroSlideService.delete(slide.id)
      toast({
        variant: "success",
        title: "Silindi",
        description: "Hero slaytı listeden kaldırıldı.",
      })
      if (editingId === slide.id) resetForm()
      await loadSlides()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error?.response?.data?.message || "Hero slaytı silinemedi.",
      })
    }
  }

  if (loading) {
    return (
      <PageBody>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageBody>
    )
  }

  return (
    <PageBody>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Hero Görselleri</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ana sayfa hero carousel görsellerini medya kütüphanesinden seçip sıralayın.
            </p>
          </div>
          <Button variant="outline" onClick={resetForm}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Slayt
          </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <section className="rounded-lg border border-border bg-card p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {editingId ? "Slaytı Düzenle" : "Yeni Slayt Ekle"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Görsel seç, açıklamayı ve sırasını belirle.
                </p>
              </div>
              {editingId && (
                <Button variant="ghost" size="sm" onClick={resetForm}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Temizle
                </Button>
              )}
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Hero Görseli</Label>
                <div className="overflow-hidden rounded-lg border border-border bg-muted">
                  {form.imageUrl ? (
                    <Image
                      src={getPreviewImageUrl(form.imageUrl)}
                      alt={form.altText || "Hero görseli önizlemesi"}
                      width={640}
                      height={360}
                      className="h-48 w-full object-contain bg-white"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon className="mb-2 h-10 w-10" />
                      <span className="text-sm">Henüz görsel seçilmedi</span>
                    </div>
                  )}
                </div>
                <Button type="button" variant="outline" className="w-full" onClick={() => setMediaOpen(true)}>
                  Medya Kütüphanesinden Seç
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Başlık (admin içi)</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  placeholder="Örn. Epson hero görseli"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="altText">Alt Açıklama</Label>
                <Textarea
                  id="altText"
                  value={form.altText}
                  onChange={(event) => setForm({ ...form, altText: event.target.value })}
                  placeholder="Görselin ne anlattığını kısa yazın"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Sıra</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })}
                  />
                </div>
                <div className="flex items-end gap-3 pb-3">
                  <Checkbox
                    id="isActive"
                    checked={form.isActive}
                    onCheckedChange={(checked) => setForm({ ...form, isActive: checked === true })}
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Yayında
                  </Label>
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Kaydet
                  </>
                )}
              </Button>
            </div>
          </section>

          <section className="rounded-lg border border-border bg-card">
            <div className="border-b border-border p-6">
              <h2 className="text-lg font-semibold text-foreground">Mevcut Slaytlar</h2>
              <p className="text-sm text-muted-foreground">
                Düşük sıra numarası önce gösterilir; pasif slaytlar mağazada görünmez.
              </p>
            </div>

            <div className="divide-y divide-border">
              {slides.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Henüz hero slaytı yok. İlk görseli medya kütüphanesinden seçerek ekleyin.
                </div>
              ) : (
                slides.map((slide) => (
                  <div key={slide.id} className="grid gap-4 p-4 md:grid-cols-[180px_1fr_auto]">
                    <Image
                      src={getPreviewImageUrl(slide.imageUrl)}
                      alt={slide.altText}
                      width={360}
                      height={200}
                      className="h-28 w-full rounded-md border border-border bg-white object-contain"
                      unoptimized
                    />

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">
                          {slide.title || `Hero Slayt #${slide.sortOrder}`}
                        </p>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          Sıra: {slide.sortOrder}
                        </span>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {slide.isActive ? "Yayında" : "Pasif"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{slide.altText}</p>
                      <p className="truncate text-xs text-muted-foreground">{slide.imageUrl}</p>
                    </div>

                    <div className="flex items-start justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleToggleActive(slide)}>
                        {slide.isActive ? "Pasifleştir" : "Yayınla"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(slide)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Düzenle
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(slide)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Sil
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      <MediaLibrarySelect
        open={mediaOpen}
        onOpenChange={setMediaOpen}
        onSelect={handleMediaSelect}
        mode="single"
        title="Hero Görseli Seç"
        description="Ana sayfa hero alanında kullanılacak görseli seçin."
        selectedUploads={selectedUploads}
      />
    </PageBody>
  )
}
