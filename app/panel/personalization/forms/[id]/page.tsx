"use client"

import { useEffect, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { personalizationService, PersonalizationForm, CreatePersonalizationFieldDto, UpdatePersonalizationFieldDto, PersonalizationField } from "@/services/personalization.service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2, Plus, Edit, Trash2, CheckCircle } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { PageBody } from "@/components/layout/PageBody"
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { useForm, Controller } from "react-hook-form"

export default function PersonalizationFormDetailPage() {
  const router = useRouter()
  const params = useParams()
  const formId = params.id as string
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Don't fetch if id is "new" - redirect handled by Next.js routing
  const { data: form, isLoading } = useQuery({
    queryKey: ["personalization-form", formId],
    queryFn: () => personalizationService.getForm(formId),
    enabled: formId !== "new" && !!formId, // Don't fetch if id is "new"
  })

  const createVersionMutation = useMutation({
    mutationFn: () => personalizationService.createVersion(formId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personalization-form", formId] })
      toast({
        title: "Başarılı",
        description: "Yeni versiyon oluşturuldu",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.response?.data?.message || "Versiyon oluşturulamadı",
        variant: "destructive",
      })
    },
  })

  const publishVersionMutation = useMutation({
    mutationFn: (versionId: string) => personalizationService.publishVersion(versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personalization-form", formId] })
      toast({
        title: "Başarılı",
        description: "Versiyon yayınlandı",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.response?.data?.message || "Versiyon yayınlanamadı",
        variant: "destructive",
      })
    },
  })

  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false)
  const [isConditionDialogOpen, setIsConditionDialogOpen] = useState(false)
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null)

  const fieldForm = useForm<CreatePersonalizationFieldDto>({
    defaultValues: {
      formId: formId,
      key: "",
      title: "",
      subtitle: "",
      helperText: "",
      required: false,
      type: "TEXT",
      orderIndex: 0,
      config: {},
      validationRules: {},
      pricingRules: {},
    },
  })

  const selectedFieldType = fieldForm.watch("type")

  const createFieldMutation = useMutation({
    mutationFn: (data: CreatePersonalizationFieldDto) => personalizationService.createField(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personalization-form", formId] })
      toast({
        title: "Başarılı",
        description: "Alan başarıyla eklendi",
      })
      setIsFieldDialogOpen(false)
      fieldForm.reset()
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.response?.data?.message || "Alan eklenemedi",
        variant: "destructive",
      })
    },
  })

  const updateFieldMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePersonalizationFieldDto }) =>
      personalizationService.updateField(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personalization-form", formId] })
      toast({
        title: "Başarılı",
        description: "Alan başarıyla güncellendi",
      })
      setIsFieldDialogOpen(false)
      setEditingFieldId(null)
      fieldForm.reset()
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.response?.data?.message || "Alan güncellenemedi",
        variant: "destructive",
      })
    },
  })

  const deleteFieldMutation = useMutation({
    mutationFn: (id: string) => personalizationService.deleteField(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personalization-form", formId] })
      toast({
        title: "Başarılı",
        description: "Alan başarıyla silindi",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.response?.data?.message || "Alan silinemedi",
        variant: "destructive",
      })
    },
  })

  const [conditionFormData, setConditionFormData] = useState<{
    fieldKey: string
    operator: string
    value: any
    action: string
    targetFieldKeys: string[]
  }>({
    fieldKey: "",
    operator: "eq",
    value: "",
    action: "SHOW",
    targetFieldKeys: [],
  })

  const createConditionMutation = useMutation({
    mutationFn: (data: any) => personalizationService.createCondition(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personalization-form", formId] })
      toast({
        title: "Başarılı",
        description: "Koşul başarıyla eklendi",
      })
      setIsConditionDialogOpen(false)
      setConditionFormData({
        fieldKey: "",
        operator: "eq",
        value: "",
        action: "SHOW",
        targetFieldKeys: [],
      })
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.response?.data?.message || "Koşul eklenemedi",
        variant: "destructive",
      })
    },
  })

  const onConditionSubmit = () => {
    if (!conditionFormData.fieldKey) {
      toast({
        title: "Hata",
        description: "Alan seçimi gereklidir",
        variant: "destructive",
      })
      return
    }

    if (conditionFormData.operator !== "filled" && !conditionFormData.value) {
      toast({
        title: "Hata",
        description: "Değer gereklidir",
        variant: "destructive",
      })
      return
    }

    if (conditionFormData.targetFieldKeys.length === 0) {
      toast({
        title: "Hata",
        description: "En az bir hedef alan seçilmelidir",
        variant: "destructive",
      })
      return
    }

    const ifJson = {
      fieldKey: conditionFormData.fieldKey,
      operator: conditionFormData.operator,
      value: conditionFormData.operator === "filled" ? null : conditionFormData.value,
    }

    const thenJson = {
      action: conditionFormData.action,
      targetFieldKeys: conditionFormData.targetFieldKeys,
    }

    createConditionMutation.mutate({
      formId: formId,
      ifJson,
      thenJson,
      orderIndex: (form?.conditions?.length || 0) + 1,
    })
  }

  const operatorLabels: Record<string, string> = {
    eq: "Eşittir",
    neq: "Eşit Değildir",
    in: "İçinde",
    filled: "Dolu",
    contains: "İçerir",
  }

  const actionLabels: Record<string, string> = {
    SHOW: "Göster",
    HIDE: "Gizle",
    REQUIRE: "Zorunlu Yap",
  }

  const deleteConditionMutation = useMutation({
    mutationFn: (id: string) => personalizationService.deleteCondition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personalization-form", formId] })
      toast({
        title: "Başarılı",
        description: "Koşul başarıyla silindi",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.response?.data?.message || "Koşul silinemedi",
        variant: "destructive",
      })
    },
  })

  const fieldTypes = [
    "TEXT",
    "TEXTAREA",
    "NUMBER",
    "EMAIL",
    "PHONE",
    "SELECT",
    "MULTISELECT",
    "RADIO",
    "CHECKBOX",
    "TOGGLE",
    "IMAGE_PICKER_SINGLE",
    "IMAGE_PICKER_MULTI",
    "FILE_UPLOAD_SINGLE",
    "FILE_UPLOAD_MULTI",
    "COLOR_PICKER",
    "DATE",
    "TIME",
    "RANGE_SLIDER",
    "DIMENSIONS",
  ]

  const fieldTypeLabels: Record<string, string> = {
    TEXT: "Metin",
    TEXTAREA: "Çok Satırlı Metin",
    NUMBER: "Sayı",
    EMAIL: "E-posta",
    PHONE: "Telefon",
    SELECT: "Seçim Listesi",
    MULTISELECT: "Çoklu Seçim",
    RADIO: "Radyo Buton",
    CHECKBOX: "Onay Kutusu",
    TOGGLE: "Açma/Kapama",
    IMAGE_PICKER_SINGLE: "Tek Resim Seçici",
    IMAGE_PICKER_MULTI: "Çoklu Resim Seçici",
    FILE_UPLOAD_SINGLE: "Tek Dosya Yükleme",
    FILE_UPLOAD_MULTI: "Çoklu Dosya Yükleme",
    COLOR_PICKER: "Renk Seçici",
    DATE: "Tarih",
    TIME: "Saat",
    RANGE_SLIDER: "Aralık Kaydırıcı",
    DIMENSIONS: "Boyutlar",
  }

  const onFieldSubmit = (data: CreatePersonalizationFieldDto | UpdatePersonalizationFieldDto) => {
    // Clean up empty config values
    const cleanedData = {
      ...data,
      formId: editingFieldId ? undefined : formId, // Update'te formId göndermeyiz
      config: data.config || {},
      validationRules: data.validationRules || {},
      pricingRules: data.pricingRules || {},
    }

    // Remove empty config properties
    if (cleanedData.config && Object.keys(cleanedData.config).length === 0) {
      cleanedData.config = undefined
    }
    if (cleanedData.validationRules && Object.keys(cleanedData.validationRules).length === 0) {
      cleanedData.validationRules = undefined
    }
    if (cleanedData.pricingRules && Object.keys(cleanedData.pricingRules).length === 0) {
      cleanedData.pricingRules = undefined
    }

    if (editingFieldId) {
      // Update mode
      const updateData: UpdatePersonalizationFieldDto = {
        key: cleanedData.key,
        title: cleanedData.title,
        subtitle: cleanedData.subtitle,
        helperText: cleanedData.helperText,
        required: cleanedData.required,
        type: cleanedData.type,
        defaultValue: cleanedData.defaultValue,
        validationRules: cleanedData.validationRules,
        pricingRules: cleanedData.pricingRules,
        config: cleanedData.config,
        orderIndex: cleanedData.orderIndex,
      }
      updateFieldMutation.mutate({ id: editingFieldId, data: updateData })
    } else {
      // Create mode
      createFieldMutation.mutate(cleanedData as CreatePersonalizationFieldDto)
    }
  }

  const handleEditField = (field: PersonalizationField) => {
    setEditingFieldId(field.id)
    fieldForm.reset({
      formId: formId,
      key: field.key,
      title: field.title,
      subtitle: field.subtitle || "",
      helperText: field.helperText || "",
      required: field.required,
      type: field.type,
      orderIndex: field.orderIndex,
      config: field.config || {},
      validationRules: field.validationRules || {},
      pricingRules: field.pricingRules || {},
    })
    setIsFieldDialogOpen(true)
  }

  const handleCloseFieldDialog = (open: boolean) => {
    if (!open) {
      setIsFieldDialogOpen(false)
      setEditingFieldId(null)
      fieldForm.reset()
    }
  }

  // Redirect if id is "new"
  if (formId === "new") {
    router.replace("/panel/personalization/forms/new")
    return null
  }

  if (isLoading) {
    return (
      <PageBody>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageBody>
    )
  }

  if (!form) {
    return (
      <PageBody>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Form bulunamadı</p>
          </CardContent>
        </Card>
      </PageBody>
    )
  }

  const publishedVersion = form.currentPublishedVersion
  const draftVersions = form.versions?.filter((v) => v.status === "DRAFT") || []
  const archivedVersions = form.versions?.filter((v) => v.status === "ARCHIVED") || []

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
              <h1 className="text-2xl font-bold text-foreground">{form.title}</h1>
              {form.subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{form.subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {form.isActive ? (
              <Badge variant="default">Aktif</Badge>
            ) : (
              <Badge variant="secondary">Pasif</Badge>
            )}
            {publishedVersion && (
              <Badge variant="outline">
                Yayında: v{publishedVersion.version}
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {form.description && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{form.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="fields" className="w-full">
          <TabsList>
            <TabsTrigger value="fields">Alanlar ({form.fields?.length || 0})</TabsTrigger>
            <TabsTrigger value="conditions">
              Koşullar ({form.conditions?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="versions">
              Versiyonlar ({form.versions?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fields" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Form Alanları</CardTitle>
                    <CardDescription>
                      Form için alanları ekleyin ve düzenleyin
                    </CardDescription>
                  </div>
                  <Dialog open={isFieldDialogOpen} onOpenChange={handleCloseFieldDialog}>
                    <Button 
                      size="sm"
                      onClick={() => {
                        setEditingFieldId(null)
                        fieldForm.reset({
                          formId: formId,
                          key: "",
                          title: "",
                          subtitle: "",
                          helperText: "",
                          required: false,
                          type: "TEXT",
                          orderIndex: (form?.fields?.length || 0) + 1,
                          config: {},
                          validationRules: {},
                          pricingRules: {},
                        })
                        setIsFieldDialogOpen(true)
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Alan Ekle
                    </Button>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingFieldId ? "Alan Düzenle" : "Yeni Alan Ekle"}
                        </DialogTitle>
                        <DialogDescription>
                          {editingFieldId
                            ? "Form alanını düzenleyin"
                            : "Form için yeni bir alan ekleyin"}
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={fieldForm.handleSubmit(onFieldSubmit)} className="space-y-4">
                        <div>
                          <Label htmlFor="field-key">
                            Alan Key <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="field-key"
                            {...fieldForm.register("key", { required: "Alan key gereklidir" })}
                            placeholder="ornek: customer_name"
                            className="mt-1"
                            disabled={!!editingFieldId}
                          />
                          {fieldForm.formState.errors.key && (
                            <p className="text-sm text-red-600 mt-1">{fieldForm.formState.errors.key.message}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {editingFieldId
                              ? "Alan key düzenlenemez (form içinde benzersiz olmalıdır)"
                              : "Form içinde benzersiz olmalıdır (örn: customer_name)"}
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="field-title">
                            Alan Başlığı <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="field-title"
                            {...fieldForm.register("title", { required: "Alan başlığı gereklidir" })}
                            placeholder="Örn: Müşteri Adı"
                            className="mt-1"
                          />
                          {fieldForm.formState.errors.title && (
                            <p className="text-sm text-red-600 mt-1">{fieldForm.formState.errors.title.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="field-subtitle">Alt Başlık</Label>
                          <Input
                            id="field-subtitle"
                            {...fieldForm.register("subtitle")}
                            placeholder="Örn: Lambanızda görünecek isim"
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="field-type">
                            Alan Tipi <span className="text-red-500">*</span>
                          </Label>
                          <Controller
                            name="type"
                            control={fieldForm.control}
                            rules={{ required: "Alan tipi gereklidir" }}
                            render={({ field }) => (
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Alan tipi seçin" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                  {fieldTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {fieldTypeLabels[type] || type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {fieldForm.formState.errors.type && (
                            <p className="text-sm text-red-600 mt-1">{fieldForm.formState.errors.type.message}</p>
                          )}
                        </div>

                        <div>
                          <Label htmlFor="field-helperText">Yardımcı Metin</Label>
                          <Textarea
                            id="field-helperText"
                            {...fieldForm.register("helperText")}
                            placeholder="Kullanıcıya gösterilecek yardımcı metin"
                            className="mt-1"
                            rows={2}
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Controller
                            name="required"
                            control={fieldForm.control}
                            render={({ field: { value, onChange } }) => (
                              <input
                                type="checkbox"
                                id="field-required"
                                checked={value || false}
                                onChange={(e) => onChange(e.target.checked)}
                                className="w-4 h-4 rounded border-border"
                              />
                            )}
                          />
                          <Label htmlFor="field-required" className="cursor-pointer">
                            Zorunlu Alan
                          </Label>
                        </div>

                        {/* Field Type Specific Configurations */}
                        {(selectedFieldType === "SELECT" ||
                          selectedFieldType === "MULTISELECT" ||
                          selectedFieldType === "RADIO" ||
                          selectedFieldType === "CHECKBOX") && (
                            <div className="space-y-2 p-4 border rounded-lg bg-muted/50">
                              <Label className="text-sm font-semibold">Seçenekler</Label>
                              <p className="text-xs text-muted-foreground mb-2">
                                Her satıra bir seçenek yazın
                              </p>
                              <Controller
                                name="config.options"
                                control={fieldForm.control}
                                render={({ field }) => {
                                  const options = Array.isArray(field.value) ? field.value : []
                                  return (
                                    <div className="space-y-2">
                                      {options.map((option: string, index: number) => (
                                        <div key={index} className="flex items-center gap-2">
                                          <Input
                                            value={option}
                                            onChange={(e) => {
                                              const newOptions = [...options]
                                              newOptions[index] = e.target.value
                                              field.onChange(newOptions)
                                            }}
                                            placeholder={`Seçenek ${index + 1}`}
                                          />
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              const newOptions = options.filter(
                                                (_: string, i: number) => i !== index,
                                              )
                                              field.onChange(newOptions)
                                            }}
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      ))}
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          field.onChange([...options, ""])
                                        }}
                                      >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Seçenek Ekle
                                      </Button>
                                    </div>
                                  )
                                }}
                              />
                            </div>
                          )}

                        {(selectedFieldType === "NUMBER" || selectedFieldType === "RANGE_SLIDER") && (
                          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                            <Label className="text-sm font-semibold">Sayı Ayarları</Label>
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <Label htmlFor="config-min" className="text-xs">
                                  Minimum Değer
                                </Label>
                                <Input
                                  id="config-min"
                                  type="number"
                                  {...fieldForm.register("config.min", {
                                    valueAsNumber: true,
                                  })}
                                  placeholder="Min"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="config-max" className="text-xs">
                                  Maksimum Değer
                                </Label>
                                <Input
                                  id="config-max"
                                  type="number"
                                  {...fieldForm.register("config.max", {
                                    valueAsNumber: true,
                                  })}
                                  placeholder="Max"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="config-step" className="text-xs">
                                  Adım
                                </Label>
                                <Input
                                  id="config-step"
                                  type="number"
                                  {...fieldForm.register("config.step", {
                                    valueAsNumber: true,
                                  })}
                                  placeholder="1"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {(selectedFieldType === "TEXT" || selectedFieldType === "TEXTAREA") && (
                          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                            <Label className="text-sm font-semibold">Metin Ayarları</Label>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="validation-minLength" className="text-xs">
                                  Minimum Karakter
                                </Label>
                                <Input
                                  id="validation-minLength"
                                  type="number"
                                  {...fieldForm.register("validationRules.minLength", {
                                    valueAsNumber: true,
                                  })}
                                  placeholder="Min"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="validation-maxLength" className="text-xs">
                                  Maksimum Karakter
                                </Label>
                                <Input
                                  id="validation-maxLength"
                                  type="number"
                                  {...fieldForm.register("validationRules.maxLength", {
                                    valueAsNumber: true,
                                  })}
                                  placeholder="Max"
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {(selectedFieldType === "FILE_UPLOAD_SINGLE" ||
                          selectedFieldType === "FILE_UPLOAD_MULTI" ||
                          selectedFieldType === "IMAGE_PICKER_SINGLE" ||
                          selectedFieldType === "IMAGE_PICKER_MULTI") && (
                            <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                              <Label className="text-sm font-semibold">Dosya Ayarları</Label>
                              <div>
                                <Label htmlFor="config-allowedMimeTypes" className="text-xs">
                                  İzin Verilen Dosya Tipleri (virgülle ayırın)
                                </Label>
                                <Input
                                  id="config-allowedMimeTypes"
                                  {...fieldForm.register("config.allowedMimeTypes")}
                                  placeholder="image/jpeg, image/png, application/pdf"
                                  className="mt-1"
                                  onChange={(e) => {
                                    const value = e.target.value
                                    const types = value
                                      .split(",")
                                      .map((t) => t.trim())
                                      .filter((t) => t)
                                    fieldForm.setValue("config.allowedMimeTypes", types)
                                  }}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                  Örnek: image/jpeg, image/png, application/pdf
                                </p>
                              </div>
                              <div>
                                <Label htmlFor="config-maxFileSize" className="text-xs">
                                  Maksimum Dosya Boyutu (MB)
                                </Label>
                                <Input
                                  id="config-maxFileSize"
                                  type="number"
                                  {...fieldForm.register("config.maxFileSize", {
                                    valueAsNumber: true,
                                  })}
                                  placeholder="10"
                                  className="mt-1"
                                />
                              </div>
                              {(selectedFieldType === "FILE_UPLOAD_MULTI" ||
                                selectedFieldType === "IMAGE_PICKER_MULTI") && (
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label htmlFor="config-minFileCount" className="text-xs">
                                        Minimum Dosya Sayısı
                                      </Label>
                                      <Input
                                        id="config-minFileCount"
                                        type="number"
                                        {...fieldForm.register("config.minFileCount", {
                                          valueAsNumber: true,
                                        })}
                                        placeholder="1"
                                        min="0"
                                        className="mt-1"
                                      />
                                      <p className="text-xs text-muted-foreground mt-1">
                                        En az kaç dosya seçilmeli
                                      </p>
                                    </div>
                                    <div>
                                      <Label htmlFor="config-maxFileCount" className="text-xs">
                                        Maksimum Dosya Sayısı
                                      </Label>
                                      <Input
                                        id="config-maxFileCount"
                                        type="number"
                                        {...fieldForm.register("config.maxFileCount", {
                                          valueAsNumber: true,
                                        })}
                                        placeholder="10"
                                        min="1"
                                        className="mt-1"
                                      />
                                      <p className="text-xs text-muted-foreground mt-1">
                                        En fazla kaç dosya seçilebilir
                                      </p>
                                    </div>
                                  </div>
                                )}
                            </div>
                          )}

                        {selectedFieldType === "DIMENSIONS" && (
                          <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                            <Label className="text-sm font-semibold">Boyut Ayarları</Label>
                            <div>
                              <Label htmlFor="config-units" className="text-xs">
                                Birimler (virgülle ayırın)
                              </Label>
                              <Input
                                id="config-units"
                                {...fieldForm.register("config.units")}
                                placeholder="cm, inch, m"
                                className="mt-1"
                                onChange={(e) => {
                                  const value = e.target.value
                                  const units = value
                                    .split(",")
                                    .map((u) => u.trim())
                                    .filter((u) => u)
                                  fieldForm.setValue("config.units", units)
                                }}
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Örnek: cm, inch, m
                              </p>
                            </div>
                          </div>
                        )}

                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCloseFieldDialog}
                          >
                            İptal
                          </Button>
                          <Button
                            type="submit"
                            disabled={createFieldMutation.isPending || updateFieldMutation.isPending}
                          >
                            {(createFieldMutation.isPending || updateFieldMutation.isPending) ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {editingFieldId ? "Güncelleniyor..." : "Ekleniyor..."}
                              </>
                            ) : (
                              editingFieldId ? "Alanı Güncelle" : "Alan Ekle"
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {form.fields && form.fields.length > 0 ? (
                  <div className="space-y-2">
                    {form.fields.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{field.title}</span>
                            <Badge variant="outline">{field.type}</Badge>
                            {field.required && (
                              <Badge variant="destructive">Zorunlu</Badge>
                            )}
                          </div>
                          {field.subtitle && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {field.subtitle}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditField(field)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Bu alanı silmek istediğinize emin misiniz?")) {
                                deleteFieldMutation.mutate(field.id)
                              }
                            }}
                            disabled={deleteFieldMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Henüz alan eklenmemiş
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conditions" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Koşullar</CardTitle>
                    <CardDescription>
                      Form için koşullu mantık kuralları ekleyin
                    </CardDescription>
                  </div>
                  <Dialog open={isConditionDialogOpen} onOpenChange={setIsConditionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Koşul Ekle
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Yeni Koşul Ekle</DialogTitle>
                        <DialogDescription>
                          Form için koşullu mantık kuralı ekleyin
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6">
                        {/* Eğer Kısmı */}
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                          <Label className="text-sm font-semibold">Eğer (Koşul)</Label>

                          <div>
                            <Label htmlFor="condition-field" className="text-xs">
                              Alan <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={conditionFormData.fieldKey}
                              onValueChange={(value) =>
                                setConditionFormData({ ...conditionFormData, fieldKey: value })
                              }
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Alan seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                {form.fields?.map((field) => (
                                  <SelectItem key={field.id} value={field.key}>
                                    {field.title} ({field.key})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="condition-operator" className="text-xs">
                              Operatör <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={conditionFormData.operator}
                              onValueChange={(value) =>
                                setConditionFormData({ ...conditionFormData, operator: value })
                              }
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Operatör seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="eq">{operatorLabels.eq}</SelectItem>
                                <SelectItem value="neq">{operatorLabels.neq}</SelectItem>
                                <SelectItem value="in">{operatorLabels.in}</SelectItem>
                                <SelectItem value="filled">{operatorLabels.filled}</SelectItem>
                                <SelectItem value="contains">{operatorLabels.contains}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {conditionFormData.operator !== "filled" && (
                            <div>
                              <Label htmlFor="condition-value" className="text-xs">
                                Değer <span className="text-red-500">*</span>
                              </Label>
                              {conditionFormData.operator === "in" ? (
                                <Textarea
                                  id="condition-value"
                                  value={Array.isArray(conditionFormData.value) ? conditionFormData.value.join("\n") : conditionFormData.value}
                                  onChange={(e) => {
                                    const lines = e.target.value.split("\n").filter((l) => l.trim())
                                    setConditionFormData({
                                      ...conditionFormData,
                                      value: lines,
                                    })
                                  }}
                                  placeholder="Her satıra bir değer yazın"
                                  className="mt-1"
                                  rows={3}
                                />
                              ) : (
                                <Input
                                  id="condition-value"
                                  value={conditionFormData.value || ""}
                                  onChange={(e) =>
                                    setConditionFormData({
                                      ...conditionFormData,
                                      value: e.target.value,
                                    })
                                  }
                                  placeholder="Değer girin"
                                  className="mt-1"
                                />
                              )}
                              {conditionFormData.operator === "in" && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Her satıra bir değer yazın (virgülle ayrılmış liste)
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* O zaman Kısmı */}
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                          <Label className="text-sm font-semibold">O zaman (Aksiyon)</Label>

                          <div>
                            <Label htmlFor="condition-action" className="text-xs">
                              Aksiyon <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              value={conditionFormData.action}
                              onValueChange={(value) =>
                                setConditionFormData({ ...conditionFormData, action: value })
                              }
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Aksiyon seçin" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="SHOW">{actionLabels.SHOW}</SelectItem>
                                <SelectItem value="HIDE">{actionLabels.HIDE}</SelectItem>
                                <SelectItem value="REQUIRE">{actionLabels.REQUIRE}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label htmlFor="condition-targets" className="text-xs">
                              Hedef Alanlar <span className="text-red-500">*</span>
                            </Label>
                            <div className="mt-1 space-y-2 max-h-48 overflow-y-auto border rounded p-2">
                              {form.fields
                                ?.filter((field) => field.key !== conditionFormData.fieldKey)
                                .map((field) => (
                                  <div key={field.id} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`target-${field.id}`}
                                      checked={conditionFormData.targetFieldKeys.includes(field.key)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setConditionFormData({
                                            ...conditionFormData,
                                            targetFieldKeys: [
                                              ...conditionFormData.targetFieldKeys,
                                              field.key,
                                            ],
                                          })
                                        } else {
                                          setConditionFormData({
                                            ...conditionFormData,
                                            targetFieldKeys: conditionFormData.targetFieldKeys.filter(
                                              (k) => k !== field.key,
                                            ),
                                          })
                                        }
                                      }}
                                      className="w-4 h-4 rounded border-border"
                                    />
                                    <Label
                                      htmlFor={`target-${field.id}`}
                                      className="text-sm cursor-pointer"
                                    >
                                      {field.title} ({field.key})
                                    </Label>
                                  </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Koşul sağlandığında etkilenecek alanları seçin
                            </p>
                          </div>
                        </div>

                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsConditionDialogOpen(false)
                              setConditionFormData({
                                fieldKey: "",
                                operator: "eq",
                                value: "",
                                action: "SHOW",
                                targetFieldKeys: [],
                              })
                            }}
                          >
                            İptal
                          </Button>
                          <Button
                            type="button"
                            onClick={onConditionSubmit}
                            disabled={createConditionMutation.isPending}
                          >
                            {createConditionMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Ekleniyor...
                              </>
                            ) : (
                              "Koşul Ekle"
                            )}
                          </Button>
                        </DialogFooter>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {form.conditions && form.conditions.length > 0 ? (
                  <div className="space-y-2">
                    {form.conditions.map((condition) => (
                      <div
                        key={condition.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="text-sm">
                            <span className="font-medium">Eğer:</span>{" "}
                            <span className="text-muted-foreground">
                              {(() => {
                                const field = form.fields?.find((f) => f.key === condition.ifJson?.fieldKey)
                                const fieldName = field?.title || condition.ifJson?.fieldKey || "Bilinmeyen Alan"
                                const operator = operatorLabels[condition.ifJson?.operator] || condition.ifJson?.operator
                                const value = condition.ifJson?.operator === "filled"
                                  ? ""
                                  : Array.isArray(condition.ifJson?.value)
                                    ? condition.ifJson.value.join(", ")
                                    : condition.ifJson?.value
                                return `${fieldName} ${operator}${value ? ` "${value}"` : ""}`
                              })()}
                            </span>
                          </div>
                          <div className="text-sm mt-1">
                            <span className="font-medium">O zaman:</span>{" "}
                            <span className="text-muted-foreground">
                              {(() => {
                                const action = actionLabels[condition.thenJson?.action] || condition.thenJson?.action
                                const targetFields = condition.thenJson?.targetFieldKeys
                                  ?.map((key: string) => {
                                    const field = form.fields?.find((f) => f.key === key)
                                    return field?.title || key
                                  })
                                  .join(", ") || "Bilinmeyen Alanlar"
                                return `${action}: ${targetFields}`
                              })()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Bu koşulu silmek istediğinize emin misiniz?")) {
                                deleteConditionMutation.mutate(condition.id)
                              }
                            }}
                            disabled={deleteConditionMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Henüz koşul eklenmemiş
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="versions" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Versiyonlar</CardTitle>
                    <CardDescription>
                      Form versiyonlarını yönetin ve yayınlayın
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => createVersionMutation.mutate()}
                    disabled={createVersionMutation.isPending}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Versiyon
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Published Version */}
                  {publishedVersion && (
                    <div className="p-4 border rounded-lg bg-green-50 ">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              Versiyon {publishedVersion.version}
                            </span>
                            <Badge variant="default">Yayında</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(publishedVersion.createdAt), "PPpp", {
                              locale: tr,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Draft Versions */}
                  {draftVersions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Taslak Versiyonlar</h3>
                      {draftVersions.map((version) => (
                        <div
                          key={version.id}
                          className="p-4 border rounded-lg mb-2"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  Versiyon {version.version}
                                </span>
                                <Badge variant="secondary">Taslak</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {format(new Date(version.createdAt), "PPpp", {
                                  locale: tr,
                                })}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => publishVersionMutation.mutate(version.id)}
                              disabled={publishVersionMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Yayınla
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Archived Versions */}
                  {archivedVersions.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Arşivlenmiş Versiyonlar</h3>
                      {archivedVersions.map((version) => (
                        <div
                          key={version.id}
                          className="p-4 border rounded-lg mb-2 opacity-60"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  Versiyon {version.version}
                                </span>
                                <Badge variant="outline">Arşivlendi</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {format(new Date(version.createdAt), "PPpp", {
                                  locale: tr,
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!publishedVersion && draftVersions.length === 0 && archivedVersions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Henüz versiyon oluşturulmamış
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageBody>
  )
}
