"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import TurndownService from "turndown"
import { marked } from "marked"
import { Button } from "@/components/ui/button"
import { Stepper, StepContent } from "@/components/ui/stepper"
import {
    productService,
    Product,
    ProductType,
    CreateProductDto,
    UpdateProductDto,
} from "@/services/product.service"
import { categoryService, Category } from "@/services/category.service"
import { tagService, Tag } from "@/services/tag.service"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ArrowLeft, ChevronRight, ChevronLeft } from "lucide-react"
import { ProductTypeStep } from "./steps/ProductTypeStep"
import { BasicInfoStep } from "./steps/BasicInfoStep"
import { PricingStep } from "./steps/PricingStep"
import { CategoriesTagsStep } from "./steps/CategoriesTagsStep"
import { SEOStep } from "./steps/SEOStep"
import { GalleryStep } from "./steps/GalleryStep"
import { StockStep } from "./steps/StockStep"
import { SummaryStep } from "./steps/SummaryStep"
import { VariantsStep } from "./steps/VariantsStep"
import { VariantCombinationsStep } from "./steps/VariantCombinationsStep"

const productSchema = z.object({
    type: z.enum(["SIMPLE", "VARIANT", "BUNDLE"]),
    name: z.string().min(1, "Ürün adı gereklidir"),
    description: z.string().min(1, "Ürün açıklaması gereklidir"),
    basePrice: z.number().min(0, "Fiyat 0'dan büyük olmalıdır"),
    sku: z.string().optional(),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    isOnSale: z.boolean().default(false),
    discountPercent: z.number().min(0).max(100).nullable().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoKeywords: z.string().optional(),
    categoryIds: z.array(z.string()).default([]),
    tagIds: z.array(z.string()).default([]),
}).refine(
    (data) => {
        // Eğer isOnSale true ise discountPercent olmalı
        if (data.isOnSale && (!data.discountPercent || data.discountPercent <= 0)) {
            return false
        }
        return true
    },
    {
        message: "İndirimde ürünler için indirim yüzdesi gereklidir",
        path: ["discountPercent"],
    }
)

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
    product?: Product | null
}

// Tüm olası adımlar
const ALL_STEPS = {
    type: {
        id: "type",
        title: "Ürün Tipi",
        description: "Ürün tipini seçin",
        applicableTypes: ["SIMPLE", "VARIANT", "BUNDLE"] as ProductType[],
    },
    basic: {
        id: "basic",
        title: "Temel Bilgiler",
        description: "Ürün bilgilerini girin",
        applicableTypes: ["SIMPLE", "VARIANT", "BUNDLE"] as ProductType[],
    },
    variants: {
        id: "variants",
        title: "Varyasyon Ayarları",
        description: "Varyasyon seçeneklerini ve değerlerini ayarlayın",
        applicableTypes: ["VARIANT"] as ProductType[],
    },
    variantCombinations: {
        id: "variantCombinations",
        title: "Varyasyon Kombinasyonları",
        description: "Varyasyon kombinasyonlarını oluşturun",
        applicableTypes: ["VARIANT"] as ProductType[],
    },
    pricing: {
        id: "pricing",
        title: "Fiyatlandırma",
        description: "Ürün fiyatlandırma bilgilerini girin",
        applicableTypes: ["SIMPLE", "VARIANT"] as ProductType[],
    },
    categories: {
        id: "categories",
        title: "Kategoriler & Tag'ler",
        description: "Kategorileri ve tag'leri seçin",
        applicableTypes: ["SIMPLE", "VARIANT", "BUNDLE"] as ProductType[],
    },
    seo: {
        id: "seo",
        title: "SEO Ayarları",
        description: "SEO bilgilerini girin",
        applicableTypes: ["SIMPLE", "VARIANT", "BUNDLE"] as ProductType[],
    },
    gallery: {
        id: "gallery",
        title: "Resimler",
        description: "Ürün resimlerini yükleyin",
        applicableTypes: ["SIMPLE", "VARIANT", "BUNDLE"] as ProductType[],
    },
    stock: {
        id: "stock",
        title: "Stok Yönetimi",
        description: "Stok bilgilerini ayarlayın",
        applicableTypes: ["SIMPLE", "VARIANT"] as ProductType[],
    },
    summary: {
        id: "summary",
        title: "Özet",
        description: "Ürün bilgilerini gözden geçirin",
        applicableTypes: ["SIMPLE", "VARIANT", "BUNDLE"] as ProductType[],
    },
} as const

