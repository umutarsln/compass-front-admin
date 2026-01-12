"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { folderService, Folder } from "@/services/folder.service"
import { uploadService, Upload } from "@/services/upload.service"
import { useToast } from "@/components/ui/use-toast"
import { FolderGrid } from "./FolderGrid"
import { UploadGrid } from "./UploadGrid"
import { MediaBreadcrumb } from "./MediaBreadcrumb"
import { UploadModal } from "./UploadModal"
import { UploadDetailModal } from "./UploadDetailModal"
import { FolderDetailModal } from "./FolderDetailModal"
import { MoveFolderModal } from "./MoveFolderModal"
import { Plus, Loader2, CheckSquare, Square, Move, Trash2, X, CheckCircle2, Circle } from "lucide-react"

export function MediaLibrary() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  // Mevcut klasör ID (null = root)
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [selectedUpload, setSelectedUpload] = useState<Upload | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null)
  const [isFolderDetailModalOpen, setIsFolderDetailModalOpen] = useState(false)
  const [folderToMove, setFolderToMove] = useState<Folder | null>(null)
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false)

  // Seçim modu ve seçilen öğeler
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedFolderIds, setSelectedFolderIds] = useState<Set<string>>(new Set())
  const [selectedUploadIds, setSelectedUploadIds] = useState<Set<string>>(new Set())
  const [isBulkMoveModalOpen, setIsBulkMoveModalOpen] = useState(false)

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
  })

  // Mevcut klasördeki uploadları getir
  const {
    data: uploads,
    isLoading: uploadsLoading,
  } = useQuery({
    queryKey: ["uploads", currentFolderId],
    queryFn: async () => {
      if (currentFolderId) {
        return await uploadService.getByFolder(currentFolderId)
      } else {
        return await uploadService.getRoot()
      }
    },
  })

  // Klasör path'ini oluştur
  useEffect(() => {
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
  }, [currentFolderId])

  // Klasöre çift tıklama ile gir
  const handleFolderDoubleClick = (folderId: string) => {
    if (!isSelectionMode) {
      setCurrentFolderId(folderId)
    }
  }

  // Breadcrumb'dan klasöre git
  const handleBreadcrumbClick = (folderId: string | null) => {
    setCurrentFolderId(folderId)
  }

  // Klasör oluşturma mutation
  const createFolderMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      folderService.create({
        ...data,
        parentId: currentFolderId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] })
      toast({
        variant: "success",
        title: "Klasör Oluşturuldu",
        description: "Yeni klasör başarıyla oluşturuldu.",
      })
      setIsUploadModalOpen(false)
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.response?.data?.message || "Klasör oluşturulurken bir hata oluştu.",
      })
    },
  })

  // Dosya yükleme mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (data: { files: File[]; displayNames?: string[] }) => {
      // Tüm dosyaları sırayla yükle
      const results = []
      for (let i = 0; i < data.files.length; i++) {
        const file = data.files[i]
        const displayName = data.displayNames?.[i]
        const result = await uploadService.upload(file, {
          displayName: displayName,
          folderId: currentFolderId || undefined,
        })
        results.push(result)
      }
      return results
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["uploads"] })
      toast({
        variant: "success",
        title: "Dosyalar Yüklendi",
        description: `${results.length} dosya başarıyla yüklendi.`,
      })
      setIsUploadModalOpen(false)
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.response?.data?.message || "Dosya yüklenirken bir hata oluştu.",
      })
    },
  })

  // Klasör taşıma mutation
  const moveFolderMutation = useMutation({
    mutationFn: (data: { folderId: string; targetParentId: string | null }) =>
      folderService.update(data.folderId, {
        parentId: data.targetParentId === null ? null : data.targetParentId,
      }),
    onSuccess: (updatedFolder) => {
      // Tüm cache'leri invalidate et (tüm klasörler ve upload'lar)
      queryClient.invalidateQueries({ queryKey: ["folders"] })
      queryClient.invalidateQueries({ queryKey: ["uploads"] })
      queryClient.invalidateQueries({ queryKey: ["allFolders"] })
      
      // Eski ve yeni parent klasörlerinin cache'lerini de invalidate et
      if (folderToMove) {
        const oldParentId = folderToMove.parentId
        const newParentId = updatedFolder.parentId
        
        // Eski parent klasörünün cache'ini invalidate et
        if (oldParentId) {
          queryClient.invalidateQueries({ queryKey: ["folders", oldParentId] })
          queryClient.invalidateQueries({ queryKey: ["uploads", oldParentId] })
        } else {
          queryClient.invalidateQueries({ queryKey: ["folders", null] })
          queryClient.invalidateQueries({ queryKey: ["uploads", null] })
        }
        
        // Yeni parent klasörünün cache'ini invalidate et
        if (newParentId) {
          queryClient.invalidateQueries({ queryKey: ["folders", newParentId] })
          queryClient.invalidateQueries({ queryKey: ["uploads", newParentId] })
        } else {
          queryClient.invalidateQueries({ queryKey: ["folders", null] })
          queryClient.invalidateQueries({ queryKey: ["uploads", null] })
        }
        
        // Taşınan klasörün kendi cache'ini invalidate et
        queryClient.invalidateQueries({ queryKey: ["folders", folderToMove.id] })
        queryClient.invalidateQueries({ queryKey: ["uploads", folderToMove.id] })
      }
      
      // Eğer taşınan klasör şu anda görüntülenen klasörse, yeni parent klasörüne yönlendir
      if (folderToMove && currentFolderId === folderToMove.id) {
        setCurrentFolderId(updatedFolder.parentId)
      }
      
      toast({
        variant: "success",
        title: "Klasör Taşındı",
        description: "Klasör ve içindeki tüm dosyalar başarıyla taşındı.",
      })
      setIsMoveModalOpen(false)
      setFolderToMove(null)
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.response?.data?.message || "Klasör taşınırken bir hata oluştu.",
      })
    },
  })

  // Seçim işlemleri
  const handleToggleFolderSelection = (folderId: string) => {
    const newSelected = new Set(selectedFolderIds)
    if (newSelected.has(folderId)) {
      newSelected.delete(folderId)
    } else {
      newSelected.add(folderId)
    }
    setSelectedFolderIds(newSelected)
  }

  const handleToggleUploadSelection = (uploadId: string) => {
    const newSelected = new Set(selectedUploadIds)
    if (newSelected.has(uploadId)) {
      newSelected.delete(uploadId)
    } else {
      newSelected.add(uploadId)
    }
    setSelectedUploadIds(newSelected)
  }

  const handleCancelSelection = () => {
    setIsSelectionMode(false)
    setSelectedFolderIds(new Set())
    setSelectedUploadIds(new Set())
  }

  // Klasörler için hepsini seç/kaldır
  const handleSelectAllFolders = () => {
    if (!folders || folders.length === 0) return
    const allFolderIds = new Set(folders.map((f) => f.id))
    setSelectedFolderIds(allFolderIds)
  }

  const handleDeselectAllFolders = () => {
    setSelectedFolderIds(new Set())
  }

  // Upload'lar için hepsini seç/kaldır
  const handleSelectAllUploads = () => {
    if (!uploads || uploads.length === 0) return
    const allUploadIds = new Set(uploads.map((u) => u.id))
    setSelectedUploadIds(allUploadIds)
  }

  const handleDeselectAllUploads = () => {
    setSelectedUploadIds(new Set())
  }

  // Tüm klasörler seçili mi?
  const areAllFoldersSelected = folders && folders.length > 0 && folders.every((f) => selectedFolderIds.has(f.id))
  // Tüm upload'lar seçili mi?
  const areAllUploadsSelected = uploads && uploads.length > 0 && uploads.every((u) => selectedUploadIds.has(u.id))

  // Toplu silme mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async () => {
      // Klasörleri recursive olarak sil
      for (const folderId of selectedFolderIds) {
        await folderService.deleteRecursive(folderId)
      }
      // Upload'ları sil
      for (const uploadId of selectedUploadIds) {
        await uploadService.delete(uploadId)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] })
      queryClient.invalidateQueries({ queryKey: ["uploads"] })
      queryClient.invalidateQueries({ queryKey: ["allFolders"] })
      toast({
        variant: "success",
        title: "Silme Başarılı",
        description: `${selectedFolderIds.size + selectedUploadIds.size} öğe başarıyla silindi.`,
      })
      handleCancelSelection()
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.response?.data?.message || "Silme işlemi sırasında bir hata oluştu.",
      })
    },
  })

  const handleBulkDelete = () => {
    if (selectedFolderIds.size === 0 && selectedUploadIds.size === 0) return
    
    const totalCount = selectedFolderIds.size + selectedUploadIds.size
    if (confirm(`${totalCount} öğeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
      bulkDeleteMutation.mutate()
    }
  }

  // Toplu taşıma mutation
  const bulkMoveMutation = useMutation({
    mutationFn: async (targetParentId: string | null) => {
      // Klasörleri taşı
      for (const folderId of selectedFolderIds) {
        await folderService.update(folderId, {
          parentId: targetParentId === null ? null : targetParentId,
        })
      }
      // Upload'ları taşı (folderId güncelle)
      for (const uploadId of selectedUploadIds) {
        await uploadService.update(uploadId, {
          folderId: targetParentId === null ? null : targetParentId,
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] })
      queryClient.invalidateQueries({ queryKey: ["uploads"] })
      queryClient.invalidateQueries({ queryKey: ["allFolders"] })
      toast({
        variant: "success",
        title: "Taşıma Başarılı",
        description: `${selectedFolderIds.size + selectedUploadIds.size} öğe başarıyla taşındı.`,
      })
      setIsBulkMoveModalOpen(false)
      handleCancelSelection()
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Hata",
        description: error.response?.data?.message || "Taşıma işlemi sırasında bir hata oluştu.",
      })
    },
  })

  const isLoading = foldersLoading || uploadsLoading

  return (
    <div className="flex flex-col gap-6">
      {/* Header ve Butonlar */}
      <div className="flex items-center justify-between">
        <MediaBreadcrumb
          path={folderPath}
          currentFolderId={currentFolderId}
          onNavigate={handleBreadcrumbClick}
        />
        <div className="flex items-center gap-2">
          {isSelectionMode ? (
            <>
              {selectedFolderIds.size > 0 || selectedUploadIds.size > 0 ? (
                <>
                  <button
                    onClick={() => setIsBulkMoveModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 text-sm font-medium transition-colors"
                  >
                    <Move className="w-4 h-4" />
                    Taşı ({selectedFolderIds.size + selectedUploadIds.size})
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={bulkDeleteMutation.isPending}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {bulkDeleteMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Sil ({selectedFolderIds.size + selectedUploadIds.size})
                  </button>
                  <button
                    onClick={handleCancelSelection}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background hover:bg-muted h-10 px-4 py-2 text-sm font-medium transition-colors"
                  >
                    <X className="w-4 h-4" />
                    İptal
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCancelSelection}
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background hover:bg-muted h-10 px-4 py-2 text-sm font-medium transition-colors"
                >
                  <X className="w-4 h-4" />
                  İptal
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => setIsSelectionMode(true)}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background hover:bg-muted h-10 px-4 py-2 text-sm font-medium transition-colors"
              >
                <CheckSquare className="w-4 h-4" />
                Seç
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Yükle
              </button>
            </>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Klasörler Grid */}
      {!isLoading && folders && folders.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Klasörler</h2>
            {isSelectionMode && (
              <div className="flex items-center gap-2">
                {areAllFoldersSelected ? (
                  <button
                    onClick={handleDeselectAllFolders}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background hover:bg-muted h-8 px-3 text-sm font-medium transition-colors"
                  >
                    <Circle className="w-4 h-4" />
                    Hepsini Kaldır ({folders.length})
                  </button>
                ) : (
                  <button
                    onClick={handleSelectAllFolders}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background hover:bg-muted h-8 px-3 text-sm font-medium transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Hepsini Seç ({folders.length})
                  </button>
                )}
              </div>
            )}
          </div>
          <FolderGrid
            folders={folders}
            onDoubleClick={isSelectionMode ? undefined : handleFolderDoubleClick}
            onEdit={(folder) => {
              if (!isSelectionMode) {
                setSelectedFolder(folder)
                setIsFolderDetailModalOpen(true)
              }
            }}
            onDelete={(folder) => {
              if (!isSelectionMode) {
                setSelectedFolder(folder)
                setIsFolderDetailModalOpen(true)
              }
            }}
            onMove={(folder) => {
              if (!isSelectionMode) {
                setFolderToMove(folder)
                setIsMoveModalOpen(true)
              }
            }}
            isSelectionMode={isSelectionMode}
            selectedIds={selectedFolderIds}
            onToggleSelection={handleToggleFolderSelection}
          />
        </div>
      )}

      {/* Uploadlar Grid */}
      {!isLoading && uploads && uploads.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Dosyalar</h2>
            {isSelectionMode && (
              <div className="flex items-center gap-2">
                {areAllUploadsSelected ? (
                  <button
                    onClick={handleDeselectAllUploads}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background hover:bg-muted h-8 px-3 text-sm font-medium transition-colors"
                  >
                    <Circle className="w-4 h-4" />
                    Hepsini Kaldır ({uploads.length})
                  </button>
                ) : (
                  <button
                    onClick={handleSelectAllUploads}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background hover:bg-muted h-8 px-3 text-sm font-medium transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Hepsini Seç ({uploads.length})
                  </button>
                )}
              </div>
            )}
          </div>
          <UploadGrid
            uploads={uploads}
            onDoubleClick={isSelectionMode ? undefined : (upload) => {
              setSelectedUpload(upload)
              setIsDetailModalOpen(true)
            }}
            isSelectionMode={isSelectionMode}
            selectedIds={selectedUploadIds}
            onToggleSelection={handleToggleUploadSelection}
          />
        </div>
      )}

      {/* Upload Detail Modal */}
      <UploadDetailModal
        upload={selectedUpload}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedUpload(null)
        }}
      />

      {/* Folder Detail Modal */}
      <FolderDetailModal
        folder={selectedFolder}
        isOpen={isFolderDetailModalOpen}
        onClose={() => {
          setIsFolderDetailModalOpen(false)
          setSelectedFolder(null)
        }}
      />

      {/* Move Folder Modal */}
      <MoveFolderModal
        folder={folderToMove}
        isOpen={isMoveModalOpen}
        onClose={() => {
          setIsMoveModalOpen(false)
          setFolderToMove(null)
        }}
        onMove={(targetFolderId) => {
          if (folderToMove) {
            moveFolderMutation.mutate({
              folderId: folderToMove.id,
              targetParentId: targetFolderId,
            })
          }
        }}
        isMoving={moveFolderMutation.isPending}
      />

      {/* Bulk Move Modal */}
      <MoveFolderModal
        folder={null}
        isOpen={isBulkMoveModalOpen}
        onClose={() => setIsBulkMoveModalOpen(false)}
        onMove={(targetFolderId) => {
          bulkMoveMutation.mutate(targetFolderId)
        }}
        isMoving={bulkMoveMutation.isPending}
        title={`${selectedFolderIds.size + selectedUploadIds.size} Öğeyi Taşı`}
        description={`Seçili ${selectedFolderIds.size} klasör ve ${selectedUploadIds.size} dosyayı taşımak için hedef klasörü seçin.`}
        excludedFolderIds={selectedFolderIds}
      />

      {/* Boş Durum */}
      {!isLoading &&
        (!folders || folders.length === 0) &&
        (!uploads || uploads.length === 0) && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              {currentFolderId
                ? "Bu klasörde henüz dosya veya klasör bulunmuyor."
                : "Henüz dosya veya klasör bulunmuyor. Yeni bir dosya veya klasör oluşturmak için 'Yükle' butonuna tıklayın."}
            </p>
          </div>
        )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        currentFolderId={currentFolderId}
        onCreateFolder={createFolderMutation.mutate}
        onUploadFiles={uploadFileMutation.mutate}
        isCreatingFolder={createFolderMutation.isPending}
        isUploadingFile={uploadFileMutation.isPending}
      />
    </div>
  )
}
