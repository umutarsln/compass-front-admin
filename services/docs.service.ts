import api from "@/lib/api"
import { AxiosResponse } from "axios"

export interface DocMetadata {
    module: string
    title: string
    description: string
    path: string
}

export interface DocsListResponse {
    docs: DocMetadata[]
}

export interface DocResponse {
    module: string
    content: string
    title: string
    lastModified?: string
}

/**
 * Docs Service - Documentation işlemleri
 */
export class DocsService {
    private endpoint = "/docs"

    /**
     * Tüm documentation'ları getir
     */
    async getAllDocs(accessToken?: string): Promise<DocsListResponse> {
        const config = accessToken
            ? {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
            : {}
        const response: AxiosResponse<DocsListResponse> = await api.get(this.endpoint, config)
        return response.data
    }

    /**
     * Belirli module'ün documentation'ını getir
     */
    async getDocByModule(module: string, accessToken?: string): Promise<DocResponse> {
        const config = accessToken
            ? {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
            : {}
        const response: AxiosResponse<DocResponse> = await api.get(`${this.endpoint}/${module}`, config)
        return response.data
    }
}

export const docsService = new DocsService()
