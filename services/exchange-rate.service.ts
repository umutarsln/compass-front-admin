import api from "@/lib/api"
import { AxiosResponse } from "axios"

/** Mağaza için efektif kur özeti (public endpoint ile uyumlu). */
export interface ExchangeRatePublic {
  usdTryRate: number
  isManualOverride: boolean
  fetchedAt: string | null
  fetchSource: string | null
}

/** Admin tam kayıt (`exchange_settings`). */
export interface ExchangeSettingsAdmin {
  id: string
  fetchedUsdTryRate: string | null
  fetchedAt: string | null
  fetchSource: string | null
  manualUsdTryRate: string | null
  createdAt: string
  updatedAt: string
}

/**
 * USD/TRY kur API çağrıları (admin JWT gerekir; public GET istisna).
 */
export class ExchangeRateAdminService {
  private endpoint = "/exchange-rate"

  /**
   * Public özet (auth gerektirmez; panelde gösterim için kullanılabilir).
   */
  async getPublicSnapshot(): Promise<ExchangeRatePublic> {
    const response: AxiosResponse<ExchangeRatePublic> = await api.get(this.endpoint)
    return response.data
  }

  /**
   * Admin: tam ayar satırı.
   */
  async getAdminSettings(): Promise<ExchangeSettingsAdmin> {
    const response: AxiosResponse<ExchangeSettingsAdmin> = await api.get(
      `${this.endpoint}/admin`,
    )
    return response.data
  }

  /**
   * İnternetten kur çek ve kaydet.
   */
  async refreshFromInternet(): Promise<ExchangeRatePublic> {
    const response: AxiosResponse<ExchangeRatePublic> = await api.post(
      `${this.endpoint}/refresh`,
    )
    return response.data
  }

  /**
   * Manuel kur ayarla veya kaldır (`null` gönderildiğinde otomatik kur kullanılır).
   */
  async setManualRate(rate: number | null): Promise<ExchangeRatePublic> {
    const response: AxiosResponse<ExchangeRatePublic> = await api.patch(
      `${this.endpoint}/manual`,
      { manualUsdTryRate: rate },
    )
    return response.data
  }
}

export const exchangeRateAdminService = new ExchangeRateAdminService()
