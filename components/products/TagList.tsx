"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { tagService, Tag } from "@/services/tag.service"
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Loader2, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TagForm } from "./TagForm"

type SortField = "name" | "createdAt" | null
type SortOrder = "asc" | "desc"

const ITEMS_PER_PAGE = 10

export function TagList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)

  // Tag listesi
  const { data: tags, isLoading } = useQuery({
    queryKey: ["tags"],
    queryFn: () => tagService.getAll(),
  })

  // Client-side sorting
  const sortedTags = tags
    ? [...tags].sort((a, b) => {
        if (!sortField) return 0

        let aValue: string | number = ""
        let bValue: string | number = ""

        switch (sortField) {
          case "name":
            aValue = a.name.toLowerCase()
            bValue = b.name.toLowerCase()
            break
          case "createdAt":
            aValue = new Date(a.createdAt).getTime()
            bValue = new Date(b.createdAt).getTime()
            break
        }

        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
        return 0
      })
    : []

  // Client-side search
  const filteredTags = sortedTags.filter((tag) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      tag.name.toLowerCase().includes(query) ||
      tag.slug.toLowerCase().includes(query) ||
      tag.description?.toLowerCase().includes(query)
    )
  })

  // Pagination
  const totalPages = Math.ceil(filteredTags.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedTags = filteredTags.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4 text-primary" />
    ) : (
      <ArrowDown className="w-4 h-4 text-primary" />
    )
  }

  const handleEdit = (tag: Tag) => {
    setEditingTag(tag)
    setIsFormOpen(true)
  }

  const handleCreate = () => {
    setEditingTag(null)
    setIsFormOpen(true)
  }

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open)
    if (!open) {
      setEditingTag(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-card shadow-sm">
      {/* Search Bar */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tag ara..."
              className="w-full h-12 pl-10 pr-4 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          {searchQuery && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Temizle
            </Button>
          )}
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Yeni Tag
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  Tag Adı
                  {getSortIcon("name")}
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Renk
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Slug
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <button
                  onClick={() => handleSort("createdAt")}
                  className="flex items-center gap-2 hover:text-foreground transition-colors"
                >
                  Oluşturulma
                  {getSortIcon("createdAt")}
                </button>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedTags && paginatedTags.length > 0 ? (
              paginatedTags.map((tag) => (
                <tr
                  key={tag.id}
                  className="hover:bg-muted/50 transition-colors duration-150"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-foreground">
                        {tag.name}
                      </div>
                      {tag.description && (
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {tag.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border border-border"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm text-muted-foreground font-mono">
                        {tag.color}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-muted-foreground font-mono">
                      /{tag.slug}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-muted-foreground">
                      {new Date(tag.createdAt).toLocaleDateString("tr-TR", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(tag)}
                      >
                        Düzenle
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        Sil
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="text-sm text-muted-foreground">
                    {searchQuery
                      ? "Arama kriterlerine uygun tag bulunamadı."
                      : "Henüz tag bulunmuyor."}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      {filteredTags.length > 0 && (
        <div className="border-t border-border px-6 py-3 bg-muted/30">
          <div className="text-xs text-muted-foreground">
            {startIndex + 1}-{Math.min(endIndex, filteredTags.length)} / {filteredTags.length} tag gösteriliyor
          </div>
        </div>
      )}
      </div>

      <TagForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        tag={editingTag}
      />
    </>
  )
}
