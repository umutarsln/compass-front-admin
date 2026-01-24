"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { personalizationService, PersonalizationForm } from "@/services/personalization.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { PageBody } from "@/components/layout/PageBody"
import Link from "next/link"

export default function PersonalizationFormsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: forms, isLoading } = useQuery({
    queryKey: ["personalization-forms"],
    queryFn: () => personalizationService.getForms(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => personalizationService.deleteForm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personalization-forms"] })
      toast({
        title: "Başarılı",
        description: "Form başarıyla silindi",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.response?.data?.message || "Form silinemedi",
        variant: "destructive",
      })
    },
  })

  if (isLoading) {
    return (
      <PageBody>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageBody>
    )
  }

  return (
    <PageBody>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Kişiselleştirme Formları</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ürünler için kullanılacak kişiselleştirme formlarını yönetin.
            </p>
          </div>
          <Button onClick={() => router.push("/panel/personalization/forms/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Yeni Form
          </Button>
        </div>

        {forms && forms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map((form) => (
              <Card key={form.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{form.title}</CardTitle>
                      {form.subtitle && (
                        <CardDescription className="mt-1">{form.subtitle}</CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {form.isActive ? (
                        <Badge variant="default">Aktif</Badge>
                      ) : (
                        <Badge variant="secondary">Pasif</Badge>
                      )}
                      {form.currentPublishedVersion && (
                        <Badge variant="outline">v{form.currentPublishedVersion.version}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {form.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {form.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/panel/personalization/forms/${form.id}`)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Düzenle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm("Bu formu silmek istediğinize emin misiniz?")) {
                          deleteMutation.mutate(form.id)
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">Henüz form oluşturulmamış</p>
              <Button onClick={() => router.push("/panel/personalization/forms/new")}>
                <Plus className="w-4 h-4 mr-2" />
                İlk Formu Oluştur
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PageBody>
  )
}
