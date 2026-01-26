import api from "@/lib/api"
import { AxiosResponse } from "axios"

/**
 * Cache Service - Cache yönetimi işlemleri
 */
export class CacheService {
  private endpoint = "/cache"

  /**
   * Cache'i temizle (sadece admin)
   * @param prefix Temizlenecek cache key'lerinin prefix'i (örn: "store:", "product:"). Belirtilmezse tüm cache temizlenir.
   */
  async clearCache(prefix?: string): Promise<{ message: string; deletedKeys: number }> {
    const params = prefix ? { prefix } : {}
    const response: AxiosResponse<{ message: string; deletedKeys: number }> = await api.delete(
      this.endpoint,
      { params }
    )
    return response.data
  }
}

export const cacheService = new CacheService()
