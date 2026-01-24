"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { personalizationService } from "@/services/personalization.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { PageBody } from "@/components/layout/PageBody"
import { useForm } from "react-hook-form"

interface CreateFormData {
  title: string
  subtitle?: string
  description?: string
  isActive?: boolean
}

export default function NewPersonalizationFormPage() {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormData>({
    defaultValues: {
      title: "",
      subtitle: "",
      description: "",
      isActive: true,
    },
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateFormData) => personalizationService.createForm(data),
    onSuccess: (createdForm) => {
      queryClient.invalidateQueries({ queryKey: ["personalization-forms"] })
      toast({
        title: "Başarılı",
        description: "Form başarıyla oluşturuldu",
      })
      router.push(`/panel/personalization/forms/${createdForm.id}`)
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.response?.data?.message || "Form oluşturulamadı",
        variant: "destructive",
      })
    },
  })

  const onSubmit = (data: CreateFormData) => {
    createMutation.mutate(data)
  }

  return (
    <PageBody>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/panel/personalization/forms")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Yeni Kişiselleştirme Formu</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Yeni bir kişiselleştirme formu oluşturun
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Form Bilgileri</CardTitle>
            <CardDescription>
              Formun temel bilgilerini girin. Detaylı ayarları form oluşturduktan sonra
              yapabilirsiniz.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <Label htmlFor="title">
                  Form Başlığı <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  {...register("title", { required: "Form başlığı gereklidir" })}
                  placeholder="Örn: Kişiye Özel Lamba Formu"
                  className="mt-1"
                />
                {errors.title && (
                  <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="subtitle">Alt Başlık</Label>
                <Input
                  id="subtitle"
                  {...register("subtitle")}
                  placeholder="Örn: Lambanızı kişiselleştirin"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Form hakkında açıklama..."
                  className="mt-1"
                  rows={4}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  {...register("isActive")}
                  className="w-4 h-4 rounded border-border"
                  defaultChecked
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  Aktif
                </Label>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || createMutation.isPending}
                >
                  {isSubmitting || createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Oluşturuluyor...
                    </>
                  ) : (
                    "Formu Oluştur"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/panel/personalization/forms")}
                >
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageBody>
  )
}
