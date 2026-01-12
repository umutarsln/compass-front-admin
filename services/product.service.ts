import { BaseService } from "./base.service"
import api from "@/lib/api"
import { AxiosResponse } from "axios"

export type ProductType = "SIMPLE" | "VARIANT" | "BUNDLE"

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
}

export const productService = new ProductService()
