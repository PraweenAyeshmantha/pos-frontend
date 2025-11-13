import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { Cashier, CreateCashierRequest, UpdateCashierRequest, CashierCandidate } from '../types/cashier';
import type { Outlet } from '../types/outlet';

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

  async getCurrentOutlets(): Promise<Outlet[]> {
    const response = await apiClient.get<ApiResponse<Outlet[]>>('/admin/cashiers/current/outlets');
    return response.data.data ?? [];
  },

  async getCandidates(): Promise<CashierCandidate[]> {
    const response = await apiClient.get<ApiResponse<CashierCandidate[]>>('/admin/cashiers/candidates');
    return response.data.data ?? [];
  },
};
