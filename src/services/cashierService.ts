import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { Cashier, CreateCashierRequest, UpdateCashierRequest } from '../types/cashier';

export const cashierService = {
  async getAll(): Promise<Cashier[]> {
    const response = await apiClient.get<ApiResponse<Cashier[]>>('/admin/cashiers');
    return response.data.data ?? [];
  },

  async create(data: CreateCashierRequest): Promise<Cashier> {
    const response = await apiClient.post<ApiResponse<Cashier>>('/admin/cashiers', data);
    if (!response.data.data) {
      throw new Error('Failed to create cashier');
    }
    return response.data.data;
  },

  async update(data: UpdateCashierRequest): Promise<Cashier> {
    const response = await apiClient.put<ApiResponse<Cashier>>(`/admin/cashiers/${data.id}`, data);
    if (!response.data.data) {
      throw new Error('Failed to update cashier');
    }
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/admin/cashiers/${id}`);
  },
};
