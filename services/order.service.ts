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
}

export interface Order {
    id: string
    userId: string | null
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
    createdAt: string
    updatedAt: string
}

export interface GetOrdersParams {
    status?: OrderStatus
    limit?: number
    offset?: number
    search?: string
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
}

export const orderService = new OrderService()
