import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { Brand, CreateTaxonomyRequest, UpdateTaxonomyRequest } from '../types/taxonomy';

const basePath = '/admin/brands';

const buildQuery = (active?: boolean): string => {
  if (active === undefined) {
    return '';
  }
  return `?active=${active ? 'true' : 'false'}`;
};

export const brandService = {
  async getAll(options?: { active?: boolean }): Promise<Brand[]> {
    const response = await apiClient.get<ApiResponse<Brand[]>>(`${basePath}${buildQuery(options?.active)}`);
    return response.data.data ?? [];
  },

  async create(data: CreateTaxonomyRequest): Promise<Brand> {
    const response = await apiClient.post<ApiResponse<Brand>>(basePath, {
      name: data.name,
      description: data.description ?? null,
      recordStatus: data.recordStatus,
    });
    const brand = response.data.data;
    if (!brand) {
      throw new Error('Failed to create brand');
    }
    return brand;
  },

  async update(data: UpdateTaxonomyRequest): Promise<Brand> {
    const response = await apiClient.put<ApiResponse<Brand>>(`${basePath}/${data.id}`, {
      name: data.name,
      description: data.description ?? null,
      recordStatus: data.recordStatus,
    });
    const brand = response.data.data;
    if (!brand) {
      throw new Error('Failed to update brand');
    }
    return brand;
  },

  async archive(id: number): Promise<void> {
    await apiClient.delete(`${basePath}/${id}`);
  },
};
