import { BaseService } from "./base.service"
import { AxiosResponse } from "axios"
import api from "@/lib/api"

export type CouponType = "PERCENTAGE" | "FIXED"

export interface Coupon {
  id: string
  code: string
  name: string
  description: string | null
  type: CouponType
  discountValue: number
  usageCount: number
  usageLimit: number | null
  minOrderAmount: number | null
  validFrom: string | null
  validTo: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateCouponDto {
  code: string
  name: string
  description?: string
  type: CouponType
  discountValue: number
  usageLimit?: number
  minOrderAmount?: number
  validFrom?: string
  validTo?: string
}

export interface UpdateCouponDto {
  code?: string
  name?: string
  description?: string | null
  type?: CouponType
  discountValue?: number
  usageLimit?: number | null
  minOrderAmount?: number | null
  validFrom?: string | null
  validTo?: string | null
}

/**
 * Coupon Service - Kupon CRUD işlemleri (Admin)
 */
export class CouponService extends BaseService<Coupon> {
  constructor() {
    super("/coupons")
  }

  async create(data: CreateCouponDto): Promise<Coupon> {
    const response: AxiosResponse<Coupon> = await api.post(this.endpoint, data)
    return response.data
  }

  async update(id: string, data: UpdateCouponDto): Promise<Coupon> {
    const response: AxiosResponse<Coupon> = await api.patch(
      `${this.endpoint}/${id}`,
      data
    )
    return response.data
  }
}

export const couponService = new CouponService()
