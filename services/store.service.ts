import api from "@/lib/api"
import { AxiosResponse } from "axios"
import { CategoryTree } from "./category.service"

export interface StoreProductGallery {
  mainImage: {
    id: string
    s3Url: string
    displayName: string | null
    filename: string
  } | null
  thumbnailImage: {
    id: string
    s3Url: string
    displayName: string | null
    filename: string
  } | null
  detailImages: Array<{
    id: string
    s3Url: string
    displayName: string | null
    filename: string
  }>
}

export interface StoreProduct {
  id: string
  productId: string
  variantCombinationId: string | null
  name: string
  subtitle: string | null
  slug: string
  description: string
  price: number
  basePrice: number
  discountedPrice: number | null
  sku: string | null
  stock: {
    availableQuantity: number
    reservedQuantity: number
    usableQuantity: number
  }
  gallery: StoreProductGallery
  categories: Array<{
    id: string
    name: string
    slug: string
  }>
  tags: Array<{
    id: string
    name: string
    color: string | null
  }>
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string[] | null
  variantValues: Array<{
    id: string
    value: string
    colorCode: string | null
    variantOption: {
      id: string
      name: string
      type: "COLOR" | "TEXT"
    }
  }>
  createdAt: string
  updatedAt: string
}

export interface StoreProductListResponse {
  products: StoreProduct[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface StoreProductQuery {
  search?: string
  categorySlugs?: string
  tagSlugs?: string
  minPrice?: number
  maxPrice?: number
  orderBy?: "price_asc" | "price_desc" | "name_asc" | "name_desc" | "created_at_asc" | "created_at_desc"
  page?: number
  limit?: number
}

/**
 * Store Service - Mağaza ürün işlemleri
 */
export class StoreService {
  private endpoint = "/store/products"

  /**
   * Mağaza için ürünleri getir
   */
  async getProducts(query?: StoreProductQuery): Promise<StoreProductListResponse> {
    const params = new URLSearchParams()
    
    if (query?.search) params.append("search", query.search)
    if (query?.categorySlugs) params.append("categorySlugs", query.categorySlugs)
    if (query?.tagSlugs) params.append("tagSlugs", query.tagSlugs)
    if (query?.minPrice !== undefined) params.append("minPrice", query.minPrice.toString())
    if (query?.maxPrice !== undefined) params.append("maxPrice", query.maxPrice.toString())
    if (query?.orderBy) params.append("orderBy", query.orderBy)
    if (query?.page) params.append("page", query.page.toString())
    if (query?.limit) params.append("limit", query.limit.toString())

    const response: AxiosResponse<StoreProductListResponse> = await api.get(
      `${this.endpoint}?${params.toString()}`
    )
    return response.data
  }

  /**
   * Mağaza için kategorileri getir (hiyerarşik)
   */
  async getCategories(): Promise<CategoryTree[]> {
    const response: AxiosResponse<CategoryTree[]> = await api.get("/store/categories")
    return response.data
  }

  /**
   * Mağaza için tag'leri getir
   */
  async getTags(): Promise<StoreTag[]> {
    const response: AxiosResponse<StoreTag[]> = await api.get("/store/tags")
    return response.data
  }
}

export interface StoreTag {
  id: string
  name: string
  slug: string
  color: string | null
}

export const storeService = new StoreService()
