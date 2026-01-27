import api from "@/lib/api"
import { AxiosResponse } from "axios"

export interface PaymentSettings {
  id: string
  iyzicoApiKey: string | null
  iyzicoSecretKey: string | null
  iyzicoBaseUrl: string | null
  iyzicoEnabled: boolean
  ibanNumber: string | null
  accountName: string | null
  bankName: string | null
  whatsappNumber: string | null
  ibanEftEnabled: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Payment Settings Service - Ödeme ayarları işlemleri
 */
export class PaymentSettingsService {
  private endpoint = "/payment-settings"

  /**
   * Ödeme ayarlarını getir
   */
  async getSettings(): Promise<PaymentSettings> {
    const response: AxiosResponse<PaymentSettings> = await api.get(this.endpoint)
    return response.data
  }

  /**
   * Ödeme ayarlarını güncelle
   */
  async updateSettings(updates: Partial<PaymentSettings>): Promise<PaymentSettings> {
    const response: AxiosResponse<PaymentSettings> = await api.patch(this.endpoint, updates)
    return response.data
  }
}

export const paymentSettingsService = new PaymentSettingsService()
