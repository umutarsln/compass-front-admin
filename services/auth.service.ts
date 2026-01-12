import api from "@/lib/api"
import { AxiosResponse } from "axios"

export interface RegisterDto {
  firstname: string
  lastname: string
  email: string
  password: string
  phone: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface RefreshTokenDto {
  refreshToken: string
}

export interface LogoutDto {
  refreshToken: string
}

export interface User {
  id: string
  firstname: string
  lastname: string
  email: string
  phone: string
  role: "USER" | "ADMIN"
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user?: User
}

export interface RegisterResponse extends AuthResponse {
  user: User
}

/**
 * Auth Service - Kimlik doğrulama işlemleri
 */
export class AuthService {
  private endpoint = "/auth"

  /**
   * Kullanıcı kaydı
   */
  async register(data: RegisterDto): Promise<RegisterResponse> {
    const response: AxiosResponse<RegisterResponse> = await api.post(
      `${this.endpoint}/register`,
      data
    )
    return response.data
  }

  /**
   * Kullanıcı girişi
   */
  async login(data: LoginDto): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await api.post(
      `${this.endpoint}/login`,
      data
    )
    return response.data
  }

  /**
   * Token yenileme
   */
  async refresh(data: RefreshTokenDto): Promise<AuthResponse> {
    const response: AxiosResponse<AuthResponse> = await api.post(
      `${this.endpoint}/refresh`,
      data
    )
    return response.data
  }

  /**
   * Kullanıcı çıkışı
   */
  async logout(data: LogoutDto): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await api.post(
      `${this.endpoint}/logout`,
      data
    )
    return response.data
  }
}

export const authService = new AuthService()
