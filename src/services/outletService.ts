import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { Outlet } from '../types/outlet';

export const outletService = {
  async getAll(): Promise<Outlet[]> {
    const response = await apiClient.get<ApiResponse<Outlet[]>>('/admin/outlets');
    return response.data.data ?? [];
  },
};
