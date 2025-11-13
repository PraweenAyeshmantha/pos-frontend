import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { Supplier, SupplierRequest } from '../types/supplier';

const adminBasePath = '/admin/suppliers';
const cashierBasePath = '/cashier/suppliers';

const mapResponse = (response?: Supplier[]): Supplier[] => response ?? [];

export const supplierService = {
  async getAll(options?: { active?: boolean }): Promise<Supplier[]> {
    const query = options?.active !== undefined ? `?active=${options.active}` : '';
    const response = await apiClient.get<ApiResponse<Supplier[]>>(`${adminBasePath}${query}`);
    return mapResponse(response.data.data);
  },

  async getLookup(includeInactive = false): Promise<Supplier[]> {
    const query = includeInactive ? '?includeInactive=true' : '';
    const response = await apiClient.get<ApiResponse<Supplier[]>>(`${cashierBasePath}${query}`);
    return mapResponse(response.data.data);
  },

  async getById(id: number): Promise<Supplier> {
    const response = await apiClient.get<ApiResponse<Supplier>>(`${adminBasePath}/${id}`);
    if (!response.data.data) {
      throw new Error('Failed to load supplier');
    }
    return response.data.data;
  },

  async create(payload: SupplierRequest): Promise<Supplier> {
    const response = await apiClient.post<ApiResponse<Supplier>>(adminBasePath, payload);
    if (!response.data.data) {
      throw new Error('Failed to create supplier');
    }
    return response.data.data;
  },

  async update(id: number, payload: SupplierRequest): Promise<Supplier> {
    const response = await apiClient.put<ApiResponse<Supplier>>(`${adminBasePath}/${id}`, payload);
    if (!response.data.data) {
      throw new Error('Failed to update supplier');
    }
    return response.data.data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`${adminBasePath}/${id}`);
  },
};
