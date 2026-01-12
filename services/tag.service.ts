import { BaseService } from "./base.service"
import api from "@/lib/api"
import { AxiosResponse } from "axios"

export interface Tag {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  createdAt: string
  updatedAt: string
}

export interface CreateTagDto {
  name: string
  description?: string
  color?: string
}

export interface UpdateTagDto extends Partial<CreateTagDto> {}

/**
 * Tag Service - Tag işlemleri
 */
export class TagService extends BaseService<Tag> {
  constructor() {
    super("/tags")
  }
}

export const tagService = new TagService()
