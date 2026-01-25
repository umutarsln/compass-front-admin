"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
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
import { Upload } from "@/services/upload.service"
import { stockService } from "@/services/stock.service"
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
import { PersonalizationStep } from "./steps/PersonalizationStep"
import { personalizationService } from "@/services/personalization.service"

const productSchema = z.object({
    type: z.enum(["SIMPLE", "VARIANT", "BUNDLE"]),
    name: z.string().min(1, "Ürün adı gereklidir"),
    subtitle: z.string().optional().nullable(),
    description: z.string().min(1, "Ürün açıklaması gereklidir"),
    basePrice: z.number().min(0, "Fiyat 0'dan büyük olmalıdır"),
    sku: z.string().optional(),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().default(false),
    discountedPrice: z.number().min(0).nullable().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoKeywords: z.string().optional(),
    categoryIds: z.array(z.string()).default([]),
    tagIds: z.array(z.string()).default([]),
    personalizationFormId: z.string().uuid().optional().nullable(),
}).refine(
    (data) => {
        // Validation: discountedPrice varsa geçerli olmalı
        if (data.discountedPrice !== null && data.discountedPrice !== undefined && data.discountedPrice <= 0) {
            return false
        }
        return true
    },
    {
        message: "İndirimde ürünler için indirimli fiyat gereklidir",
        path: ["discountedPrice"],
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
    personalization: {
        id: "personalization",
        title: "Kişiselleştirme",
        description: "Kişiselleştirme formunu seçin",
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
        "personalization",
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
    const searchParams = useSearchParams()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [createdProductId, setCreatedProductId] = useState<string | null>(null)
    const [isGalleryValid, setIsGalleryValid] = useState(false)
    const [galleryState, setGalleryState] = useState<{
        mainImage: Upload | null
        thumbnailImage: Upload | null
        detailImages: Upload[]
    }>({
        mainImage: null,
        thumbnailImage: null,
        detailImages: [],
    })
    const [stockState, setStockState] = useState<{
        availableQuantity: number
        lowStockThreshold: number | null
        sku: string
    }>({
        availableQuantity: 0,
        lowStockThreshold: null,
        sku: "",
    })

    // Değişiklik kontrolü için initial state'leri tut
    const initialGalleryState = useRef(galleryState)
    const initialStockState = useRef(stockState)
    const hasUnsavedChanges = useRef(false)

    // Markdown description state for rich text editor
    const [markdownDescription, setMarkdownDescription] = useState("")

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

    const { data: personalizationForms = [] } = useQuery({
        queryKey: ["personalization-forms"],
        queryFn: () => personalizationService.getForms(),
    })

    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isDirty },
        reset,
        setValue,
        watch,
        trigger,
    } = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            type: "SIMPLE",
            name: "",
            subtitle: null,
            description: "",
            basePrice: 0,
            sku: "",
            isActive: true,
            isFeatured: false,
            discountedPrice: null,
            seoTitle: "",
            seoDescription: "",
            seoKeywords: "",
            categoryIds: [],
            tagIds: [],
            personalizationFormId: null,
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

    // Query parameter'dan tab'ı oku ve ilgili step'e yönlendir (sadece ilk yüklemede)
    const hasInitializedTab = useRef(false)
    useEffect(() => {
        if (product && searchParams && !hasInitializedTab.current) {
            const tab = searchParams.get("tab")
            if (tab) {
                const stepIndex = STEPS.findIndex((step) => step.id === tab)
                if (stepIndex !== -1) {
                    setCurrentStep(stepIndex)
                    hasInitializedTab.current = true
                }
            }
        }
    }, [product, searchParams, STEPS])

    // Değişiklik kontrolü: Form, gallery veya stock state'lerinde değişiklik var mı?
    const checkUnsavedChanges = useCallback(() => {
        if (!product) {
            // Yeni ürün ekleme modunda
            const formChanged = isDirty
            const galleryChanged = JSON.stringify(galleryState) !== JSON.stringify(initialGalleryState.current)
            const stockChanged = JSON.stringify(stockState) !== JSON.stringify(initialStockState.current)
            return formChanged || galleryChanged || stockChanged
        }
        return false // Düzenleme modunda şimdilik kontrol etmiyoruz
    }, [isDirty, galleryState, stockState, product])

    // Browser'dan çıkarken uyarı göster
    useEffect(() => {
        if (!product) {
            const handleBeforeUnload = (e: BeforeUnloadEvent) => {
                if (checkUnsavedChanges()) {
                    e.preventDefault()
                    e.returnValue = ""
                    return ""
                }
            }

            window.addEventListener("beforeunload", handleBeforeUnload)
            return () => {
                window.removeEventListener("beforeunload", handleBeforeUnload)
            }
        }
    }, [checkUnsavedChanges, product])

    // Sayfadan çıkarken kontrol et
    const handleExit = (callback: () => void) => {
        if (!product && checkUnsavedChanges()) {
            const confirmed = window.confirm(
                "Emin misiniz? Yaptığınız değişiklikler kaydedilmedi. Sayfadan ayrılmak istediğinize emin misiniz?"
            )
            if (confirmed) {
                callback()
            }
        } else {
            callback()
        }
    }

    const categoryIds = watch("categoryIds")
    const tagIds = watch("tagIds")

    // Form'u ürün verisi ile doldur (düzenleme modu)
    useEffect(() => {
        if (product) {
            // Markdown description'ı direkt kullan
            setMarkdownDescription(product.description || "")
            reset({
                type: product.type,
                name: product.name,
                subtitle: product.subtitle || null,
                description: product.description || "",
                basePrice: product.basePrice,
                sku: product.sku || "",
                isActive: product.isActive,
                isFeatured: product.isFeatured,
                discountedPrice: product.discountedPrice,
                seoTitle: product.seoTitle || "",
                seoDescription: product.seoDescription || "",
                seoKeywords: product.seoKeywords?.join(", ") || "",
                categoryIds: product.categories?.map((c) => c.id) || [],
                tagIds: product.tags?.map((t) => t.id) || [],
                personalizationFormId: (product as any).personalizationFormId || null,
            })
            setCreatedProductId(product.id)

            // Not: Gallery durumu ProductGalleryManager tarafından yönetiliyor
            // Burada sadece productId'yi set ediyoruz, gallery durumu
            // ProductGalleryManager'ın onSaveStatusChange callback'i ile güncellenecek
        } else {
            setMarkdownDescription("")
        }
    }, [product, reset])

    // Ürün oluşturma mutation
    const createMutation = useMutation({
        mutationFn: (data: CreateProductDto) => productService.create(data),
        onSuccess: (createdProduct) => {
            setCreatedProductId(createdProduct.id)
            queryClient.invalidateQueries({ queryKey: ["products"] })
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
            handleExit(() => {
                router.push("/panel/products")
            })
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
                // Main image ve thumbnail image zorunlu - sadece productId varsa kontrol et
                if (createdProductId || product?.id) {
                    if (!isGalleryValid) {
                        toast({
                            title: "Uyarı",
                            description: "Ana resim ve thumbnail resim zorunludur. Lütfen resimleri seçin.",
                            variant: "destructive",
                        })
                        return false
                    }
                } else {
                    // Yeni ürün ekleme durumunda, resimler seçilmişse valid
                    // Resimler seçilmemişse de geçerli (opsiyonel)
                    return true
                }
                return true
            case "stock":
                // Stok adımı opsiyonel - yeni ürün ekleme durumunda da geçerli
                return true
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
            // Yeni ürün ekleme durumunda sadece step değiştir
            if (!product && !createdProductId) {
                setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1))
                return
            }

            // Düzenleme modunda mevcut mantık
            const currentStepData = STEPS[currentStep]
            if (!currentStepData) return

            const formData = watch()
            const productId = createdProductId || product?.id

            // Temel bilgiler adımından sonra, ürünü güncelle (name, subtitle, description)
            if (currentStepData.id === "basic" && productId) {
                await updateCategoriesTagsMutation.mutateAsync({
                    id: productId,
                    data: {
                        name: formData.name,
                        subtitle: formData.subtitle || undefined,
                        description: markdownDescription || formData.description,
                    },
                })
            }

            // Fiyatlandırma adımından sonra, ürünü güncelle
            if (currentStepData.id === "pricing" && productId) {
                const pricingData: any = {
                    basePrice: formData.basePrice,
                }

                // discountedPrice: Geçerli bir değer varsa her zaman gönder, yoksa null gönder
                if (formData.discountedPrice !== null &&
                    formData.discountedPrice !== undefined &&
                    !isNaN(Number(formData.discountedPrice)) &&
                    Number(formData.discountedPrice) >= 0) {
                    pricingData.discountedPrice = Number(formData.discountedPrice)
                } else {
                    // Geçerli değer yoksa null gönder (açıkça)
                    pricingData.discountedPrice = null
                }

                await updateCategoriesTagsMutation.mutateAsync({
                    id: productId,
                    data: pricingData,
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

            // Kişiselleştirme adımından sonra, ürünü güncelle
            if (currentStepData.id === "personalization" && productId) {
                await updateCategoriesTagsMutation.mutateAsync({
                    id: productId,
                    data: {
                        personalizationFormId: formData.personalizationFormId || null,
                    },
                })
            }

            setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1))
        }
    }

    // Önceki adıma dön
    const handlePrevious = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0))
    }

    // Ürünü kaydet (ara kayıt)
    const handleSaveProduct = async (): Promise<Product> => {
        const formData = watch()

        const createData: CreateProductDto = {
            type: formData.type,
            name: formData.name,
            subtitle: formData.subtitle || undefined,
            description: markdownDescription || formData.description,
            basePrice: formData.basePrice,
            sku: formData.sku || undefined,
            isActive: formData.isActive,
            isFeatured: formData.isFeatured,
            personalizationFormId: formData.personalizationFormId || undefined,
        }

        // discountedPrice: Geçerli bir değer varsa gönder, yoksa null gönder
        if (formData.discountedPrice !== null &&
            formData.discountedPrice !== undefined &&
            !isNaN(Number(formData.discountedPrice)) &&
            Number(formData.discountedPrice) >= 0) {
            createData.discountedPrice = Number(formData.discountedPrice)
        } else {
            createData.discountedPrice = null
        }

        // Final submit'te tüm veriler gönderileceği için burada sadece temel alanları gönder
        // SEO, categories, tags final submit'te gönderilecek
        const createdProduct = await createMutation.mutateAsync(createData)
        return createdProduct
    }

    // Final submit - Yeni ürün ekleme durumunda tüm verileri sırayla gönder
    const handleFinalSubmit = async () => {
        setIsSubmitting(true)
        try {
            if (!product && !createdProductId) {
                // Yeni ürün ekleme durumunda
                // Debug: State'leri kontrol et
                console.log('[ProductForm] Final submit - Gallery state:', galleryState)
                console.log('[ProductForm] Final submit - Stock state:', stockState)

                // 1. Önce ürünü oluştur
                const formData = watch()
                const createdProduct = await handleSaveProduct()
                const productId = createdProduct.id

                // 2. Tüm step'lerdeki verileri sırayla gönder
                // Basic info
                await updateCategoriesTagsMutation.mutateAsync({
                    id: productId,
                    data: {
                        name: formData.name,
                        subtitle: formData.subtitle || undefined,
                        description: markdownDescription || formData.description,
                        personalizationFormId: formData.personalizationFormId || null,
                    },
                })

                // Pricing
                const pricingData: any = {
                    basePrice: formData.basePrice,
                    discountedPrice: formData.discountedPrice !== null &&
                        formData.discountedPrice !== undefined &&
                        !isNaN(Number(formData.discountedPrice)) &&
                        Number(formData.discountedPrice) >= 0
                        ? Number(formData.discountedPrice)
                        : null,
                }
                await updateCategoriesTagsMutation.mutateAsync({
                    id: productId,
                    data: pricingData,
                })

                // Categories & Tags
                await updateCategoriesTagsMutation.mutateAsync({
                    id: productId,
                    data: {
                        categoryIds: formData.categoryIds.length > 0 ? formData.categoryIds : [],
                        tagIds: formData.tagIds.length > 0 ? formData.tagIds : [],
                    },
                })

                // SEO
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

                // Gallery - Eğer resimler seçildiyse kaydet
                if (galleryState.mainImage || galleryState.thumbnailImage || galleryState.detailImages.length > 0) {
                    try {
                        // Main image ve thumbnail zorunlu, eğer yoksa hata göster
                        if (!galleryState.mainImage || !galleryState.thumbnailImage) {
                            toast({
                                title: "Uyarı",
                                description: "Ana resim ve thumbnail resim zorunludur. Gallery kaydedilmedi.",
                                variant: "destructive",
                            })
                        } else {
                            await productService.createProductGallery(productId, {
                                mainImageId: galleryState.mainImage.id,
                                thumbnailImageId: galleryState.thumbnailImage.id,
                                detailImageIds: galleryState.detailImages.map((img) => img.id),
                                displayOrder: 0,
                            })
                            toast({
                                title: "Başarılı",
                                description: "Ürün galerisi başarıyla kaydedildi.",
                            })
                        }
                    } catch (error: any) {
                        toast({
                            title: "Hata",
                            description: error.response?.data?.message || "Galeri kaydedilirken bir hata oluştu.",
                            variant: "destructive",
                        })
                        console.error("Gallery kaydetme hatası:", error)
                    }
                }

                // Stock - Stok verilerini kaydet (sadece SIMPLE ürünler için)
                if (productType === "SIMPLE") {
                    try {
                        // SKU'yu product'a kaydet (eğer girildiyse)
                        if (stockState.sku && stockState.sku.trim()) {
                            await updateCategoriesTagsMutation.mutateAsync({
                                id: productId,
                                data: {
                                    sku: stockState.sku.trim() || undefined,
                                },
                            })
                        }

                        // Stock'u kaydet (availableQuantity >= 0 kontrolü ile)
                        if (stockState.availableQuantity >= 0 || stockState.lowStockThreshold !== null) {
                            await stockService.updateStock("PRODUCT", productId, {
                                availableQuantity: stockState.availableQuantity >= 0 ? stockState.availableQuantity : 0,
                                lowStockThreshold: stockState.lowStockThreshold ?? undefined,
                            })
                            toast({
                                title: "Başarılı",
                                description: "Stok bilgisi başarıyla kaydedildi.",
                            })
                        }
                    } catch (error: any) {
                        toast({
                            title: "Hata",
                            description: error.response?.data?.message || "Stok bilgisi kaydedilirken bir hata oluştu.",
                            variant: "destructive",
                        })
                        console.error("Stock kaydetme hatası:", error)
                    }
                }

                // 3. Başarı mesajı ve yönlendirme
                toast({
                    title: "Başarılı",
                    description: "Ürün başarıyla oluşturuldu.",
                })

                // Ürün tipine göre doğru tab ile detay sayfasına yönlendir
                const tab = productType === "VARIANT" ? "variants" : "basic"
                router.push(`/panel/products/${createdProduct.slug}?tab=${tab}`)
            } else {
                // Düzenleme modunda mevcut mantık
                await onSubmit(watch())
            }
        } catch (error: any) {
            toast({
                title: "Hata",
                description: error.response?.data?.message || "İşlem sırasında bir hata oluştu.",
                variant: "destructive",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    // Final submit (düzenleme modu için)
    const onSubmit = async (data: ProductFormValues) => {
        setIsSubmitting(true)
        try {
            if (product || createdProductId) {
                // Update mode
                const updateData: UpdateProductDto = {
                    type: data.type,
                    name: data.name,
                    subtitle: data.subtitle || undefined,
                    description: markdownDescription || data.description,
                    basePrice: data.basePrice,
                    sku: data.sku || undefined,
                    isActive: data.isActive,
                    isFeatured: data.isFeatured,
                    personalizationFormId: data.personalizationFormId || null,
                }

                // discountedPrice: Geçerli bir değer varsa gönder, yoksa null gönder
                if (data.discountedPrice !== null &&
                    data.discountedPrice !== undefined &&
                    !isNaN(Number(data.discountedPrice)) &&
                    Number(data.discountedPrice) >= 0) {
                    updateData.discountedPrice = Number(data.discountedPrice)
                } else {
                    updateData.discountedPrice = null
                }

                // SEO ve diğer alanları ekle
                updateData.seoTitle = data.seoTitle || undefined
                updateData.seoDescription = data.seoDescription || undefined
                updateData.seoKeywords = data.seoKeywords
                    ? data.seoKeywords.split(",").map((k) => k.trim()).filter(Boolean)
                    : undefined
                updateData.categoryIds = data.categoryIds.length > 0 ? data.categoryIds : undefined
                updateData.tagIds = data.tagIds.length > 0 ? data.tagIds : undefined
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
                        isEditMode={!!product || (currentStep > 0 && !product)}
                    />
                )
            case "basic":
                return (
                    <BasicInfoStep
                        control={control}
                        register={register}
                        errors={errors}
                        markdownDescription={markdownDescription}
                        setMarkdownDescription={setMarkdownDescription}
                    />
                )
            case "personalization":
                return (
                    <PersonalizationStep
                        control={control}
                        errors={errors}
                        personalizationForms={personalizationForms}
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
                        onGalleryChange={setGalleryState}
                        initialGallery={galleryState}
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
                        onStockChange={setStockState}
                        initialStock={stockState}
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
                        onClick={() => handleExit(() => router.push("/panel/products"))}
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
                    allowAllSteps={!!product || (!!productType && !product)}
                    onStepClick={(step) => {
                        // Type seçilmeden diğer adımlara gidilemesin
                        if (!product && step > 0 && !productType) {
                            toast({
                                title: "Uyarı",
                                description: "Önce ürün tipini seçmelisiniz.",
                                variant: "destructive",
                            })
                            return
                        }
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
                            onClick={() => handleExit(() => router.push("/panel/products"))}
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
                            // Son adım (Özet) - Final submit
                            <Button
                                type="button"
                                onClick={handleFinalSubmit}
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
