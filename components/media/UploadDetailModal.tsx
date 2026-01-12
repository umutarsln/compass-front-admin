"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Upload, uploadService } from "@/services/upload.service"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Save, Trash2, X, Image as ImageIcon, FileText, Calendar, User, Folder } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

interface UploadDetailModalProps {
  upload: Upload | null
  isOpen: boolean
  onClose: () => void
}

export function UploadDetailModal({ upload, isOpen, onClose }: UploadDetailModalProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [displayName, setDisplayName] = useState("")
  const [seoTitle, setSeoTitle] = useState("")
  const [seoDescription, setSeoDescription] = useState("")
  const [seoKeywords, setSeoKeywords] = useState("")

  // Upload detayını getir
  const { data: uploadDetail, isLoading } = useQuery({
    queryKey: ["upload", upload?.id],
    queryFn: () => uploadService.getOne(upload!.id),
    enabled: !!upload && isOpen,
  })

  // Relation kontrolü
  const { data: relations } = useQuery({
    queryKey: ["upload-relations", upload?.id],
    queryFn: () => uploadService.checkRelations(upload!.id),
    enabled: !!upload && isOpen,
  })

  // Form değerlerini güncelle
  useEffect(() => {
    if (uploadDetail) {
      setDisplayName(uploadDetail.displayName || "")
      setSeoTitle(uploadDetail.seoTitle || "")
      setSeoDescription(uploadDetail.seoDescription || "")
      setSeoKeywords(uploadDetail.seoKeywords?.join(", ") || "")
    }
  }, [uploadDetail])

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: {
      displayName?: string
      seoTitle?: string
      seoDescription?: string
      seoKeywords?: string[]
    }) => uploadService.update(upload!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["upload", upload?.id] })
      queryClient.invalidateQueries({ queryKey: ["uploads"] })
      toast({
        variant: "success",
        title: "Güncellendi",
        description: "Dosya bilgileri başarıyla güncellendi.",
      })
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.response?.data?.message || "Güncelleme sırasında bir hata oluştu.",
      })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => uploadService.delete(upload!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["uploads"] })
      toast({
        variant: "success",
        title: "Silindi",
        description: "Dosya başarıyla silindi.",
      })
      onClose()
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.response?.data?.message || "Silme sırasında bir hata oluştu.",
      })
    },
  })

  const handleSave = () => {
    const keywordsArray = seoKeywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0)

    updateMutation.mutate({
      displayName: displayName.trim() || undefined,
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
      seoKeywords: keywordsArray.length > 0 ? keywordsArray : undefined,
    })
  }

  const handleDelete = () => {
    if (window.confirm("Bu dosyayı silmek istediğinize emin misiniz?")) {
      deleteMutation.mutate()
    }
  }

  const isImage = uploadDetail?.mimeType.startsWith("image/")
  const canDelete = !relations?.hasRelations

  if (!upload) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dosya Detayları</DialogTitle>
          <DialogDescription>Dosya bilgilerini görüntüleyin ve düzenleyin.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : uploadDetail ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sol Taraf - Preview ve Temel Bilgiler */}
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden">
                {isImage ? (
                  <img
                    src={uploadDetail.s3Url}
                    alt={uploadDetail.displayName || uploadDetail.filename}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText className="w-24 h-24 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Temel Bilgiler */}
              <div className="space-y-3 p-4 rounded-lg border border-border bg-card">
                <h3 className="text-lg font-semibold text-foreground">Temel Bilgiler</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-muted-foreground">Dosya Adı</p>
                      <p className="font-medium text-foreground">{uploadDetail.filename}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <ImageIcon className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-muted-foreground">Dosya Tipi</p>
                      <p className="font-medium text-foreground">{uploadDetail.mimeType}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-muted-foreground">Boyut</p>
                      <p className="font-medium text-foreground">
                        {Number(uploadDetail.sizeMB).toFixed(2)} MB ({uploadDetail.size.toLocaleString()} bytes)
                      </p>
                    </div>
                  </div>
                  {uploadDetail.folder && (
                    <div className="flex items-start gap-2">
                      <Folder className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-muted-foreground">Klasör</p>
                        <p className="font-medium text-foreground">{uploadDetail.folder.name}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <p className="text-muted-foreground">Oluşturulma</p>
                      <p className="font-medium text-foreground">
                        {format(new Date(uploadDetail.createdAt), "dd MMMM yyyy, HH:mm", { locale: tr })}
                      </p>
                    </div>
                  </div>
                  {uploadDetail.createdBy && (
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-muted-foreground">Yükleyen</p>
                        <p className="font-medium text-foreground">
                          {uploadDetail.createdBy.firstname} {uploadDetail.createdBy.lastname}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Relation Bilgileri */}
              {relations && (
                <div className="space-y-3 p-4 rounded-lg border border-border bg-card">
                  <h3 className="text-lg font-semibold text-foreground">Kullanım Bilgileri</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Ürün Galerileri</p>
                      <p className="font-medium text-foreground">
                        {relations.relations.productGalleries} kullanım
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Kategoriler</p>
                      <p className="font-medium text-foreground">
                        {relations.relations.categories} kullanım
                      </p>
                    </div>
                    {relations.hasRelations && (
                      <div className="mt-3 p-2 rounded bg-warning-light text-warning-foreground text-xs">
                        ⚠️ Bu dosya kullanılıyor ve silinemez.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sağ Taraf - Düzenlenebilir Bilgiler */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="display-name" className="text-sm font-medium text-foreground">
                  Görünen İsim
                </label>
                <input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Görünen isim..."
                  className="w-full h-12 px-4 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="seo-title" className="text-sm font-medium text-foreground">
                  SEO Başlık
                </label>
                <input
                  id="seo-title"
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="SEO başlık..."
                  className="w-full h-12 px-4 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="seo-description" className="text-sm font-medium text-foreground">
                  SEO Açıklama
                </label>
                <textarea
                  id="seo-description"
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="SEO açıklama..."
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="seo-keywords" className="text-sm font-medium text-foreground">
                  SEO Anahtar Kelimeler (virgülle ayrılmış)
                </label>
                <input
                  id="seo-keywords"
                  type="text"
                  value={seoKeywords}
                  onChange={(e) => setSeoKeywords(e.target.value)}
                  placeholder="anahtar, kelime, listesi"
                  className="w-full h-12 px-4 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="flex-1 h-10 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Kaydet
                    </>
                  )}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={!canDelete || deleteMutation.isPending}
                  className="h-10 px-4 inline-flex items-center justify-center gap-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title={!canDelete ? "Bu dosya kullanılıyor ve silinemez" : "Dosyayı Sil"}
                >
                  {deleteMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
