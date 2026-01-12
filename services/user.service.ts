import api from "@/lib/api"
import { AxiosResponse } from "axios"

export interface User {
  id: string
  firstname: string
  lastname: string
  email: string
  phone: string
  roles: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateUserDto {
  firstname: string
  lastname: string
  email: string
  password: string
  phone: string
}

export interface UpdateUserDto {
  firstname?: string
  lastname?: string
  email?: string
  password?: string
  phone?: string
}

/**
 * User Service - Kullanıcı işlemleri
 */
export class UserService {
  private endpoint = "/users"

  /**
   * Tüm admin kullanıcılarını getir
   */
  async getAllAdmins(): Promise<User[]> {
    const response: AxiosResponse<User[]> = await api.get(`${this.endpoint}/admins`)
    return response.data
  }

  /**
   * Yeni admin kullanıcısı oluştur
   */
  async createAdmin(data: CreateUserDto): Promise<User> {
    const response: AxiosResponse<User> = await api.post(`${this.endpoint}/admins`, data)
    return response.data
  }

  /**
   * Admin kullanıcısını güncelle
   */
  async updateAdmin(id: string, data: UpdateUserDto): Promise<User> {
    const response: AxiosResponse<User> = await api.patch(`${this.endpoint}/admins/${id}`, data)
    return response.data
  }

  /**
   * Admin kullanıcısını sil
   */
  async deleteAdmin(id: string): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await api.delete(
      `${this.endpoint}/admins/${id}`
    )
    return response.data
  }
}

export const userService = new UserService()
