"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { folderService, Folder } from "@/services/folder.service"
import { uploadService, Upload } from "@/services/upload.service"
import { FolderGrid } from "./FolderGrid"
import { UploadGrid } from "./UploadGrid"
import { MediaBreadcrumb } from "./MediaBreadcrumb"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, X, CheckCircle2, Circle } from "lucide-react"

interface MediaLibrarySelectProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (uploads: Upload[]) => void
  mode?: "single" | "multiple" // Single: tek seçim, Multiple: sıralı çoklu seçim
  title?: string
  description?: string
  selectedUploads?: Upload[] // Önceden seçilmiş upload'lar
}

export function MediaLibrarySelect({
  open,
  onOpenChange,
  onSelect,
  mode = "multiple",
  title = "Medya Seç",
  description = "Klasörler arasında gezerek resim seçin.",
  selectedUploads = [],
}: MediaLibrarySelectProps) {
  // Mevcut klasör ID (null = root)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  
  // Seçilen upload'lar (sıralı)
  const [selectedUploadIds, setSelectedUploadIds] = useState<Set<string>>(
    new Set(selectedUploads.map((u) => u.id))
  )
  
  // Seçim sırası (multiple mod için)
  const [selectionOrder, setSelectionOrder] = useState<string[]>(
    selectedUploads.map((u) => u.id)
  )

  // Dialog açıldığında seçimleri ve klasörü sıfırla
  useEffect(() => {
    if (open) {
      // Klasörü root'a sıfırla
      setCurrentFolderId(null)
      
      // Seçimleri güncelle
      const newSelectedIds = new Set(selectedUploads.map((u) => u.id))
      const newOrder = selectedUploads.map((u) => u.id)
      
      // Sadece gerçekten değişiklik varsa state'i güncelle
      setSelectedUploadIds((prevIds) => {
        const prevIdsString = Array.from(prevIds).sort().join(',')
        const newIdsString = Array.from(newSelectedIds).sort().join(',')
        if (prevIdsString !== newIdsString) {
          return newSelectedIds
        }
        return prevIds
      })
      
      setSelectionOrder((prevOrder) => {
        const prevOrderString = prevOrder.join(',')
        const newOrderString = newOrder.join(',')
        if (prevOrderString !== newOrderString) {
          return newOrder
        }
        return prevOrder
      })
    }
  }, [open, selectedUploads])

  // Klasör path'i (breadcrumb için)
  const [folderPath, setFolderPath] = useState<Folder[]>([])

  // Mevcut klasördeki alt klasörleri getir
  const {
    data: folders,
    isLoading: foldersLoading,
  } = useQuery({
    queryKey: ["folders", currentFolderId],
    queryFn: async () => {
      const allFolders = await folderService.getAll()
      return allFolders.filter((folder) => folder.parentId === currentFolderId)
    },
    enabled: open,
  })

  // Mevcut klasördeki uploadları getir (sadece resimler)
  const {
    data: uploads,
    isLoading: uploadsLoading,
  } = useQuery({
    queryKey: ["uploads", currentFolderId],
    queryFn: async () => {
      let allUploads: Upload[]
      if (currentFolderId) {
        allUploads = await uploadService.getByFolder(currentFolderId)
      } else {
        allUploads = await uploadService.getRoot()
      }
      // Sadece resimleri filtrele
      return allUploads.filter((upload) => upload.mimeType.startsWith("image/"))
    },
    enabled: open,
  })

  // Klasör path'ini oluştur
  useEffect(() => {
    if (!open) return

    const buildPath = async () => {
      if (!currentFolderId) {
        setFolderPath([])
        return
      }

      const path: Folder[] = []
      let currentId: string | null = currentFolderId

      while (currentId) {
        try {
          const folder = await folderService.getOne(currentId)
          path.unshift(folder)
          currentId = folder.parentId
        } catch (error) {
          console.error("Klasör bulunamadı:", error)
          break
        }
      }

      setFolderPath(path)
    }

    buildPath()
  }, [currentFolderId, open])

  // Klasöre çift tıklama ile gir
  const handleFolderDoubleClick = (folderId: string | null) => {
    setCurrentFolderId(folderId)
  }

  // Breadcrumb'dan klasöre git
  const handleBreadcrumbClick = (folderId: string | null) => {
    setCurrentFolderId(folderId)
  }

  // Upload seçimi
  const handleToggleUploadSelection = (uploadId: string) => {
    if (mode === "single") {
      // Single mod: sadece bir tane seçilebilir ve otomatik olarak seç
      const selectedUpload = uploads?.find((u) => u.id === uploadId)
      if (selectedUpload) {
        onSelect([selectedUpload])
        onOpenChange(false)
      }
    } else {
      // Multiple mod: sıralı seçim
      const newSelected = new Set(selectedUploadIds)
      const newOrder = [...selectionOrder]

      if (newSelected.has(uploadId)) {
        // Seçimi kaldır
        newSelected.delete(uploadId)
        setSelectionOrder(newOrder.filter((id) => id !== uploadId))
      } else {
        // Seçimi ekle (sıraya ekle)
        newSelected.add(uploadId)
        newOrder.push(uploadId)
      }

      setSelectedUploadIds(newSelected)
      setSelectionOrder(newOrder)
    }
  }

  // Seçimi temizle
  const handleClearSelection = () => {
    setSelectedUploadIds(new Set())
    setSelectionOrder([])
  }

  // Tüm upload'ları seç/kaldır
  const handleSelectAllUploads = () => {
    if (!uploads || uploads.length === 0) return
    
    if (mode === "single") {
      // Single mod: sadece ilkini seç
      if (uploads.length > 0) {
        setSelectedUploadIds(new Set([uploads[0].id]))
        setSelectionOrder([uploads[0].id])
      }
    } else {
      // Multiple mod: hepsini seç
      const allUploadIds = new Set(uploads.map((u) => u.id))
      const newOrder = [...selectionOrder]
      
      uploads.forEach((upload) => {
        if (!selectedUploadIds.has(upload.id)) {
          newOrder.push(upload.id)
        }
      })
      
      setSelectedUploadIds(allUploadIds)
      setSelectionOrder(newOrder)
    }
  }

  const handleDeselectAllUploads = () => {
    if (!uploads || uploads.length === 0) return
    
    const newSelected = new Set(selectedUploadIds)
    const newOrder = [...selectionOrder]
    
    uploads.forEach((upload) => {
      newSelected.delete(upload.id)
    })
    
    setSelectedUploadIds(newSelected)
    setSelectionOrder(newOrder.filter((id) => !uploads.some((u) => u.id === id)))
  }

  // Tüm upload'lar seçili mi?
  const areAllUploadsSelected =
    uploads && uploads.length > 0 && uploads.every((u) => selectedUploadIds.has(u.id))

  // Seçilen upload'ları sıraya göre getir
  const getSelectedUploadsInOrder = (): Upload[] => {
    if (!uploads) return []
    
    // Sıraya göre filtrele
    const orderedUploads = selectionOrder
      .map((id) => uploads.find((u) => u.id === id))
      .filter((u): u is Upload => u !== undefined)
    
    // Eğer sırada olmayan ama seçili olanlar varsa, onları da ekle
    const unorderedSelected = uploads.filter(
      (u) => selectedUploadIds.has(u.id) && !selectionOrder.includes(u.id)
    )
    
    return [...orderedUploads, ...unorderedSelected]
  }

  // Seçimi onayla
  const handleConfirm = () => {
    const selected = getSelectedUploadsInOrder()
    onSelect(selected)
    onOpenChange(false)
  }

  // İptal
  const handleCancel = () => {
    onOpenChange(false)
  }

  const isLoading = foldersLoading || uploadsLoading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 px-6">
          {/* Breadcrumb */}
          <MediaBreadcrumb
            path={folderPath}
            currentFolderId={currentFolderId}
            onNavigate={handleBreadcrumbClick}
          />

          {/* Seçim Bilgisi */}
          {selectedUploadIds.size > 0 && (
            <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {selectedUploadIds.size} resim seçildi
                </span>
                {mode === "multiple" && (
                  <span className="text-xs text-muted-foreground">
                    (Sıralı: {selectionOrder.length})
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearSelection}
              >
                <X className="w-4 h-4 mr-1" />
                Temizle
              </Button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Klasörler Grid */}
          {!isLoading && folders && folders.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-foreground">Klasörler</h2>
              <FolderGrid
                folders={folders}
                onDoubleClick={handleFolderDoubleClick}
                onFolderChange={handleFolderDoubleClick}
                isSelectionMode={false}
              />
            </div>
          )}

          {/* Uploadlar Grid */}
          {!isLoading && uploads && uploads.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Resimler</h2>
                <div className="flex items-center gap-2">
                  {areAllUploadsSelected ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDeselectAllUploads}
                    >
                      <Circle className="w-4 h-4 mr-1" />
                      Hepsini Kaldır ({uploads.length})
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllUploads}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Hepsini Seç ({uploads.length})
                    </Button>
                  )}
                </div>
              </div>
              <UploadGrid
                uploads={uploads}
                isSelectionMode={true}
                selectedIds={selectedUploadIds}
                onToggleSelection={handleToggleUploadSelection}
              />
            </div>
          )}

          {/* Boş Durum */}
          {!isLoading &&
            (!folders || folders.length === 0) &&
            (!uploads || uploads.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">
                  {currentFolderId
                    ? "Bu klasörde henüz resim bulunmuyor."
                    : "Henüz resim bulunmuyor."}
                </p>
              </div>
            )}
        </div>

        {/* Footer Butonları */}
        <div className="flex items-center justify-end gap-2 pt-4 pb-6 px-6 border-t">
          <Button type="button" variant="outline" onClick={handleCancel}>
            İptal
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={selectedUploadIds.size === 0}
          >
            Seç ({selectedUploadIds.size})
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