// Ürün tipine göre adım sırası
const getStepsForProductType = (productType: ProductType | undefined) => {
    if (!productType) return []

    const steps = Object.values(ALL_STEPS).filter((step) =>
        step.applicableTypes.includes(productType)
    )

    // Adım sırasını belirle
    const stepOrder: (keyof typeof ALL_STEPS)[] = [
        "type",
        "basic",
        "variants",
        "variantCombinations",
        "pricing",
        "categories",
        "seo",
        "gallery",
        "stock",
        "summary",
    ]

    return stepOrder
        .filter((stepId) => {
            const step = ALL_STEPS[stepId]
            return step && step.applicableTypes.includes(productType)
        })
        .map((stepId) => ALL_STEPS[stepId])
}

export function ProductForm({ product }: ProductFormProps) {
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [createdProductId, setCreatedProductId] = useState<string | null>(null)
    const [isGalleryValid, setIsGalleryValid] = useState(false)

    // Turndown service for HTML to Markdown conversion
    const turndownService = new TurndownService({
        headingStyle: "atx",
        codeBlockStyle: "fenced",
    })

    // HTML description state for rich text editor
    const [htmlDescription, setHtmlDescription] = useState("")

    // Kategorileri ve tag'leri getir
    const { data: categories = [] } = useQuery({
        queryKey: ["categories"],
        queryFn: () => categoryService.getAll(),
    })

    // Hiyerarşik kategori tree'yi getir
    const { data: categoryTree = [] } = useQuery({
        queryKey: ["categories", "tree"],
        queryFn: () => categoryService.getTree(),
    })

    const { data: tags = [] } = useQuery({
        queryKey: ["tags"],
        queryFn: () => tagService.getAll(),
    })

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        reset,
        setValue,
        watch,
        trigger,
    } = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            type: "SIMPLE",
            name: "",
            description: "",
            basePrice: 0,
            sku: "",
            isActive: true,
            isFeatured: false,
            isOnSale: false,
            discountPercent: null,
            seoTitle: "",
            seoDescription: "",
            seoKeywords: "",
            categoryIds: [],
            tagIds: [],
        },
        mode: "onChange",
    })

    // Ürün tipine göre adımları al
    const productType = watch("type") || product?.type
    const STEPS = getStepsForProductType(productType)

    // Ürün tipi değiştiğinde adımı sıfırla
    useEffect(() => {
        if (productType && !product) {
            // Yeni ürün oluştururken tip değiştiğinde adımı sıfırla
            setCurrentStep(0)
        }
    }, [productType, product])

    const isOnSale = watch("isOnSale")
    const categoryIds = watch("categoryIds")
    const tagIds = watch("tagIds")

    // Form'u ürün verisi ile doldur (düzenleme modu)
    useEffect(() => {
        if (product) {
            // Markdown'ı HTML'e çevir (rich text editor için)
            const descriptionHtml = product.description
                ? marked.parse(product.description) as string
                : ""

            setHtmlDescription(descriptionHtml)
            reset({
                type: product.type,
                name: product.name,
                description: product.description || "",
                basePrice: product.basePrice,
                sku: product.sku || "",
                isActive: product.isActive,
                isFeatured: product.isFeatured,
                isOnSale: product.isOnSale,
                discountPercent: product.discountPercent,
                seoTitle: product.seoTitle || "",
                seoDescription: product.seoDescription || "",
                seoKeywords: product.seoKeywords?.join(", ") || "",
                categoryIds: product.categories?.map((c) => c.id) || [],
                tagIds: product.tags?.map((t) => t.id) || [],
            })
            setCreatedProductId(product.id)

            // Not: Gallery durumu ProductGalleryManager tarafından yönetiliyor
            // Burada sadece productId'yi set ediyoruz, gallery durumu
            // ProductGalleryManager'ın onSaveStatusChange callback'i ile güncellenecek
        } else {
            setHtmlDescription("")
        }
    }, [product, reset])

    // Ürün oluşturma mutation
    const createMutation = useMutation({
        mutationFn: (data: CreateProductDto) => productService.create(data),
        onSuccess: (createdProduct) => {
            setCreatedProductId(createdProduct.id)
            queryClient.invalidateQueries({ queryKey: ["products"] })
            toast({
                title: "Başarılı",
                description: "Ürün başarıyla oluşturuldu.",
            })
            // Bir sonraki adıma geç (normal sıra)
            setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1))
        },
        onError: (error: any) => {
            toast({
                title: "Hata",
                description: error.response?.data?.message || "Ürün oluşturulurken bir hata oluştu.",
                variant: "destructive",
            })
        },
    })

    // Ürün güncelleme mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateProductDto }) =>
            productService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] })
            queryClient.invalidateQueries({ queryKey: ["product", createdProductId || product?.id] })
            toast({
                title: "Başarılı",
                description: "Ürün başarıyla güncellendi.",
            })
            router.push("/panel/products")
        },
        onError: (error: any) => {
            toast({
                title: "Hata",
                description: error.response?.data?.message || "Ürün güncellenirken bir hata oluştu.",
                variant: "destructive",
            })
        },
    })

    // Category ve tag güncelleme için özel mutation (redirect yapmaz)
    const updateCategoriesTagsMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateProductDto }) =>
            productService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] })
            queryClient.invalidateQueries({ queryKey: ["product", createdProductId || product?.id] })
        },
        onError: (error: any) => {
            toast({
                title: "Hata",
                description: error.response?.data?.message || "Kategori ve tag'ler güncellenirken bir hata oluştu.",
                variant: "destructive",
            })
        },
    })

    // Adım validasyonu
    const validateStep = async (step: number): Promise<boolean> => {
        const stepData = STEPS[step]
        if (!stepData) return true

        switch (stepData.id) {
            case "type":
                return await trigger("type")
            case "basic":
                return await trigger(["name", "description"])
            case "variants":
                return true // Yakında eklenecek
            case "variantCombinations":
                return true // Yakında eklenecek
            case "pricing":
                return await trigger(["basePrice"])
            case "categories":
                return true // Opsiyonel
            case "seo":
                return true // Opsiyonel
            case "gallery":
                // Main image ve thumbnail image zorunlu
                if (!isGalleryValid) {
                    toast({
                        title: "Uyarı",
                        description: "Ana resim ve thumbnail resim zorunludur. Lütfen resimleri seçin.",
                        variant: "destructive",
                    })
                    return false
                }
                return true
            case "stock":
                // Stok adımı için ürün ID'si olmalı
                if (!createdProductId && !product?.id) {
                    toast({
                        title: "Uyarı",
                        description: "Stok bilgilerini girebilmek için önce ürünü oluşturmanız gerekiyor.",
                        variant: "destructive",
                    })
                    return false
                }
                return true // Opsiyonel
            case "summary":
                // Özet adımı için ürün ID'si olmalı
                if (!createdProductId && !product?.id) {
                    toast({
                        title: "Uyarı",
                        description: "Özet görüntülemek için önce ürünü oluşturmanız gerekiyor.",
                        variant: "destructive",
                    })
                    return false
                }
                return true // Opsiyonel
            default:
                return true
        }
    }

    // Sonraki adıma geç
    const handleNext = async () => {
        const isValid = await validateStep(currentStep)
        if (isValid) {
            const currentStepData = STEPS[currentStep]
            if (!currentStepData) return

            // Eğer temel bilgiler adımındaysak ve ürün henüz oluşturulmadıysa, önce ürünü oluştur
            if (currentStepData.id === "basic" && !createdProductId && !product) {
                await handleSaveProduct()
                // handleSaveProduct içinde createMutation onSuccess'te zaten bir sonraki adıma geçiliyor
            } else {
                const formData = watch()
                const productId = createdProductId || product?.id

                // Fiyatlandırma adımından sonra, ürünü güncelle
                if (currentStepData.id === "pricing" && productId) {
                    await updateCategoriesTagsMutation.mutateAsync({
                        id: productId,
                        data: {
                            basePrice: formData.basePrice,
                            isOnSale: formData.isOnSale,
                            // isOnSale true ise ve discountPercent geçerli bir sayı ise gönder
                            ...(formData.isOnSale &&
                                formData.discountPercent !== null &&
                                formData.discountPercent !== undefined &&
                                !isNaN(Number(formData.discountPercent)) &&
                                Number(formData.discountPercent) >= 0 &&
                                Number(formData.discountPercent) <= 100
                                ? { discountPercent: Number(formData.discountPercent) }
                                : {}),
                        },
                    })
                }

                // Category ve tag adımından sonra, ürünü güncelle
                if (currentStepData.id === "categories" && productId) {
                    await updateCategoriesTagsMutation.mutateAsync({
                        id: productId,
                        data: {
                            categoryIds: formData.categoryIds.length > 0 ? formData.categoryIds : [],
                            tagIds: formData.tagIds.length > 0 ? formData.tagIds : [],
                        },
                    })
                }

                // SEO adımından sonra, ürünü güncelle
                if (currentStepData.id === "seo" && productId) {
                    await updateCategoriesTagsMutation.mutateAsync({
                        id: productId,
                        data: {
                            seoTitle: formData.seoTitle || undefined,
                            seoDescription: formData.seoDescription || undefined,
                            seoKeywords: formData.seoKeywords
                                ? formData.seoKeywords.split(",").map((k) => k.trim()).filter(Boolean)
                                : undefined,
                        },
                    })
                }

                setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1))
            }
        }
    }

    // Önceki adıma dön
    const handlePrevious = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0))
    }

    // Ürünü kaydet (ara kayıt)
    const handleSaveProduct = async () => {
        const formData = watch()
        const markdownDescription = htmlDescription
            ? turndownService.turndown(htmlDescription)
            : ""

        const createData: CreateProductDto = {
            type: formData.type,
            name: formData.name,
            description: markdownDescription || formData.description,
            basePrice: formData.basePrice,
            sku: formData.sku || undefined,
            isActive: formData.isActive,
            isFeatured: formData.isFeatured,
            isOnSale: formData.isOnSale,
            // isOnSale true ise ve discountPercent geçerli bir sayı ise gönder
            ...(formData.isOnSale &&
                formData.discountPercent !== null &&
                formData.discountPercent !== undefined &&
                !isNaN(Number(formData.discountPercent)) &&
                Number(formData.discountPercent) >= 0 &&
                Number(formData.discountPercent) <= 100
                ? { discountPercent: Number(formData.discountPercent) }
                : {}),
            seoTitle: formData.seoTitle || undefined,
            seoDescription: formData.seoDescription || undefined,
            seoKeywords: formData.seoKeywords
                ? formData.seoKeywords.split(",").map((k) => k.trim()).filter(Boolean)
                : undefined,
            categoryIds: formData.categoryIds.length > 0 ? formData.categoryIds : undefined,
            tagIds: formData.tagIds.length > 0 ? formData.tagIds : undefined,
        }

        await createMutation.mutateAsync(createData)
    }

    // Final submit
    const onSubmit = async (data: ProductFormValues) => {
        setIsSubmitting(true)
        try {
            if (product || createdProductId) {
                // Update mode
                const markdownDescription = htmlDescription
                    ? turndownService.turndown(htmlDescription)
                    : ""

                const updateData: UpdateProductDto = {
                    type: data.type,
                    name: data.name,
                    description: markdownDescription || data.description,
                    basePrice: data.basePrice,
                    sku: data.sku || undefined,
                    isActive: data.isActive,
                    isFeatured: data.isFeatured,
                    isOnSale: data.isOnSale,
                    // isOnSale true ise ve discountPercent geçerli bir sayı ise gönder
                    ...(data.isOnSale &&
                        data.discountPercent !== null &&
                        data.discountPercent !== undefined &&
                        !isNaN(Number(data.discountPercent)) &&
                        Number(data.discountPercent) >= 0 &&
                        Number(data.discountPercent) <= 100
                        ? { discountPercent: Number(data.discountPercent) }
                        : {}),
                    seoTitle: data.seoTitle || undefined,
                    seoDescription: data.seoDescription || undefined,
                    seoKeywords: data.seoKeywords
                        ? data.seoKeywords.split(",").map((k) => k.trim()).filter(Boolean)
                        : undefined,
                    categoryIds: data.categoryIds.length > 0 ? data.categoryIds : undefined,
                    tagIds: data.tagIds.length > 0 ? data.tagIds : undefined,
                }
                await updateMutation.mutateAsync({
                    id: product?.id || createdProductId!,
                    data: updateData,
                })
            }
        } catch (error) {
            // Error handled in mutation
        } finally {
            setIsSubmitting(false)
        }
    }

    const toggleCategory = (categoryId: string) => {
        const current = categoryIds || []
        if (current.includes(categoryId)) {
            setValue("categoryIds", current.filter((id) => id !== categoryId))
        } else {
            setValue("categoryIds", [...current, categoryId])
        }
    }

    const toggleTag = (tagId: string) => {
        const current = tagIds || []
        if (current.includes(tagId)) {
            setValue("tagIds", current.filter((id) => id !== tagId))
        } else {
            setValue("tagIds", [...current, tagId])
        }
    }

    const renderStepContent = () => {
        const currentStepData = STEPS[currentStep]
        if (!currentStepData) return null

        switch (currentStepData.id) {
            case "type":
                return (
                    <ProductTypeStep
                        control={control}
                        errors={errors}
                        productType={productType}
                        isEditMode={!!product}
                    />
                )
            case "basic":
                return (
                    <BasicInfoStep
                        control={control}
                        register={register}
                        errors={errors}
                        htmlDescription={htmlDescription}
                        setHtmlDescription={setHtmlDescription}
                    />
                )
            case "variants":
                return (
                    <VariantsStep productId={createdProductId || product?.id} />
                )
            case "variantCombinations":
                return (
                    <VariantCombinationsStep
                        productId={createdProductId || product?.id}
                        productType={productType}
                    />
                )
            case "pricing":
                return (
                    <PricingStep
                        control={control}
                        register={register}
                        errors={errors}
                        isOnSale={isOnSale}
                        productType={productType}
                    />
                )
            case "categories":
                return (
                    <CategoriesTagsStep
                        categories={categories}
                        categoryTree={categoryTree}
                        tags={tags}
                        categoryIds={categoryIds || []}
                        tagIds={tagIds || []}
                        onToggleCategory={toggleCategory}
                        onToggleTag={toggleTag}
                    />
                )
            case "seo":
                return <SEOStep register={register} />
            case "gallery":
                return (
                    <GalleryStep
                        productId={createdProductId || product?.id}
                        productType={productType}
                        variantCombinationId={undefined}
                        onValidationChange={setIsGalleryValid}
                    />
                )
            case "stock":
                return (
                    <StockStep
                        productId={createdProductId || product?.id}
                        productType={productType}
                        variantCombinationId={undefined}
                        onStockSaved={() => {
                            // Stock kaydedildiğinde query'leri invalidate et
                            queryClient.invalidateQueries({ queryKey: ["product", createdProductId || product?.id] })
                            queryClient.invalidateQueries({ queryKey: ["stock"] })
                        }}
                    />
                )
            case "summary":
                return (
                    <SummaryStep
                        productId={createdProductId || product?.id}
                        productType={productType}
                    />
                )
            default:
                return null
        }
    }

    return (
        <div className="rounded-lg border border-border bg-card shadow-sm">
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">
                            {product ? "Ürün Düzenle" : "Yeni Ürün Oluştur"}
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {product
                                ? "Ürün bilgilerini güncelleyin."
                                : "Adım adım ürün oluşturun."}
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/panel/products")}
                        className="gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Geri Dön
                    </Button>
                </div>

                {/* Stepper */}
                <Stepper
                    steps={STEPS}
                    currentStep={currentStep}
                    allowAllSteps={!!product}
                    onStepClick={(step) => {
                        setCurrentStep(step)
                    }}
                />

                {/* Step Content */}
                <StepContent>{renderStepContent()}</StepContent>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentStep === 0 || isSubmitting}
                        className="gap-2"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Önceki
                    </Button>

                    <div className="flex items-center gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push("/panel/products")}
                            disabled={isSubmitting}
                        >
                            İptal
                        </Button>
                        {currentStep < STEPS.length - 1 ? (
                            <Button
                                type="button"
                                onClick={handleNext}
                                disabled={isSubmitting}
                                className="gap-2"
                            >
                                Kaydet ve Geç
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        ) : (
                            // Son adım (Özet) - Ürün zaten oluşturulmuş, sadece products sayfasına yönlendir
                            <Button
                                type="button"
                                onClick={() => router.push("/panel/products")}
                                disabled={isSubmitting}
                                className="gap-2"
                            >
                                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Tamamla
                            </Button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    )
}
