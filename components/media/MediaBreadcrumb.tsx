"use client"

import { ChevronRight, Home } from "lucide-react"
import { Folder } from "@/services/folder.service"

interface MediaBreadcrumbProps {
  path: Folder[]
  currentFolderId: string | null
  onNavigate: (folderId: string | null) => void
}

export function MediaBreadcrumb({
  path,
  currentFolderId,
  onNavigate,
}: MediaBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm">
      <button
        onClick={() => onNavigate(null)}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="w-4 h-4" />
        <span>Ana Klasör</span>
      </button>

      {path.map((folder, index) => (
        <div key={folder.id} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
          <button
            onClick={() => onNavigate(folder.id)}
            className={`transition-colors ${
              index === path.length - 1
                ? "text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {folder.name}
          </button>
        </div>
      ))}
    </nav>
  )
}
