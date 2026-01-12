"use client"

import { useState, useEffect, useRef } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Edit, Trash2, Move } from "lucide-react"
import { Folder } from "@/services/folder.service"

interface FolderContextMenuProps {
  folder: Folder
  children: React.ReactNode
  onEdit: (folder: Folder) => void
  onDelete: (folder: Folder) => void
  onMove: (folder: Folder) => void
}

export function FolderContextMenu({
  folder,
  children,
  onEdit,
  onDelete,
  onMove,
}: FolderContextMenuProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPosition({ x: e.clientX, y: e.clientY })
    setOpen(true)
  }

  // Dışarı tıklandığında menüyü kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (open && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("click", handleClickOutside)
      return () => document.removeEventListener("click", handleClickOutside)
    }
  }, [open])

  return (
    <div ref={containerRef} onContextMenu={handleContextMenu}>
      {children}
      {open && (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuContent
            align="start"
            className="w-48"
            style={{
              position: "fixed",
              left: `${position.x}px`,
              top: `${position.y}px`,
            }}
          >
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                onEdit(folder)
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              <span>Düzenle</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                onMove(folder)
              }}
            >
              <Move className="mr-2 h-4 w-4" />
              <span>Taşı</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                onDelete(folder)
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Sil</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
