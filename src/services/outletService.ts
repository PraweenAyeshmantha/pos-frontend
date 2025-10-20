import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { Outlet, CreateOutletRequest, UpdateOutletRequest } from '../types/outlet';

export const outletService = {
  async getAll(): Promise<Outlet[]> {
    const response = await apiClient.get<ApiResponse<Outlet[]>>('/admin/outlets');
    return response.data.data ?? [];
  },

  async getById(id: number): Promise<Outlet> {
    const response = await apiClient.get<ApiResponse<Outlet>>(`/admin/outlets/${id}`);
    if (!response.data.data) {
      throw new Error('Outlet not found');
    }
    return response.data.data;
  },

  async create(data: CreateOutletRequest): Promise<Outlet> {
    const response = await apiClient.post<ApiResponse<Outlet>>('/admin/outlets', data);
    if (!response.data.data) {
      throw new Error('Failed to create outlet');
    }
    return response.data.data;
  },

  async update(data: UpdateOutletRequest): Promise<Outlet> {
    const response = await apiClient.put<ApiResponse<Outlet>>(`/admin/outlets/${data.id}`, data);
    if (!response.data.data) {
      throw new Error('Failed to update outlet');
    }
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/admin/outlets/${id}`);
  },
};
