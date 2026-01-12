import { BaseService } from "./base.service"
import api from "@/lib/api"
import { AxiosResponse } from "axios"
import { Upload } from "./upload.service"

export type ProductType = "SIMPLE" | "VARIANT" | "BUNDLE"

export interface ProductGallery {
  id: string
  productId: string | null
  variantCombinationId: string | null
  mainImageId: string
  mainImage: Upload
  thumbnailImageId: string
  thumbnailImage: Upload
  detailImages: Upload[]
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface CreateProductGalleryDto {
  productId?: string
  variantCombinationId?: string
  mainImageId: string
  thumbnailImageId: string
  detailImageIds?: string[]
  displayOrder?: number
}

export interface Product {
    id: string
    type: ProductType
    name: string
    slug: string
    description: string | null
    basePrice: number
    sku: string
    isActive: boolean
    isFeatured: boolean
    isOnSale: boolean
    discountPercent: number | null
    seoTitle: string | null
    seoDescription: string | null
    seoKeywords: string[] | null
    categories: any[]
    tags: any[]
    galleries?: ProductGallery[]
    createdBy: any
    createdAt: string
    updatedAt: string
}

export interface CreateProductDto {
    type: ProductType
    name: string
    description: string
    basePrice: number
    sku?: string
    isActive?: boolean
    isFeatured?: boolean
    isOnSale?: boolean
    discountPercent?: number | null
    seoTitle?: string
    seoDescription?: string
    seoKeywords?: string[]
    categoryIds?: string[]
    tagIds?: string[]
}

export interface UpdateProductDto extends Partial<CreateProductDto> { }

// Variant Option Interfaces
export interface VariantOption {
  id: string
  productId: string
  name: string
  type: "COLOR" | "TEXT"
  displayOrder: number
  isRequired: boolean
  values?: VariantValue[]
  createdAt: string
  updatedAt: string
}

export interface CreateVariantOptionDto {
  name: string
  type: "COLOR" | "TEXT"
  displayOrder?: number
  isRequired?: boolean
}

export interface UpdateVariantOptionDto extends Partial<CreateVariantOptionDto> { }

// Variant Value Interfaces
export interface VariantValue {
  id: string
  variantOptionId: string
  value: string
  colorCode: string | null
  priceDelta: number
  isActive: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface CreateVariantValueDto {
  value: string
  colorCode?: string | null
  priceDelta?: number
  isActive?: boolean
  displayOrder?: number
}

export interface UpdateVariantValueDto extends Partial<CreateVariantValueDto> { }

export interface GetProductsParams {
    type?: ProductType
    categoryId?: string
}

/**
 * Product Service - Ürün işlemleri
 */
export class ProductService extends BaseService<Product> {
    constructor() {
        super("/products")
    }

    /**
     * Ürünleri filtreli getir
     */
    async getAll(params?: GetProductsParams): Promise<Product[]> {
        return super.getAll(params)
    }

    /**
     * Slug'a göre ürün getir
     */
    async getBySlug(slug: string): Promise<Product> {
        const response: AxiosResponse<Product> = await api.get(
            `${this.endpoint}/slug/${slug}`
        )
        return response.data
    }

    /**
     * Basit ürün için ProductGallery oluştur
     */
    async createProductGallery(
        productId: string,
        data: CreateProductGalleryDto
    ): Promise<ProductGallery> {
        const response: AxiosResponse<ProductGallery> = await api.post(
            `${this.endpoint}/${productId}/gallery`,
            data
        )
        return response.data
    }

    /**
     * Variant kombinasyonu için ProductGallery oluştur
     */
    async createVariantGallery(
        variantCombinationId: string,
        data: CreateProductGalleryDto
    ): Promise<ProductGallery> {
        const response: AxiosResponse<ProductGallery> = await api.post(
            `${this.endpoint}/variants/${variantCombinationId}/gallery`,
            data
        )
        return response.data
    }

