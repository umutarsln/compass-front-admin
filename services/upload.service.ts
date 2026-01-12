import api from "@/lib/api"
import { AxiosResponse } from "axios"
import { Folder } from "./folder.service"
import { User } from "./user.service"

export interface Upload {
  id: string
  filename: string
  displayName: string | null
  mimeType: string
  size: number
  sizeMB: number
  s3Key: string
  s3Bucket: string
  s3Url: string
  hash: string
  folderId: string | null
  folder: Folder | null
  seoTitle: string | null
  seoDescription: string | null
  seoKeywords: string[] | null
  createdById: string
  createdBy?: User
  createdAt: string
  updatedAt: string
}

export interface CreateUploadDto {
  displayName?: string
  folderId?: string
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
}

export interface UpdateUploadDto {
  displayName?: string
  folderId?: string | null
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string[]
}

/**
 * Upload Service - Dosya işlemleri
 */
export class UploadService {
  private endpoint = "/uploads"

  /**
   * Tüm dosyaları listele
   */
  async getAll(): Promise<Upload[]> {
    const response: AxiosResponse<Upload[]> = await api.get(this.endpoint)
    return response.data
  }

  /**
   * Klasördeki dosyaları listele
   */
  async getByFolder(folderId: string): Promise<Upload[]> {
    const response: AxiosResponse<Upload[]> = await api.get(`${this.endpoint}/folder/${folderId}`)
    return response.data
  }

  /**
   * Root klasördeki dosyaları listele (folderId null olanlar)
   */
  async getRoot(): Promise<Upload[]> {
    const allUploads = await this.getAll()
    return allUploads.filter((upload) => !upload.folderId)
  }

  /**
   * Dosya detayını getir
   */
  async getOne(id: string): Promise<Upload> {
    const response: AxiosResponse<Upload> = await api.get(`${this.endpoint}/${id}`)
    return response.data
  }

  /**
   * Dosya yükle
   */
  async upload(file: File, data?: CreateUploadDto): Promise<Upload> {
    const formData = new FormData()
    formData.append("file", file)
    
    if (data?.displayName) formData.append("displayName", data.displayName)
    if (data?.folderId) formData.append("folderId", data.folderId)
    if (data?.seoTitle) formData.append("seoTitle", data.seoTitle)
    if (data?.seoDescription) formData.append("seoDescription", data.seoDescription)
    if (data?.seoKeywords) {
      data.seoKeywords.forEach((keyword) => formData.append("seoKeywords", keyword))
    }

    const response: AxiosResponse<Upload> = await api.post(this.endpoint, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data
  }

  /**
   * Dosya güncelle
   */
  async update(id: string, data: UpdateUploadDto): Promise<Upload> {
    const response: AxiosResponse<Upload> = await api.patch(`${this.endpoint}/${id}`, data)
    return response.data
  }

  /**
   * Dosya sil
   */
  async delete(id: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await api.delete(`${this.endpoint}/${id}`)
    return response.data
  }

  /**
   * Dosya indirme URL'i al (presigned URL)
   */
  async getDownloadUrl(id: string): Promise<{ url: string; expiresIn: number }> {
    const response: AxiosResponse<{ url: string; expiresIn: number }> = await api.get(
      `${this.endpoint}/${id}/download`
    )
    return response.data
  }

  /**
   * Dosyanın kullanıldığı relation'ları kontrol et
   */
  async checkRelations(id: string): Promise<{
    hasRelations: boolean
    relations: {
      productGalleries: number
      categories: number
    }
  }> {
    const response: AxiosResponse<{
      hasRelations: boolean
      relations: {
        productGalleries: number
        categories: number
      }
    }> = await api.get(`${this.endpoint}/${id}/relations`)
    return response.data
  }
}

export const uploadService = new UploadService()
