import api from '@/lib/api';
import { AxiosResponse } from 'axios';

export interface PersonalizationForm {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  description?: string | null;
  isActive: boolean;
  currentPublishedVersionId?: string | null;
  currentPublishedVersion?: PersonalizationFormVersion | null;
  versions?: PersonalizationFormVersion[];
  fields?: PersonalizationField[];
  conditions?: PersonalizationCondition[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalizationFormVersion {
  id: string;
  formId: string;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  schemaSnapshot: any;
  createdAt: Date;
}

export interface PersonalizationField {
  id: string;
  formId: string;
  key: string;
  title: string;
  subtitle?: string | null;
  helperText?: string | null;
  required: boolean;
  type: string;
  defaultValue?: any;
  validationRules?: any;
  pricingRules?: any;
  config?: any;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalizationCondition {
  id: string;
  formId: string;
  fieldId?: string | null;
  ifJson: any;
  thenJson: any;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePersonalizationFormDto {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdatePersonalizationFormDto {
  title?: string;
  subtitle?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface CreatePersonalizationFieldDto {
  formId: string;
  key: string;
  title: string;
  subtitle?: string | null;
  helperText?: string | null;
  required?: boolean;
  type: string;
  defaultValue?: any;
  validationRules?: any;
  pricingRules?: any;
  config?: any;
  orderIndex?: number;
}

export interface UpdatePersonalizationFieldDto {
  key?: string;
  title?: string;
  subtitle?: string | null;
  helperText?: string | null;
  required?: boolean;
  type?: string;
  defaultValue?: any;
  validationRules?: any;
  pricingRules?: any;
  config?: any;
  orderIndex?: number;
}

export interface CreatePersonalizationConditionDto {
  formId: string;
  fieldId?: string | null;
  ifJson: any;
  thenJson: any;
  orderIndex?: number;
}

export interface UpdatePersonalizationConditionDto {
  fieldId?: string | null;
  ifJson?: any;
  thenJson?: any;
  orderIndex?: number;
}

export interface ValidatePersonalizationDto {
  productId: string;
  variantId?: string;
  formValues: Record<string, any>;
  fileIds?: string[];
}

class PersonalizationService {
  private endpoint = '/personalization';

  async getForms(): Promise<PersonalizationForm[]> {
    const response: AxiosResponse<PersonalizationForm[]> = await api.get(
      `${this.endpoint}/forms`,
    );
    return response.data;
  }

  async getForm(id: string): Promise<PersonalizationForm> {
    const response: AxiosResponse<PersonalizationForm> = await api.get(
      `${this.endpoint}/forms/${id}`,
    );
    return response.data;
  }

  async createForm(
    createDto: CreatePersonalizationFormDto,
  ): Promise<PersonalizationForm> {
    const response: AxiosResponse<PersonalizationForm> = await api.post(
      `${this.endpoint}/forms`,
      createDto,
    );
    return response.data;
  }

  async updateForm(
    id: string,
    updateDto: UpdatePersonalizationFormDto,
  ): Promise<PersonalizationForm> {
    const response: AxiosResponse<PersonalizationForm> = await api.patch(
      `${this.endpoint}/forms/${id}`,
      updateDto,
    );
    return response.data;
  }

  async deleteForm(id: string): Promise<void> {
    await api.delete(`${this.endpoint}/forms/${id}`);
  }

  async createVersion(formId: string): Promise<PersonalizationFormVersion> {
    const response: AxiosResponse<PersonalizationFormVersion> = await api.post(
      `${this.endpoint}/forms/${formId}/versions`,
    );
    return response.data;
  }

  async publishVersion(versionId: string): Promise<PersonalizationFormVersion> {
    const response: AxiosResponse<PersonalizationFormVersion> = await api.post(
      `${this.endpoint}/versions/${versionId}/publish`,
      { versionId },
    );
    return response.data;
  }

  async archiveVersion(versionId: string): Promise<PersonalizationFormVersion> {
    const response: AxiosResponse<PersonalizationFormVersion> = await api.post(
      `${this.endpoint}/versions/${versionId}/archive`,
    );
    return response.data;
  }

  async getFields(formId: string): Promise<PersonalizationField[]> {
    const response: AxiosResponse<PersonalizationField[]> = await api.get(
      `${this.endpoint}/forms/${formId}/fields`,
    );
    return response.data;
  }

  async createField(
    createDto: CreatePersonalizationFieldDto,
  ): Promise<PersonalizationField> {
    const response: AxiosResponse<PersonalizationField> = await api.post(
      `${this.endpoint}/forms/${createDto.formId}/fields`,
      createDto,
    );
    return response.data;
  }

  async updateField(
    id: string,
    updateDto: UpdatePersonalizationFieldDto,
  ): Promise<PersonalizationField> {
    const response: AxiosResponse<PersonalizationField> = await api.patch(
      `${this.endpoint}/fields/${id}`,
      updateDto,
    );
    return response.data;
  }

  async deleteField(id: string): Promise<void> {
    await api.delete(`${this.endpoint}/fields/${id}`);
  }

  async getConditions(formId: string): Promise<PersonalizationCondition[]> {
    const response: AxiosResponse<PersonalizationCondition[]> = await api.get(
      `${this.endpoint}/forms/${formId}/conditions`,
    );
    return response.data;
  }

  async createCondition(
    createDto: CreatePersonalizationConditionDto,
  ): Promise<PersonalizationCondition> {
    const response: AxiosResponse<PersonalizationCondition> = await api.post(
      `${this.endpoint}/forms/${createDto.formId}/conditions`,
      createDto,
    );
    return response.data;
  }

  async updateCondition(
    id: string,
    updateDto: UpdatePersonalizationConditionDto,
  ): Promise<PersonalizationCondition> {
    const response: AxiosResponse<PersonalizationCondition> = await api.patch(
      `${this.endpoint}/conditions/${id}`,
      updateDto,
    );
    return response.data;
  }

  async deleteCondition(id: string): Promise<void> {
    await api.delete(`${this.endpoint}/conditions/${id}`);
  }

  async validatePersonalization(
    validateDto: ValidatePersonalizationDto,
  ): Promise<{ valid: boolean; message: string }> {
    const response: AxiosResponse<{ valid: boolean; message: string }> =
      await api.post(`${this.endpoint}/validate`, validateDto);
    return response.data;
  }
}

export const personalizationService = new PersonalizationService();
