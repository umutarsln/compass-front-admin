"use client"

import { Upload } from "@/services/upload.service"
import { Image, File, FileText, Check } from "lucide-react"
import { useState } from "react"

interface UploadGridProps {
  uploads: Upload[]
  onDoubleClick?: (upload: Upload) => void
  isSelectionMode?: boolean
  selectedIds?: Set<string>
  onToggleSelection?: (uploadId: string) => void
}

export function UploadGrid({
  uploads,
  onDoubleClick,
  isSelectionMode = false,
  selectedIds = new Set(),
  onToggleSelection,
}: UploadGridProps) {
  const [hoveredUpload, setHoveredUpload] = useState<string | null>(null)

  const handleClick = (upload: Upload) => {
    if (isSelectionMode && onToggleSelection) {
      onToggleSelection(upload.id)
    } else if (onDoubleClick) {
      onDoubleClick(upload)
    }
  }

  const isSelected = (uploadId: string) => selectedIds.has(uploadId)

  const isImage = (mimeType: string) => {
    return mimeType.startsWith("image/")
  }

  const isPdf = (mimeType: string) => {
    return mimeType === "application/pdf"
  }

  const getFileIcon = (upload: Upload) => {
    if (isImage(upload.mimeType)) {
      return (
        <img
          src={upload.s3Url}
          alt={upload.displayName || upload.filename}
          className="w-full h-full object-cover rounded"
          onError={(e) => {
            // Resim yüklenemezse icon göster
            const target = e.target as HTMLImageElement
            target.style.display = "none"
            if (target.parentElement) {
              target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-muted"><svg class="w-12 h-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>`
            }
          }}
        />
      )
    }
    if (isPdf(upload.mimeType)) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-red-50">
          <FileText className="w-12 h-12 text-red-500" />
        </div>
      )
    }
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <File className="w-12 h-12 text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {uploads.map((upload) => {
        const selected = isSelected(upload.id)
        return (
          <div
            key={upload.id}
            onClick={() => handleClick(upload)}
            onDoubleClick={() => !isSelectionMode && onDoubleClick && onDoubleClick(upload)}
            onMouseEnter={() => setHoveredUpload(upload.id)}
            onMouseLeave={() => setHoveredUpload(null)}
            className={`group relative flex flex-col rounded-lg border transition-all overflow-hidden cursor-pointer ${
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
            {/* Thumbnail/Icon */}
            <div className="aspect-square w-full bg-muted relative overflow-hidden">
              {getFileIcon(upload)}
              {hoveredUpload === upload.id && !isSelectionMode && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {Number(upload.sizeMB).toFixed(2)} MB
                  </span>
                </div>
              )}
            </div>

            {/* File Info */}
            <div className="p-2">
              <p className="text-xs font-medium text-foreground truncate">
                {upload.displayName || upload.filename}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {upload.mimeType.split("/")[1]?.toUpperCase() || "FILE"}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
