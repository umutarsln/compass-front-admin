import { BaseService } from "./base.service"
import api from "@/lib/api"
import { AxiosResponse } from "axios"

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  parent: Category | null
  children: Category[]
  imageId: string | null
  image: any | null
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string[] | null
  isActive: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface CreateCategoryDto {
  name: string
  description?: string
  parentId?: string | null
  imageId?: string
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
  isActive?: boolean
  displayOrder?: number
}

export interface UpdateCategoryDto extends Partial<CreateCategoryDto> {}

export interface CategoryTree {
  id: string
  name: string
  slug: string
  children: CategoryTree[]
}

/**
 * Category Service - Kategori işlemleri
 */
export class CategoryService extends BaseService<Category> {
  constructor() {
    super("/categories")
  }

  /**
   * Tree yapısında kategorileri getir
   */
  async getTree(): Promise<CategoryTree[]> {
    const response: AxiosResponse<CategoryTree[]> = await api.get(
      `${this.endpoint}/tree`
    )
    return response.data
  }
}

export const categoryService = new CategoryService()
