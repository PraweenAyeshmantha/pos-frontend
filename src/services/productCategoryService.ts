import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { CreateTaxonomyRequest, ProductCategory, UpdateTaxonomyRequest } from '../types/taxonomy';

const basePath = '/admin/product-categories';

const buildQuery = (active?: boolean): string => {
  if (active === undefined) {
    return '';
  }
  return `?active=${active ? 'true' : 'false'}`;
};

export const productCategoryService = {
  async getAll(options?: { active?: boolean }): Promise<ProductCategory[]> {
    const response = await apiClient.get<ApiResponse<ProductCategory[]>>(`${basePath}${buildQuery(options?.active)}`);
    return response.data.data ?? [];
  },

  async create(data: CreateTaxonomyRequest): Promise<ProductCategory> {
    const response = await apiClient.post<ApiResponse<ProductCategory>>(basePath, {
      name: data.name,
      description: data.description ?? null,
      recordStatus: data.recordStatus,
    });
    const category = response.data.data;
    if (!category) {
      throw new Error('Failed to create product category');
    }
    return category;
  },

  async update(data: UpdateTaxonomyRequest): Promise<ProductCategory> {
    const response = await apiClient.put<ApiResponse<ProductCategory>>(`${basePath}/${data.id}`, {
      name: data.name,
      description: data.description ?? null,
      recordStatus: data.recordStatus,
    });
    const category = response.data.data;
    if (!category) {
      throw new Error('Failed to update product category');
    }
    return category;
  },

  async archive(id: number): Promise<void> {
    await apiClient.delete(`${basePath}/${id}`);
  },
};
