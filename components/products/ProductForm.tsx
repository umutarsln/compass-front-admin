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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import { Loader2, ArrowLeft } from "lucide-react"
import { Textarea } from "../ui/textarea"

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

export function ProductForm({ product }: ProductFormProps) {
    const { toast } = useToast()
    const queryClient = useQueryClient()
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

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
    })

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
        } else {
            setHtmlDescription("")
        }
    }, [product, reset])

    // Ürün oluşturma mutation
    const createMutation = useMutation({
        mutationFn: (data: CreateProductDto) => productService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["products"] })
            toast({
                title: "Başarılı",
                description: "Ürün başarıyla oluşturuldu.",
            })
            router.push("/panel/products")
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

    const onSubmit = async (data: ProductFormValues) => {
        setIsSubmitting(true)
        try {
            // HTML'i Markdown'a çevir
            const markdownDescription = htmlDescription
                ? turndownService.turndown(htmlDescription)
                : ""

            if (product) {
                // Update mode
                const updateData: UpdateProductDto = {
                    type: data.type,
                    name: data.name,
                    description: markdownDescription || data.description,
                    basePrice: data.basePrice,
                    sku: data.sku || undefined,
                    isActive: data.isActive,
                    isFeatured: data.isFeatured,
                    isOnSale: data.isOnSale,
                    discountPercent: data.isOnSale ? data.discountPercent : null,
                    seoTitle: data.seoTitle || undefined,
                    seoDescription: data.seoDescription || undefined,
                    seoKeywords: data.seoKeywords
                        ? data.seoKeywords.split(",").map((k) => k.trim()).filter(Boolean)
                        : undefined,
                    categoryIds: data.categoryIds.length > 0 ? data.categoryIds : undefined,
                    tagIds: data.tagIds.length > 0 ? data.tagIds : undefined,
                }
                await updateMutation.mutateAsync({ id: product.id, data: updateData })
            } else {
                // Create mode
                const finalDescription: string = (markdownDescription || data.description || "").trim()
                if (!finalDescription) {
                    throw new Error("Ürün açıklaması gereklidir")
                }
                const createData: CreateProductDto = {
                    type: data.type,
                    name: data.name,
                    description: finalDescription,
                    basePrice: data.basePrice,
                    sku: data.sku || undefined,
                    isActive: data.isActive,
                    isFeatured: data.isFeatured,
                    isOnSale: data.isOnSale,
                    discountPercent: data.isOnSale ? data.discountPercent : null,
                    seoTitle: data.seoTitle || undefined,
                    seoDescription: data.seoDescription || undefined,
                    seoKeywords: data.seoKeywords
                        ? data.seoKeywords.split(",").map((k) => k.trim()).filter(Boolean)
                        : undefined,
                    categoryIds: data.categoryIds.length > 0 ? data.categoryIds : undefined,
                    tagIds: data.tagIds.length > 0 ? data.tagIds : undefined,
                }
                await createMutation.mutateAsync(createData)
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
                                : "Yeni bir ürün oluşturmak için formu doldurun."}
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

                {/* Temel Bilgiler */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground">Temel Bilgiler</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="type">Ürün Tipi *</Label>
                            <Controller
                                name="type"
                                control={control}
                                render={({ field }) => (
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Ürün tipi seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SIMPLE">Basit Ürün</SelectItem>
                                            <SelectItem value="VARIANT">Varyant Ürün</SelectItem>
                                            <SelectItem value="BUNDLE">Paket Ürün</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.type && (
                                <p className="text-sm text-red-600 mt-1">{errors.type.message}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="sku">SKU (Stok Kodu)</Label>
                            <Input
                                id="sku"
                                {...register("sku")}
                                placeholder="Örn: PRD-001"
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="name">Ürün Adı *</Label>
                        <Input
                            id="name"
                            {...register("name")}
                            placeholder="Örn: Örnek Ürün"
                            className="mt-1"
                        />
                        {errors.name && (
                            <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="description">Ürün Açıklaması *</Label>
                        <div className="mt-1">
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => (
                                    <RichTextEditor
                                        content={htmlDescription}
                                        onChange={(html) => {
                                            setHtmlDescription(html)
                                            // HTML'i Markdown'a çevirip form'a kaydet
                                            const markdown = html ? turndownService.turndown(html) : ""
                                            field.onChange(markdown)
                                        }}
                                        placeholder="Ürün açıklamasını buraya yazın..."
                                    />
                                )}
                            />
                        </div>
                        {errors.description && (
                            <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Zengin metin editörü ile formatlanmış içerik oluşturabilirsiniz.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="basePrice">Temel Fiyat (₺) *</Label>
                            <Input
                                id="basePrice"
                                type="number"
                                step="0.01"
                                min="0"
                                {...register("basePrice", { valueAsNumber: true })}
                                placeholder="0.00"
                                className="mt-1"
                            />
                            {errors.basePrice && (
                                <p className="text-sm text-red-600 mt-1">{errors.basePrice.message}</p>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center space-x-2 pt-6">
                                <input
                                    type="checkbox"
                                    id="isOnSale"
                                    {...register("isOnSale")}
                                    className="w-4 h-4 rounded border-border"
                                />
                                <Label htmlFor="isOnSale" className="cursor-pointer">
                                    İndirimde
                                </Label>
                            </div>

                            {isOnSale && (
                                <div>
                                    <Label htmlFor="discountPercent">İndirim Yüzdesi (%)</Label>
                                    <Input
                                        id="discountPercent"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        {...register("discountPercent", { valueAsNumber: true })}
                                        placeholder="0.00"
                                        className="mt-1"
                                    />
                                    {errors.discountPercent && (
                                        <p className="text-sm text-red-600 mt-1">
                                            {errors.discountPercent.message}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center space-x-2">
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

                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="isFeatured"
                                {...register("isFeatured")}
                                className="w-4 h-4 rounded border-border"
                            />
                            <Label htmlFor="isFeatured" className="cursor-pointer">
                                Öne Çıkan
                            </Label>
                        </div>
                    </div>
                </div>

                {/* Kategoriler ve Taglar */}
                <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold text-foreground">Kategoriler ve Taglar</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <Label>Kategoriler</Label>
                            <div className="mt-2 border border-border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                                {categories.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Kategori bulunamadı</p>
                                ) : (
                                    categories.map((category) => (
                                        <div key={category.id} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={`category-${category.id}`}
                                                checked={categoryIds?.includes(category.id) || false}
                                                onChange={() => toggleCategory(category.id)}
                                                className="w-4 h-4 rounded border-border"
                                            />
                                            <Label
                                                htmlFor={`category-${category.id}`}
                                                className="cursor-pointer text-sm"
                                            >
                                                {category.name}
                                            </Label>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div>
                            <Label>Taglar</Label>
                            <div className="mt-2 border border-border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                                {tags.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Tag bulunamadı</p>
                                ) : (
                                    tags.map((tag) => (
                                        <div key={tag.id} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={`tag-${tag.id}`}
                                                checked={tagIds?.includes(tag.id) || false}
                                                onChange={() => toggleTag(tag.id)}
                                                className="w-4 h-4 rounded border-border"
                                            />
                                            <Label htmlFor={`tag-${tag.id}`} className="cursor-pointer text-sm">
                                                <span
                                                    className="inline-block w-3 h-3 rounded-full mr-2"
                                                    style={{ backgroundColor: tag.color }}
                                                />
                                                {tag.name}
                                            </Label>
                                        </div>
                                    ))
                                )}
                            </div>
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
                            Örn: ürün, e-ticaret, satış
                        </p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/panel/products")}
                        disabled={isSubmitting}
                    >
                        İptal
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {product ? "Güncelle" : "Oluştur"}
                    </Button>
                </div>
            </form>
        </div>
    )
}
