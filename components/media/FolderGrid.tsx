"use client"

import { Folder } from "@/services/folder.service"
import { Folder as FolderIcon, Check } from "lucide-react"
import { useState } from "react"
import { FolderContextMenu } from "./FolderContextMenu"

interface FolderGridProps {
  folders: Folder[]
  onDoubleClick?: (folderId: string) => void
  currentFolderId?: string | null
  onFolderChange?: (folderId: string | null) => void
  onEdit?: (folder: Folder) => void
  onDelete?: (folder: Folder) => void
  onMove?: (folder: Folder) => void
  isSelectionMode?: boolean
  selectedIds?: Set<string>
  onToggleSelection?: (folderId: string) => void
}

export function FolderGrid({
  folders,
  onDoubleClick,
  currentFolderId,
  onFolderChange,
  onEdit,
  onDelete,
  onMove,
  isSelectionMode = false,
  selectedIds = new Set(),
  onToggleSelection,
}: FolderGridProps) {
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null)

  const handleClick = (folder: Folder) => {
    // Sadece seçim modunda tek tıklama ile seçim yap
    if (isSelectionMode && onToggleSelection) {
      onToggleSelection(folder.id)
    } else if (onFolderChange) {
      // Normal modda tek tıklama ile klasöre gir
      onFolderChange(folder.id)
    }
  }

  const isSelected = (folderId: string) => selectedIds.has(folderId)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {folders.map((folder) => {
        const selected = isSelected(folder.id)
        const folderComponent = (
          <div
            onClick={() => handleClick(folder)}
            onDoubleClick={() => !isSelectionMode && onDoubleClick && onDoubleClick(folder.id)}
            onMouseEnter={() => setHoveredFolder(folder.id)}
            onMouseLeave={() => setHoveredFolder(null)}
            className={`group relative flex flex-col items-center justify-center p-4 rounded-lg border transition-all cursor-pointer select-none ${
              selected
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary hover:shadow-md"
            }`}
          >
            {/* Checkbox (seçim modunda) */}
            {isSelectionMode && (
              <div className="absolute top-2 left-2 z-10">
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    selected
                      ? "bg-primary border-primary"
                      : "bg-background border-border"
                  }`}
                >
                  {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                </div>
              </div>
            )}
            <div className="relative mb-3">
              <FolderIcon
                className={`w-16 h-16 transition-colors ${
                  selected || hoveredFolder === folder.id
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground truncate w-full max-w-[120px]">
                {folder.name}
              </p>
              {folder.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {folder.description}
                </p>
              )}
            </div>
          </div>
        )

        // Seçim modunda context menu'yu gösterme
        if (isSelectionMode) {
          return <div key={folder.id}>{folderComponent}</div>
        }

        return (
          <FolderContextMenu
            key={folder.id}
            folder={folder}
            onEdit={onEdit || (() => {})}
            onDelete={onDelete || (() => {})}
            onMove={onMove || (() => {})}
          >
            {folderComponent}
          </FolderContextMenu>
        )
      })}
    </div>
  )
}
