"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Folder, folderService } from "@/services/folder.service"
import { Folder as FolderIcon, ChevronRight, ChevronDown, Loader2 } from "lucide-react"

interface MoveFolderModalProps {
  folder: Folder | null
  isOpen: boolean
  onClose: () => void
  onMove: (targetFolderId: string | null) => void
  isMoving: boolean
  title?: string
  description?: string
  excludedFolderIds?: Set<string> // Toplu taşıma için exclude edilecek klasör ID'leri
}

interface FolderTreeNode {
  folder: Folder
  children: FolderTreeNode[]
  isExpanded: boolean
}

export function MoveFolderModal({
  folder,
  isOpen,
  onClose,
  onMove,
  isMoving,
  title,
  description,
  excludedFolderIds,
}: MoveFolderModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null | undefined>(undefined)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  // Tüm klasörleri getir
  const { data: allFolders, isLoading } = useQuery({
    queryKey: ["folders"],
    queryFn: () => folderService.getAll(),
    enabled: isOpen,
  })

  // Taşınacak klasörün alt klasörlerinin ID'lerini bul (recursive)
  const getExcludedFolderIds = (folders: Folder[], parentId: string): Set<string> => {
    const excluded = new Set<string>([parentId])
    const children = folders.filter((f) => f.parentId === parentId)
    for (const child of children) {
      const childExcluded = getExcludedFolderIds(folders, child.id)
      childExcluded.forEach((id) => excluded.add(id))
    }
    return excluded
  }

  // Tree yapısını oluştur (taşınacak klasörü ve alt klasörlerini hariç tut)
  const buildTree = (
    folders: Folder[],
    parentId: string | null = null,
    excludedIds?: Set<string>
  ): FolderTreeNode[] => {
    return folders
      .filter((f) => {
        // Taşınacak klasörü ve alt klasörlerini hariç tut
        if (excludedIds && excludedIds.has(f.id)) {
          return false
        }
        return f.parentId === parentId
      })
      .map((f) => ({
        folder: f,
        children: buildTree(folders, f.id, excludedIds),
        isExpanded: expandedFolders.has(f.id),
      }))
  }

  // Exclude edilecek klasör ID'lerini belirle
  let excludedIds: Set<string> | undefined = undefined
  
  if (excludedFolderIds) {
    // Toplu taşıma: exclude edilen klasörlerin alt klasörlerini de ekle
    excludedIds = new Set(excludedFolderIds)
    if (allFolders) {
      for (const excludedId of excludedFolderIds) {
        const childrenExcluded = getExcludedFolderIds(allFolders, excludedId)
        childrenExcluded.forEach((id) => excludedIds!.add(id))
      }
    }
  } else if (folder && allFolders) {
    // Tek klasör taşıma: taşınan klasörü ve alt klasörlerini exclude et
    excludedIds = getExcludedFolderIds(allFolders, folder.id)
  }
  
  const tree = allFolders ? buildTree(allFolders, null, excludedIds) : []

  const toggleExpand = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const handleFolderClick = (folderId: string | null, e: React.MouseEvent) => {
    e.stopPropagation()
    // Tek tıklama - seç
    setSelectedFolderId(folderId)
  }

  const handleFolderDoubleClick = (folderId: string | null) => {
    if (folderId) {
      toggleExpand(folderId)
    }
  }

  const handleMove = () => {
    // selectedFolderId undefined ise hiçbir şey seçilmemiş demektir
    if (selectedFolderId === undefined) return
    
    // Toplu taşıma için kontrol yok (folder null)
    if (!folder) {
      onMove(selectedFolderId)
      return
    }
    
    // Tek klasör taşıma için: Eğer mevcut parentId ile aynıysa taşıma yapma
    const currentParentId = folder.parentId || null
    if (selectedFolderId !== currentParentId) {
      onMove(selectedFolderId)
    }
  }

  // Modal açıldığında seçimi sıfırla
  useEffect(() => {
    if (isOpen) {
      setSelectedFolderId(undefined)
      setExpandedFolders(new Set())
    }
  }, [isOpen])

  const renderTreeNode = (node: FolderTreeNode, level: number = 0) => {
    const hasChildren = node.children.length > 0
    const isSelected = selectedFolderId === node.folder.id
    const isExpanded = expandedFolders.has(node.folder.id)

    return (
      <div key={node.folder.id}>
        <div
          onClick={(e) => handleFolderClick(node.folder.id, e)}
          onDoubleClick={(e) => {
            e.stopPropagation()
            handleFolderDoubleClick(node.folder.id)
          }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
            isSelected
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
          style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpand(node.folder.id)
              }}
              className="p-0.5 hover:bg-black/10 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}
          <FolderIcon className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium truncate">{node.folder.name}</span>
        </div>
        {hasChildren && isExpanded && (
          <div>{node.children.map((child) => renderTreeNode(child, level + 1))}</div>
        )}
      </div>
    )
  }

  // Eğer folder null ise ve title/description yoksa, bu toplu taşıma değil, hata var
  if (!folder && !title) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title || "Klasörü Taşı"}</DialogTitle>
          <DialogDescription>
            {description || (folder ? `"${folder.name}" klasörünü taşımak için hedef klasörü seçin.` : "Hedef klasörü seçin.")}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Ana Dizin */}
            <div
              onClick={(e) => {
                e.stopPropagation()
                setSelectedFolderId(null)
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                selectedFolderId === null
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <div className="w-5" />
              <FolderIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Ana Dizin</span>
            </div>

            {/* Klasör Tree */}
            <div className="border border-border rounded-lg p-2 max-h-[400px] overflow-y-auto">
              {tree.length > 0 ? (
                tree.map((node) => renderTreeNode(node))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Henüz klasör bulunmuyor.
                </p>
              )}
            </div>

            {/* Seçilen Klasör Bilgisi */}
            {selectedFolderId !== undefined && (
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Hedef Klasör:</p>
                <p className="text-sm font-medium text-foreground">
                  {selectedFolderId === null
                    ? "Ana Dizin"
                    : allFolders?.find((f) => f.id === selectedFolderId)?.name || "Bilinmeyen"}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 h-10 inline-flex items-center justify-center rounded-md border border-border bg-background hover:bg-muted transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleMove}
                disabled={
                  isMoving || 
                  selectedFolderId === undefined || 
                  (folder !== null && selectedFolderId === (folder.parentId || null))
                }
                className="flex-1 h-10 inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isMoving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Taşınıyor...
                  </>
                ) : (
                  "Taşı"
                )}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
