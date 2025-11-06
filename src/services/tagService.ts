import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { CreateTaxonomyRequest, Tag, UpdateTaxonomyRequest } from '../types/taxonomy';

const basePath = '/admin/tags';

const buildQuery = (active?: boolean): string => {
  if (active === undefined) {
    return '';
  }
  return `?active=${active ? 'true' : 'false'}`;
};

export const tagService = {
  async getAll(options?: { active?: boolean }): Promise<Tag[]> {
    const response = await apiClient.get<ApiResponse<Tag[]>>(`${basePath}${buildQuery(options?.active)}`);
    return response.data.data ?? [];
  },

  async create(data: CreateTaxonomyRequest): Promise<Tag> {
    const response = await apiClient.post<ApiResponse<Tag>>(basePath, {
      name: data.name,
      description: data.description ?? null,
      recordStatus: data.recordStatus,
    });
    const tag = response.data.data;
    if (!tag) {
      throw new Error('Failed to create tag');
    }
    return tag;
  },

  async update(data: UpdateTaxonomyRequest): Promise<Tag> {
    const response = await apiClient.put<ApiResponse<Tag>>(`${basePath}/${data.id}`, {
      name: data.name,
      description: data.description ?? null,
      recordStatus: data.recordStatus,
    });
    const tag = response.data.data;
    if (!tag) {
      throw new Error('Failed to update tag');
    }
    return tag;
  },

  async archive(id: number): Promise<void> {
    await apiClient.delete(`${basePath}/${id}`);
  },
};
