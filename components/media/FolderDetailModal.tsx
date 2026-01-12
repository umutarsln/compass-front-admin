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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/dialog"
import { Folder, folderService } from "@/services/folder.service"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Save, Trash2, Folder as FolderIcon, Calendar, User, HardDrive } from "lucide-react"
import { format } from "date-fns"
import { tr } from "date-fns/locale"

interface FolderDetailModalProps {
  folder: Folder | null
  isOpen: boolean
  onClose: () => void
}

export function FolderDetailModal({ folder, isOpen, onClose }: FolderDetailModalProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [folderName, setFolderName] = useState("")
  const [folderDescription, setFolderDescription] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Klasör detayını getir
  const { data: folderDetail, isLoading } = useQuery({
    queryKey: ["folder", folder?.id],
    queryFn: () => folderService.getOne(folder!.id),
    enabled: !!folder && isOpen,
  })

  // Toplam dosya boyutunu getir
  const { data: totalSizeMB } = useQuery({
    queryKey: ["folder-total-size", folder?.id],
    queryFn: () => folderService.getTotalSize(folder!.id),
    enabled: !!folder && isOpen,
  })

  // Form değerlerini güncelle
  useEffect(() => {
    if (folderDetail) {
      setFolderName(folderDetail.name)
      setFolderDescription(folderDetail.description || "")
    }
  }, [folderDetail])

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; description?: string }) =>
      folderService.update(folder!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folder", folder?.id] })
      queryClient.invalidateQueries({ queryKey: ["folders"] })
      toast({
        variant: "success",
        title: "Güncellendi",
        description: "Klasör bilgileri başarıyla güncellendi.",
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

  // Delete mutation (recursive)
  const deleteMutation = useMutation({
    mutationFn: () => folderService.deleteRecursive(folder!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] })
      queryClient.invalidateQueries({ queryKey: ["uploads"] })
      toast({
        variant: "success",
        title: "Silindi",
        description: "Klasör ve içindeki tüm dosyalar başarıyla silindi.",
      })
      setIsDeleteDialogOpen(false)
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
    updateMutation.mutate({
      name: folderName.trim() || undefined,
      description: folderDescription.trim() || undefined,
    })
  }

  const handleDelete = () => {
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    deleteMutation.mutate()
  }

  if (!folder) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Klasör Detayları</DialogTitle>
            <DialogDescription>Klasör bilgilerini görüntüleyin ve düzenleyin.</DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : folderDetail ? (
            <div className="space-y-6">
              {/* Sol Taraf - Temel Bilgiler */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card">
                  <div className="bg-primary/10 flex items-center justify-center rounded-lg size-16 text-primary">
                    <FolderIcon className="w-8 h-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">{folderDetail.name}</h3>
                    <p className="text-sm text-muted-foreground">{folderDetail.path}</p>
                  </div>
                </div>

                {/* Temel Bilgiler */}
                <div className="space-y-3 p-4 rounded-lg border border-border bg-card">
                  <h3 className="text-sm font-semibold text-foreground">Bilgiler</h3>
                  <div className="space-y-2 text-sm">
                    {totalSizeMB !== undefined && (
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-muted-foreground">Toplam Dosya Boyutu</p>
                          <p className="font-medium text-foreground">
                            {totalSizeMB.toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-muted-foreground">Oluşturulma</p>
                        <p className="font-medium text-foreground">
                          {format(new Date(folderDetail.createdAt), "dd MMMM yyyy, HH:mm", {
                            locale: tr,
                          })}
                        </p>
                      </div>
                    </div>
                    {folderDetail.createdBy && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-muted-foreground">Oluşturan</p>
                          <p className="font-medium text-foreground">
                            {folderDetail.createdBy.firstname} {folderDetail.createdBy.lastname}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sağ Taraf - Düzenlenebilir Bilgiler */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="folder-name" className="text-sm font-medium text-foreground">
                    Klasör Adı *
                  </label>
                  <input
                    id="folder-name"
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="Klasör adı..."
                    className="w-full h-12 px-4 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="folder-description"
                    className="text-sm font-medium text-foreground"
                  >
                    Açıklama
                  </label>
                  <textarea
                    id="folder-description"
                    value={folderDescription}
                    onChange={(e) => setFolderDescription(e.target.value)}
                    placeholder="Klasör açıklaması..."
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    disabled={!folderName.trim() || updateMutation.isPending}
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
                    disabled={deleteMutation.isPending}
                    className="h-10 px-4 inline-flex items-center justify-center gap-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Klasörü Silmek İstediğinize Emin Misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Klasör ve içindeki tüm dosyalar ve alt klasörler kalıcı
              olarak silinecektir.
              {totalSizeMB !== undefined && (
                <span className="block mt-2 font-medium">
                  Toplam {totalSizeMB.toFixed(2)} MB dosya silinecek.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                "Sil"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
