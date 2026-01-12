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
import { tagService, Tag, CreateTagDto, UpdateTagDto } from "@/services/tag.service"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

const tagSchema = z.object({
  name: z.string().min(1, "Tag adı gereklidir"),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Geçerli bir hex renk kodu girin (örn: #FF5733)"),
})

type TagFormValues = z.infer<typeof tagSchema>

interface TagFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tag?: Tag | null
}

export function TagForm({ open, onOpenChange, tag }: TagFormProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#FF5733",
    },
  })

  const colorValue = watch("color")

  // Form'u tag verisi ile doldur (düzenleme modu)
  useEffect(() => {
    if (tag) {
      reset({
        name: tag.name,
        description: tag.description || "",
        color: tag.color || "#FF5733",
      })
    } else {
      reset({
        name: "",
        description: "",
        color: "#FF5733",
      })
    }
  }, [tag, reset, open])

  // Tag oluşturma mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateTagDto) => tagService.create(data),
    onSuccess: async () => {
      // Query'leri invalidate et (refetch tetiklenecek)
      await queryClient.invalidateQueries({ queryKey: ["tags"] })
      toast({
        title: "Başarılı",
        description: "Tag başarıyla oluşturuldu. Listede görünecektir.",
      })
      // Form'u resetle ama dialog'u açık tut (kullanıcı kapatabilir)
      reset()
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.response?.data?.message || "Tag oluşturulurken bir hata oluştu.",
        variant: "destructive",
      })
    },
  })

  // Tag güncelleme mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTagDto }) =>
      tagService.update(id, data),
    onSuccess: async () => {
      // Query'leri invalidate et (refetch tetiklenecek)
      await queryClient.invalidateQueries({ queryKey: ["tags"] })
      toast({
        title: "Başarılı",
        description: "Tag başarıyla güncellendi.",
      })
      // Dialog'u kapat
      onOpenChange(false)
      reset()
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.response?.data?.message || "Tag güncellenirken bir hata oluştu.",
        variant: "destructive",
      })
    },
  })

  const onSubmit = async (data: TagFormValues, e?: React.BaseSyntheticEvent) => {
    // Event propagation'ı durdur - parent form'u tetiklemesin
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    setIsSubmitting(true)
    try {
      const submitData: CreateTagDto | UpdateTagDto = {
        name: data.name,
        description: data.description || undefined,
        color: data.color,
      }

      if (tag) {
        await updateMutation.mutateAsync({ id: tag.id, data: submitData })
      } else {
        await createMutation.mutateAsync(submitData)
      }
    } catch (error) {
      // Error handled in mutation
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tag ? "Tag Düzenle" : "Yeni Tag Oluştur"}</DialogTitle>
          <DialogDescription>
            {tag ? "Tag bilgilerini güncelleyin." : "Yeni bir tag oluşturmak için formu doldurun."}
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
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Tag Adı *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Örn: Yeni Ürün"
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
                placeholder="Tag açıklaması..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="color">Renk *</Label>
              <div className="flex items-center gap-4 mt-1">
                <Input
                  id="color"
                  type="color"
                  {...register("color")}
                  className="w-20 h-12 cursor-pointer"
                />
                <Input
                  type="text"
                  {...register("color")}
                  placeholder="#FF5733"
                  className="flex-1 font-mono"
                />
              </div>
              {errors.color && (
                <p className="text-sm text-red-600 mt-1">{errors.color.message}</p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Önizleme:</span>
                <div
                  className="w-8 h-8 rounded border border-border"
                  style={{ backgroundColor: colorValue || "#FF5733" }}
                />
                <span className="text-xs font-mono text-muted-foreground">
                  {colorValue || "#FF5733"}
                </span>
              </div>
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
              {tag ? "Güncelle" : "Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
