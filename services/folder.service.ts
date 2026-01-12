import api from "@/lib/api"
import { AxiosResponse } from "axios"
import { Upload } from "./upload.service"
import { User } from "./user.service"

export interface Folder {
  id: string
  name: string
  slug: string
  description: string | null
  parentId: string | null
  parent: Folder | null
  children: Folder[]
  path: string
  s3Prefix: string
  createdById: string
  createdBy?: User
  createdAt: string
  updatedAt: string
  uploads?: Upload[] // findOne'da döner
}

export interface CreateFolderDto {
  name: string
  description?: string
  parentId?: string
}

export interface UpdateFolderDto {
  name?: string
  description?: string
  parentId?: string
}

/**
 * Folder Service - Klasör işlemleri
 */
export class FolderService {
  private endpoint = "/folders"

  /**
   * Tüm klasörleri listele
   */
  async getAll(): Promise<Folder[]> {
    const response: AxiosResponse<Folder[]> = await api.get(this.endpoint)
    return response.data
  }

  /**
   * Klasörleri tree yapısında listele
   */
  async getTree(): Promise<Folder[]> {
    const response: AxiosResponse<Folder[]> = await api.get(`${this.endpoint}/tree`)
    return response.data
  }

  /**
   * Klasör detayını getir (içindeki klasörler ve uploadlar ile)
   */
  async getOne(id: string): Promise<Folder> {
    const response: AxiosResponse<Folder> = await api.get(`${this.endpoint}/${id}`)
    return response.data
  }

  /**
   * Belirli bir klasörün alt klasörlerini getir
   */
  async getChildren(parentId: string | null): Promise<Folder[]> {
    const allFolders = await this.getAll()
    return allFolders.filter((folder) => folder.parentId === parentId)
  }

  /**
   * Yeni klasör oluştur
   */
  async create(data: CreateFolderDto): Promise<Folder> {
    const response: AxiosResponse<Folder> = await api.post(this.endpoint, data)
    return response.data
  }

  /**
   * Klasör güncelle
   */
  async update(id: string, data: UpdateFolderDto): Promise<Folder> {
    const response: AxiosResponse<Folder> = await api.patch(`${this.endpoint}/${id}`, data)
    return response.data
  }

  /**
   * Klasör sil
   */
  async delete(id: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await api.delete(`${this.endpoint}/${id}`)
    return response.data
  }

  /**
   * Klasörü recursive olarak sil (içindeki her şeyle birlikte)
   */
  async deleteRecursive(id: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await api.delete(
      `${this.endpoint}/${id}/recursive`
    )
    return response.data
  }

  /**
   * Klasör ve alt klasörlerindeki toplam dosya boyutunu hesapla (MB)
   */
  async getTotalSize(id: string): Promise<number> {
    const response: AxiosResponse<{ totalSizeMB: number }> = await api.get(
      `${this.endpoint}/${id}/total-size`
    )
    return response.data.totalSizeMB
  }
}

export const folderService = new FolderService()
