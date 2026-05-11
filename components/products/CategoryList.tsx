"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { AxiosError } from "axios"
import { categoryService, Category } from "@/services/category.service"
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Loader2, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CategoryForm } from "./CategoryForm"
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
import { useToast } from "@/components/ui/use-toast"

type SortField = "name" | "createdAt" | "isActive" | null
type SortOrder = "asc" | "desc"

const ITEMS_PER_PAGE = 10

export function CategoryList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Kategori listesi
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => categoryService.getAll(),
  })

  // Kategori tree yapısı
  const { data: categoryTree } = useQuery({
    queryKey: ["categories", "tree"],
    queryFn: () => categoryService.getTree(),
  })

  // Client-side sorting
  const sortedCategories = categories
    ? [...categories].sort((a, b) => {
      if (!sortField) return 0

      let aValue: string | number | boolean = ""
      let bValue: string | number | boolean = ""

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case "createdAt":
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case "isActive":
          aValue = a.isActive
          bValue = b.isActive
          break
      }

      if (typeof aValue === "boolean" && typeof bValue === "boolean") {
        if (aValue === bValue) return 0
        return sortOrder === "asc" ? (aValue ? -1 : 1) : aValue ? 1 : -1
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })
    : []

  // Client-side search
  const filteredCategories = sortedCategories.filter((category) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      category.name.toLowerCase().includes(query) ||
      category.slug.toLowerCase().includes(query) ||
      category.description?.toLowerCase().includes(query)
    )
  })

  // Pagination
  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE)
  const resolvedCurrentPage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1
  const startIndex = (resolvedCurrentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex)

  // Arama değiştiğinde listeyi ilk sayfadan başlatır
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
    setCurrentPage(1)
  }

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

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setIsFormOpen(true)
  }

  const handleCreate = () => {
    setEditingCategory(null)
    setIsFormOpen(true)
  }

  const handleFormClose = (open: boolean) => {
    setIsFormOpen(open)
    if (!open) {
      setEditingCategory(null)
    }
  }

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category)
    setDeleteDialogOpen(true)
  }

  // Kategori silme mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryService.delete(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
        queryClient.invalidateQueries({ queryKey: ["categories", "tree"] }),
      ])
      toast({
        title: "Başarılı",
        description: "Kategori başarıyla silindi.",
      })
      setDeleteDialogOpen(false)
      setCategoryToDelete(null)
    },
    onError: (error: unknown) => {
      const axiosError = error as AxiosError<{ message?: string }>
      toast({
        title: "Hata",
        description: axiosError.response?.data?.message || "Kategori silinirken bir hata oluştu.",
        variant: "destructive",
      })
    },
  })

  const handleDeleteConfirm = () => {
    if (categoryToDelete) {
      deleteMutation.mutate(categoryToDelete.id)
    }
  }

  // Önceki kategori sayfasına güvenli şekilde geçer
  const handlePreviousPage = () => {
    setCurrentPage(Math.max(resolvedCurrentPage - 1, 1))
  }

  // Sonraki kategori sayfasına güvenli şekilde geçer
  const handleNextPage = () => {
    setCurrentPage(Math.min(resolvedCurrentPage + 1, totalPages))
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
                onChange={handleSearchChange}
                placeholder="Kategori ara..."
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
              Yeni Kategori
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
                    Kategori Adı
                    {getSortIcon("name")}
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Parent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <button
                    onClick={() => handleSort("isActive")}
                    className="flex items-center gap-2 hover:text-foreground transition-colors"
                  >
                    Durum
                    {getSortIcon("isActive")}
                  </button>
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
              {paginatedCategories && paginatedCategories.length > 0 ? (
                paginatedCategories.map((category) => (
                  <tr
                    key={category.id}
                    className="hover:bg-muted/50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-foreground">
                        {category.name}
                      </div>
                      {category.description && (
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {category.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted-foreground font-mono">
                        /{category.slug}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted-foreground">
                        {category.parent ? category.parent.name : "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${category.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                      >
                        {category.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted-foreground">
                        {new Date(category.createdAt).toLocaleDateString("tr-TR", {
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
                          onClick={() => handleEdit(category)}
                        >
                          Düzenle
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteClick(category)}
                        >
                          Sil
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-sm text-muted-foreground">
                      {searchQuery
                        ? "Arama kriterlerine uygun kategori bulunamadı."
                        : "Henüz kategori bulunmuyor."}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Info */}
        {filteredCategories.length > 0 && (
          <div className="flex items-center justify-between gap-4 border-t border-border px-6 py-3 bg-muted/30">
            <div className="text-xs text-muted-foreground">
              {startIndex + 1}-{Math.min(endIndex, filteredCategories.length)} / {filteredCategories.length} kategori gösteriliyor
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={resolvedCurrentPage === 1}
                >
                  Önceki
                </Button>
                <span className="text-xs text-muted-foreground">
                  Sayfa {resolvedCurrentPage} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={resolvedCurrentPage === totalPages}
                >
                  Sonraki
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <CategoryForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        category={editingCategory}
        categories={categories || []}
        categoryTree={categoryTree || []}
      />

      {/* Silme Onay Dialogu */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kategoriyi Sil</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <div>
                  <strong>{categoryToDelete?.name}</strong> kategorisini silmek istediğinizden emin misiniz?
                </div>
                {categoryToDelete?.children && categoryToDelete.children.length > 0 && (
                  <div className="text-red-600 dark:text-red-400 font-medium">
                    ⚠️ Bu kategorinin {categoryToDelete.children.length} alt kategorisi var.
                    Alt kategorileri olan bir kategori silinemez!
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  Bu işlem geri alınamaz.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              İptal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending || (categoryToDelete?.children && categoryToDelete.children.length > 0)}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
