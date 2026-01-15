"use client"

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { categoryService, Category, CategoryTree, CreateCategoryDto, UpdateCategoryDto } from "@/services/category.service"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

const categorySchema = z.object({
  name: z.string().min(1, "Kategori adı gereklidir"),
  description: z.string().optional(),
  parentId: z.string().nullable().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
  isActive: z.boolean().default(true),
  displayOrder: z.number().default(0),
})

type CategoryFormValues = z.infer<typeof categorySchema>

interface CategoryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  categories?: Category[]
  categoryTree?: CategoryTree[]
}

export function CategoryForm({ open, onOpenChange, category, categories = [], categoryTree = [] }: CategoryFormProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      parentId: null,
      seoTitle: "",
      seoDescription: "",
      seoKeywords: "",
      isActive: true,
      displayOrder: 0,
    },
  })

  const parentId = watch("parentId")

  // Form'u kategori verisi ile doldur (düzenleme modu)
  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        description: category.description || "",
        parentId: category.parentId || null,
        seoTitle: category.seoTitle || "",
        seoDescription: category.seoDescription || "",
        seoKeywords: category.seoKeywords?.join(", ") || "",
        isActive: category.isActive,
        displayOrder: category.displayOrder,
      })
    } else {
      reset({
        name: "",
        description: "",
        parentId: null,
        seoTitle: "",
        seoDescription: "",
        seoKeywords: "",
        isActive: true,
        displayOrder: 0,
      })
    }
  }, [category, reset, open])

  // Kategori oluşturma mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateCategoryDto) => categoryService.create(data),
    onSuccess: async () => {
      // Query'leri invalidate et (refetch tetiklenecek)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
        queryClient.invalidateQueries({ queryKey: ["categories", "tree"] }),
      ])
      toast({
        title: "Başarılı",
        description: "Kategori başarıyla oluşturuldu. Listede görünecektir.",
      })
      // Form'u resetle ama dialog'u açık tut (kullanıcı kapatabilir)
      reset()
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.response?.data?.message || "Kategori oluşturulurken bir hata oluştu.",
        variant: "destructive",
      })
    },
  })

  // Kategori güncelleme mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryDto }) =>
      categoryService.update(id, data),
    onSuccess: async () => {
      // Query'leri invalidate et (refetch tetiklenecek)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
        queryClient.invalidateQueries({ queryKey: ["categories", "tree"] }),
      ])
      toast({
        title: "Başarılı",
        description: "Kategori başarıyla güncellendi.",
      })
      // Dialog'u kapat
      onOpenChange(false)
      reset()
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.response?.data?.message || "Kategori güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    },
  })

  const onSubmit = async (data: CategoryFormValues, e?: React.BaseSyntheticEvent) => {
    // Event propagation'ı durdur - parent form'u tetiklemesin
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    setIsSubmitting(true)
    try {
      const submitData: CreateCategoryDto | UpdateCategoryDto = {
        name: data.name,
        description: data.description || undefined,
        parentId: data.parentId || null,
        seoTitle: data.seoTitle || undefined,
        seoDescription: data.seoDescription || undefined,
        seoKeywords: data.seoKeywords
          ? data.seoKeywords.split(",").map((k) => k.trim()).filter(Boolean)
          : undefined,
        isActive: data.isActive,
        displayOrder: data.displayOrder,
      }

      if (category) {
        await updateMutation.mutateAsync({ id: category.id, data: submitData as UpdateCategoryDto })
      } else {
        await createMutation.mutateAsync(submitData as CreateCategoryDto)
      }
    } catch (error) {
      // Error handled in mutation
    } finally {
      setIsSubmitting(false)
    }
  }

  // Tree yapısından düz listeye çevir (hiyerarşik sırayla)
  const flattenCategoryTree = (
    tree: CategoryTree[],
    level: number = 0,
    excludeId?: string,
    parentPath: string[] = []
  ): Array<{ category: CategoryTree; level: number; path: string[] }> => {
    const result: Array<{ category: CategoryTree; level: number; path: string[] }> = []

    for (const node of tree) {
      // Düzenlenen kategoriyi ve onun alt kategorilerini hariç tut
      if (excludeId && node.id === excludeId) {
        continue
      }

      const currentPath = [...parentPath, node.name]

      result.push({
        category: node,
        level,
        path: currentPath,
      })

      // Alt kategorileri ekle (recursive)
      if (node.children && node.children.length > 0) {
        const filteredChildren = node.children.filter(
          (child) => !excludeId || child.id !== excludeId
        )
        result.push(...flattenCategoryTree(filteredChildren, level + 1, excludeId, currentPath))
      }
    }

    return result
  }

  // Category'yi CategoryTree'ye çevir (fallback için)
  const categoryToTree = (cat: Category): CategoryTree => {
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      children: [],
    }
  }

  // Parent kategorileri tree yapısından al
  const getAvailableParents = () => {
    if (categoryTree.length > 0) {
      // Tree yapısını kullan
      return flattenCategoryTree(categoryTree, 0, category?.id)
    } else {
      // Fallback: Düz listeden hiyerarşik yapı oluştur
      const filteredCategories = categories.filter(
        (cat) => !category || (cat.id !== category.id && cat.parentId !== category.id)
      )

      // Root kategorileri bul (parentId null olanlar)
      const rootCategories = filteredCategories.filter((cat) => !cat.parentId)

      // Recursive olarak tree yapısı oluştur
      const buildTreeFromFlat = (
        parentId: string | null,
        level: number = 0,
        parentPath: string[] = []
      ): Array<{ category: CategoryTree; level: number; path: string[] }> => {
        const result: Array<{ category: CategoryTree; level: number; path: string[] }> = []

        const children = filteredCategories.filter((cat) => cat.parentId === parentId)

        for (const cat of children) {
          const currentPath = [...parentPath, cat.name]
          const treeNode: CategoryTree = {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            children: [],
          }

          result.push({
            category: treeNode,
            level,
            path: currentPath,
          })

          // Alt kategorileri recursive olarak ekle
          const childResults = buildTreeFromFlat(cat.id, level + 1, currentPath)
          result.push(...childResults)
        }

        return result
      }

      // Root kategorileri ve alt kategorilerini sırayla ekle
      const result: Array<{ category: CategoryTree; level: number; path: string[] }> = []
      for (const root of rootCategories) {
        const treeNode: CategoryTree = {
          id: root.id,
          name: root.name,
          slug: root.slug,
          children: [],
        }
        result.push({
          category: treeNode,
          level: 0,
          path: [root.name],
        })
        // Alt kategorileri ekle
        result.push(...buildTreeFromFlat(root.id, 1, [root.name]))
      }

      return result
    }
  }

  const availableParents = getAvailableParents()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{category ? "Kategori Düzenle" : "Yeni Kategori Oluştur"}</DialogTitle>
          <DialogDescription>
            {category
              ? "Kategori bilgilerini güncelleyin."
              : "Yeni bir kategori oluşturmak için formu doldurun."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleSubmit(onSubmit)(e)
          }}
          className="space-y-4"
        >
          {/* Temel Bilgiler */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Kategori Adı *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Örn: Elektronik"
                className="mt-1"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Açıklama</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Kategori açıklaması..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="parentId">Üst Kategori</Label>
              <Select
                value={parentId || "none"}
                onValueChange={(value) => setValue("parentId", value === "none" ? null : value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Üst kategori seçin (opsiyonel)" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="none">Yok (Ana Kategori)</SelectItem>
                  {availableParents.map((item) => {
                    const indent = "  ".repeat(item.level)
                    const prefix = item.level > 0 ? "└─ " : ""
                    const fullPath = item.path.join(" > ")

                    return (
                      <SelectItem key={item.category.id} value={item.category.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium whitespace-pre">
                            {indent}
                            {prefix}
                            {item.category.name}
                          </span>
                          {item.level > 0 && item.path.length > 1 && (
                            <span className="text-xs text-muted-foreground truncate">
                              ({fullPath})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="displayOrder">Sıralama</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  {...register("displayOrder", { valueAsNumber: true })}
                  className="mt-1"
                />
              </div>

              <div className="flex items-center space-x-2 pt-8">
                <input
                  type="checkbox"
                  id="isActive"
                  {...register("isActive")}
                  className="w-4 h-4 rounded border-border"
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Aktif
                </Label>
              </div>
            </div>
          </div>

          {/* SEO Bilgileri */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground">SEO Ayarları</h3>

            <div>
              <Label htmlFor="seoTitle">SEO Başlık</Label>
              <Input
                id="seoTitle"
                {...register("seoTitle")}
                placeholder="SEO için başlık"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="seoDescription">SEO Açıklama</Label>
              <Textarea
                id="seoDescription"
                {...register("seoDescription")}
                placeholder="SEO için açıklama"
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="seoKeywords">SEO Anahtar Kelimeler</Label>
              <Input
                id="seoKeywords"
                {...register("seoKeywords")}
                placeholder="Anahtar kelimeler (virgülle ayırın)"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Örn: elektronik, teknoloji, cihaz
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {category ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
