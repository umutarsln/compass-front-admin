import api from "@/lib/api"
import { AxiosResponse } from "axios"

export enum OrderStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    PROCESSING = 'PROCESSING',
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
    REFUNDED = 'REFUNDED',
}

export enum PaymentProvider {
    IYZICO = 'IYZICO',
    QNBPAY = 'QNBPAY',
    IBAN_EFT = 'IBAN_EFT',
    FREE_ORDER = 'FREE_ORDER',
}

export interface OrderItem {
    id: string
    productId: string
    variantId: string | null
    productName: string
    quantity: number
    unitPrice: number
    discountedPrice: number | null
    totalPrice: number
    currency: string
    createdAt: string
    product?: {
        id: string
        slug: string
        galleries?: Array<{
            mainImage?: {
                s3Url: string
            } | null
            thumbnailImage?: {
                s3Url: string
            } | null
        }>
    } | null
    variant?: {
        id: string
        galleries?: Array<{
            mainImage?: {
                s3Url: string
            } | null
            thumbnailImage?: {
                s3Url: string
            } | null
        }>
    } | null
    personalization?: any | null
}

/** Kayıtlı kullanıcı bilgisi (sipariş kayıtlı kullanıcıya aitse dolu) */
export interface OrderUser {
    email: string
    firstname: string
    lastname: string
    phone: string | null
}

export interface Order {
    id: string
    orderNo: string
    userId: string | null
    /** Kayıtlı kullanıcı siparişi ise ad, soyad, email, telefon */
    user?: OrderUser | null
    cartId: string | null
    guestEmail: string | null
    guestPhone: string | null
    guestFirstName: string | null
    guestLastName: string | null
    status: OrderStatus
    subtotal: number
    shippingCost: number
    discount: number
    total: number
    currency: string
    shippingAddress: {
        firstName: string
        lastName: string
        phone: string
        address: string
        city: string
        district: string
        postalCode: string
        country?: string
    } | null
    billingAddress: {
        firstName: string
        lastName: string
        phone: string
        address: string
        city: string
        district: string
        postalCode: string
        country?: string
        taxNumber?: string
        taxOffice?: string
    } | null
    notes: string | null
    items: OrderItem[]
    paymentProvider: PaymentProvider | null
    paymentAttemptId?: string | null
    paymentProviderOrderRef?: string | null
    createdAt: string
    updatedAt: string
}

export interface GetOrdersParams {
    status?: OrderStatus
    limit?: number
    offset?: number
    search?: string
    sortBy?: string
    sortOrder?: 'ASC' | 'DESC'
}

export interface GetOrdersResponse {
    orders: Order[]
    total: number
}

export interface UpdateOrderStatusDto {
    status: OrderStatus
}

/**
 * Order Service - Sipariş işlemleri
 */
export class OrderService {
    private endpoint = "/orders"

    /**
     * Tüm siparişleri getir (filtreleme ve pagination ile)
     */
    async getAll(params?: GetOrdersParams): Promise<GetOrdersResponse> {
        const response: AxiosResponse<GetOrdersResponse> = await api.get(this.endpoint, { params })
        return response.data
    }

    /**
     * Sipariş detayını getir
     */
    async getById(id: string): Promise<Order> {
        const response: AxiosResponse<Order> = await api.get(`${this.endpoint}/${id}`)
        return response.data
    }

    /**
     * Sipariş durumunu güncelle
     */
    async updateStatus(id: string, status: OrderStatus): Promise<Order> {
        const response: AxiosResponse<Order> = await api.patch(
            `${this.endpoint}/${id}/status`,
            { status }
        )
        return response.data
    }

    /**
     * Siparişi admin görünümünden soft delete ile kaldırır.
     */
    async delete(id: string): Promise<{ message: string }> {
        const response: AxiosResponse<{ message: string }> = await api.delete(`${this.endpoint}/${id}`)
        return response.data
    }
}

export const orderService = new OrderService()
