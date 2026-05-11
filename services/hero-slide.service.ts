import api from "@/lib/api"
import { Upload } from "./upload.service"

export interface HeroSlide {
  id: string
  uploadId: string | null
  upload?: Upload | null
  imageUrl: string
  title: string | null
  altText: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface SaveHeroSlideDto {
  uploadId?: string
  imageUrl?: string
  title?: string | null
  altText?: string
  sortOrder?: number
  isActive?: boolean
}

/** Hero slaytlarını admin API üzerinden yönetir. */
class HeroSlideService {
  private endpoint = "/hero-slides"

  /** Admin paneli için tüm hero slaytlarını listeler. */
  async getAll(): Promise<HeroSlide[]> {
    const response = await api.get<HeroSlide[]>(`${this.endpoint}/admin`)
    return response.data
  }

  /** Yeni bir hero slaytı oluşturur. */
  async create(data: SaveHeroSlideDto): Promise<HeroSlide> {
    const response = await api.post<HeroSlide>(this.endpoint, data)
    return response.data
  }

  /** Mevcut hero slaytını günceller. */
  async update(id: string, data: SaveHeroSlideDto): Promise<HeroSlide> {
    const response = await api.patch<HeroSlide>(`${this.endpoint}/${id}`, data)
    return response.data
  }

  /** Hero slaytını listeden siler. */
  async delete(id: string): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`${this.endpoint}/${id}`)
    return response.data
  }
}

export const heroSlideService = new HeroSlideService()