    /**
     * ProductGallery güncelle
     */
    async updateProductGallery(
        galleryId: string,
        data: Partial<CreateProductGalleryDto>
    ): Promise<ProductGallery> {
        console.log('[ProductService] updateProductGallery - START');
        console.log('[ProductService] Request:', {
            endpoint: `${this.endpoint}/gallery/${galleryId}`,
            method: 'PATCH',
            galleryId,
            data: {
                mainImageId: data.mainImageId,
                thumbnailImageId: data.thumbnailImageId,
                detailImageIds: data.detailImageIds,
                displayOrder: data.displayOrder,
                productId: data.productId,
                variantCombinationId: data.variantCombinationId,
            },
        });
        
        const response: AxiosResponse<ProductGallery> = await api.patch(
            `${this.endpoint}/gallery/${galleryId}`,
            data
        )
        
        console.log('[ProductService] Response:', {
            status: response.status,
            data: {
                id: response.data.id,
                mainImageId: response.data.mainImageId,
                mainImage: response.data.mainImage ? {
                    id: response.data.mainImage.id,
                    filename: response.data.mainImage.filename,
                } : null,
                thumbnailImageId: response.data.thumbnailImageId,
                thumbnailImage: response.data.thumbnailImage ? {
                    id: response.data.thumbnailImage.id,
                    filename: response.data.thumbnailImage.filename,
                } : null,
                detailImagesCount: response.data.detailImages?.length || 0,
            },
        });
        console.log('[ProductService] updateProductGallery - END');
        
        return response.data
    }

    /**
     * ProductGallery getir
     */
    async getProductGallery(galleryId: string): Promise<ProductGallery> {
        const response: AxiosResponse<ProductGallery> = await api.get(
            `${this.endpoint}/gallery/${galleryId}`
        )
        return response.data
    }

    /**
     * Ürünün ProductGallery'sini getir
     */
    async getProductGalleryByProduct(productId: string): Promise<ProductGallery | null> {
        try {
            const response: AxiosResponse<ProductGallery> = await api.get(
                `${this.endpoint}/${productId}/gallery`
            )
            return response.data
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null
            }
            throw error
        }
    }

    /**
     * Variant kombinasyonunun ProductGallery'sini getir
     */
    async getProductGalleryByVariant(
        variantCombinationId: string
    ): Promise<ProductGallery | null> {
        try {
            const response: AxiosResponse<ProductGallery> = await api.get(
                `${this.endpoint}/variants/${variantCombinationId}/gallery`
            )
            return response.data
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null
            }
            throw error
        }
    }

    /**
     * ProductGallery sil
     */
    async deleteProductGallery(galleryId: string): Promise<{ message: string }> {
        const response: AxiosResponse<{ message: string }> = await api.delete(
            `${this.endpoint}/gallery/${galleryId}`
        )
        return response.data
    }

    // ==================== VARIANT OPTION METHODS ====================

    /**
     * Varyasyon seçeneği oluştur
     */
    async createVariantOption(
        productId: string,
        data: CreateVariantOptionDto
    ): Promise<VariantOption> {
        const response: AxiosResponse<VariantOption> = await api.post(
            `${this.endpoint}/${productId}/variant-options`,
            data
        )
        return response.data
    }

    /**
     * Ürünün varyasyon seçeneklerini getir
     */
    async getVariantOptionsByProduct(productId: string): Promise<VariantOption[]> {
        const response: AxiosResponse<VariantOption[]> = await api.get(
            `${this.endpoint}/${productId}/variant-options`
        )
        return response.data
    }

    /**
     * Varyasyon seçeneğini güncelle
     */
    async updateVariantOption(
        id: string,
        data: UpdateVariantOptionDto
    ): Promise<VariantOption> {
        const response: AxiosResponse<VariantOption> = await api.patch(
            `${this.endpoint}/variant-options/${id}`,
            data
        )
        return response.data
    }

    /**
     * Varyasyon seçeneğini sil
     */
    async deleteVariantOption(id: string): Promise<void> {
        await api.delete(`${this.endpoint}/variant-options/${id}`)
    }

    // ==================== VARIANT VALUE METHODS ====================

