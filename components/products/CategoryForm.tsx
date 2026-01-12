"use client"

import { useState, useEffect } from "react"
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
import { categoryService, Category, CreateCategoryDto, UpdateCategoryDto } from "@/services/category.service"
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
}

export function CategoryForm({ open, onOpenChange, category, categories = [] }: CategoryFormProps) {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast({
        title: "Başarılı",
        description: "Kategori başarıyla oluşturuldu.",
      })
      onOpenChange(false)
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      toast({
        title: "Başarılı",
        description: "Kategori başarıyla güncellendi.",
      })
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

  const onSubmit = async (data: CategoryFormValues) => {
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
        await updateMutation.mutateAsync({ id: category.id, data: submitData })
      } else {
        await createMutation.mutateAsync(submitData)
      }
    } catch (error) {
      // Error handled in mutation
    } finally {
      setIsSubmitting(false)
    }
  }

  // Kategorileri hiyerarşik yapıya çevir ve path oluştur
  const buildCategoryPath = (cat: Category, allCats: Category[]): string => {
    const path: string[] = [cat.name]
    let currentId: string | null = cat.parentId

    while (currentId) {
      const parent = allCats.find((c) => c.id === currentId)
      if (parent) {
        path.unshift(parent.name)
        currentId = parent.parentId
      } else {
        break
      }
    }

    return path.join(" > ")
  }

  // Kategorileri hiyerarşik olarak sırala (parent'lar önce, child'lar sonra)
  const getCategoryDepth = (cat: Category, allCats: Category[]): number => {
    let depth = 0
    let currentId: string | null = cat.parentId

    while (currentId) {
      depth++
      const parent = allCats.find((c) => c.id === currentId)
      if (parent) {
        currentId = parent.parentId
      } else {
        break
      }
    }

    return depth
  }

  // Parent kategorileri filtrele ve hiyerarşik sırala
  const availableParents = categories
    .filter((cat) => !category || (cat.id !== category.id && cat.parentId !== category.id))
    .sort((a, b) => {
      // Önce depth'e göre sırala (parent'lar önce)
      const depthA = getCategoryDepth(a, categories)
      const depthB = getCategoryDepth(b, categories)
      if (depthA !== depthB) {
        return depthA - depthB
      }
      // Aynı depth'te ise isme göre sırala
      return a.name.localeCompare(b.name, "tr")
    })

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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  {availableParents.map((cat) => {
                    const depth = getCategoryDepth(cat, categories)
                    const indent = "  ".repeat(depth)
                    const prefix = depth > 0 ? "└─ " : ""
                    const path = buildCategoryPath(cat, categories)
                    
                    return (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{indent}{prefix}{cat.name}</span>
                          {depth > 0 && (
                            <span className="text-xs text-muted-foreground">({path})</span>
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
