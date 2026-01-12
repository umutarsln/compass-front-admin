import api from "@/lib/api"
import { AxiosResponse } from "axios"

export type SellableType = "PRODUCT" | "VARIANT_COMBINATION" | "BUNDLE"

export interface Stock {
  id: string
  sellableType: SellableType
  sellableId: string
  availableQuantity: number
  reservedQuantity: number
  lowStockThreshold: number
  updatedAt: string
}

export interface UpdateStockDto {
  availableQuantity?: number
  lowStockThreshold?: number
}

export interface ReserveStockDto {
  sellableType: SellableType
  sellableId: string
  quantity: number
}

export interface ReleaseStockDto {
  sellableType: SellableType
  sellableId: string
  quantity: number
}

/**
 * Stock Service - Stok işlemleri
 */
export class StockService {
  private endpoint = "/stock"

  /**
   * Stok bilgisi getir
   */
  async getStock(
    sellableType: SellableType,
    sellableId: string
  ): Promise<Stock> {
    const response: AxiosResponse<Stock> = await api.get(
      `${this.endpoint}/${sellableType}/${sellableId}`
    )
    return response.data
  }

  /**
   * Stok güncelle
   */
  async updateStock(
    sellableType: SellableType,
    sellableId: string,
    data: UpdateStockDto
  ): Promise<Stock> {
    const response: AxiosResponse<Stock> = await api.patch(
      `${this.endpoint}/${sellableType}/${sellableId}`,
      data
    )
    return response.data
  }

  /**
   * Stok rezerve et
   */
  async reserveStock(data: ReserveStockDto): Promise<Stock> {
    const response: AxiosResponse<Stock> = await api.post(
      `${this.endpoint}/reserve`,
      data
    )
    return response.data
  }

  /**
   * Rezerve edilmiş stoku serbest bırak
   */
  async releaseStock(data: ReleaseStockDto): Promise<Stock> {
    const response: AxiosResponse<Stock> = await api.post(
      `${this.endpoint}/release`,
      data
    )
    return response.data
  }
}

export const stockService = new StockService()