    /**
     * Varyasyon değeri oluştur
     */
    async createVariantValue(
        variantOptionId: string,
        data: CreateVariantValueDto
    ): Promise<VariantValue> {
        const response: AxiosResponse<VariantValue> = await api.post(
            `${this.endpoint}/variant-options/${variantOptionId}/variant-values`,
            data
        )
        return response.data
    }

    /**
     * Varyasyon seçeneğinin değerlerini getir
     */
    async getVariantValuesByOption(variantOptionId: string): Promise<VariantValue[]> {
        const response: AxiosResponse<VariantValue[]> = await api.get(
            `${this.endpoint}/variant-options/${variantOptionId}/variant-values`
        )
        return response.data
    }

    /**
     * Varyasyon değerini güncelle
     */
    async updateVariantValue(
        id: string,
        data: UpdateVariantValueDto
    ): Promise<VariantValue> {
        const response: AxiosResponse<VariantValue> = await api.patch(
            `${this.endpoint}/variant-values/${id}`,
            data
        )
        return response.data
    }

    /**
     * Varyasyon değerini sil
     */
    async deleteVariantValue(id: string): Promise<void> {
        await api.delete(`${this.endpoint}/variant-values/${id}`)
    }

    // ==================== VARIANT COMBINATION METHODS ====================

    /**
     * Tüm varyasyon kombinasyonlarını otomatik oluştur
     */
    async generateAllVariantCombinations(productId: string): Promise<VariantCombination[]> {
        const response: AxiosResponse<VariantCombination[]> = await api.post(
            `${this.endpoint}/${productId}/variant-combinations/generate`
        )
        return response.data
    }

    /**
     * Ürünün varyasyon kombinasyonlarını getir
     */
    async getVariantCombinationsByProduct(productId: string): Promise<VariantCombination[]> {
        const response: AxiosResponse<VariantCombination[]> = await api.get(
            `${this.endpoint}/${productId}/variant-combinations`
        )
        return response.data
    }

    /**
     * Varyasyon kombinasyonu oluştur
     */
    async createVariantCombination(
        productId: string,
        data: CreateVariantCombinationDto
    ): Promise<VariantCombination> {
        const response: AxiosResponse<VariantCombination> = await api.post(
            `${this.endpoint}/${productId}/variant-combinations`,
            data
        )
        return response.data
    }

    /**
     * Varyasyon kombinasyonunu güncelle
     */
    async updateVariantCombination(
        id: string,
        data: UpdateVariantCombinationDto
    ): Promise<VariantCombination> {
        const response: AxiosResponse<VariantCombination> = await api.patch(
            `${this.endpoint}/variant-combinations/${id}`,
            data
        )
        return response.data
    }

    /**
     * Ürünün toplam stokunu hesapla (tüm kombinasyonların stoklarının toplamı)
     */
    async getProductTotalStock(productId: string): Promise<{
        totalAvailable: number
        totalReserved: number
        totalAvailableAfterReserve: number
        combinations: Array<{
            combinationId: string
            availableQuantity: number
            reservedQuantity: number
        }>
    }> {
        const response: AxiosResponse<{
            totalAvailable: number
            totalReserved: number
            totalAvailableAfterReserve: number
            combinations: Array<{
                combinationId: string
                availableQuantity: number
                reservedQuantity: number
            }>
        }> = await api.get(
            `${this.endpoint}/${productId}/variant-combinations/total-stock`
        )
        return response.data
    }
}

// Variant Combination Interfaces
export interface VariantCombination {
    id: string
    productId: string
    sku: string | null
    isActive: boolean
    isDisabled: boolean
    variantValues: VariantValue[]
    galleries?: ProductGallery[]
    stock?: any
    createdAt: string
    updatedAt: string
}

export interface CreateVariantCombinationDto {
    variantValueIds: string[]
    sku?: string | null
    isActive?: boolean
    isDisabled?: boolean
}

export interface UpdateVariantCombinationDto extends Partial<CreateVariantCombinationDto> { }

export const productService = new ProductService()
