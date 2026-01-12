import api from "@/lib/api"
import { AxiosResponse } from "axios"
import { User } from "./user.service"

export interface GetCustomersParams {
  search?: string
  sortBy?: "firstname" | "lastname" | "email" | "phone" | "createdAt"
  sortOrder?: "asc" | "desc"
}

/**
 * Customer Service - Müşteri işlemleri
 */
export class CustomerService {
  private endpoint = "/users/customers"

  /**
   * Tüm müşterileri getir (search ve sort ile)
   */
  async getAll(params?: GetCustomersParams): Promise<User[]> {
    const response: AxiosResponse<User[]> = await api.get(this.endpoint, { params })
    return response.data
  }
}

export const customerService = new CustomerService()
