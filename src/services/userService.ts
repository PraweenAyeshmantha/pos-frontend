import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { UserAccount, CreateUserRequestPayload, UpdateUserRequestPayload } from '../types/user';
import type { UserCategory } from '../types/auth';

export const userService = {
  async getAll(): Promise<UserAccount[]> {
    const response = await apiClient.get<ApiResponse<UserAccount[]>>('/admin/users');
    return response.data.data ?? [];
  },

  async create(payload: CreateUserRequestPayload): Promise<UserAccount> {
    const response = await apiClient.post<ApiResponse<UserAccount>>('/admin/users', payload);
    if (!response.data.data) {
      throw new Error('Failed to create user');
    }
    return response.data.data;
  },

  async update(payload: UpdateUserRequestPayload): Promise<UserAccount> {
    const response = await apiClient.put<ApiResponse<UserAccount>>(`/admin/users/${payload.id}`, payload);
    if (!response.data.data) {
      throw new Error('Failed to update user');
    }
    return response.data.data;
  },

  async deactivate(id: number): Promise<void> {
    await apiClient.delete(`/admin/users/${id}`);
  },

  async getCategories(): Promise<UserCategory[]> {
    const response = await apiClient.get<ApiResponse<UserCategory[]>>('/admin/user-categories');
    return response.data.data ?? [];
  },
};
