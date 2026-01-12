import api from "@/lib/api"
import { AxiosResponse } from "axios"

/**
 * Base Service - Tüm CRUD işlemleri için temel metodlar
 */
export class BaseService<T> {
    protected endpoint: string

    constructor(endpoint: string) {
        this.endpoint = endpoint
    }

    /**
     * Tüm kayıtları getir
     */
    async getAll(params?: Record<string, any>): Promise<T[]> {
        const response: AxiosResponse<T[]> = await api.get(this.endpoint, { params })
        return response.data
    }

    /**
     * ID'ye göre tek kayıt getir
     */
    async getById(id: string): Promise<T> {
        const response: AxiosResponse<T> = await api.get(`${this.endpoint}/${id}`)
        return response.data
    }

    /**
     * Yeni kayıt oluştur
     */
    async create(data: Partial<T>): Promise<T> {
        const response: AxiosResponse<T> = await api.post(this.endpoint, data)
        return response.data
    }

    /**
     * Kayıt güncelle (PATCH - partial update)
     */
    async update(id: string, data: Partial<T>): Promise<T> {
        const response: AxiosResponse<T> = await api.patch(
            `${this.endpoint}/${id}`,
            data
        )
        return response.data
    }

    /**
     * Kayıt sil
     */
    async delete(id: string): Promise<{ message: string }> {
        const response: AxiosResponse<{ message: string }> = await api.delete(
            `${this.endpoint}/${id}`
        )
        return response.data
    }
}
