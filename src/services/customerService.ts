import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { Customer, CreateCustomerRequest } from '../types/customer';
import type { LoyaltySummary } from '../types/loyalty';

const basePath = '/pos/customers';

export const customerService = {
  async getAll(options?: { active?: boolean }): Promise<Customer[]> {
    const query = options?.active !== undefined ? `?active=${options.active}` : '';
    const response = await apiClient.get<ApiResponse<Customer[]>>(`${basePath}${query}`);
    return response.data.data;
  },

  async getById(id: number): Promise<Customer> {
    const response = await apiClient.get<ApiResponse<Customer>>(`${basePath}/${id}`);
    return response.data.data;
  },

  async search(term: string): Promise<Customer[]> {
    const response = await apiClient.get<ApiResponse<Customer[]>>(`${basePath}/search?term=${encodeURIComponent(term)}`);
    return response.data.data;
  },

  async create(data: CreateCustomerRequest): Promise<Customer> {
    const response = await apiClient.post<ApiResponse<Customer>>(basePath, data);
    return response.data.data;
  },

  async update(id: number, data: CreateCustomerRequest): Promise<Customer> {
    const response = await apiClient.put<ApiResponse<Customer>>(`${basePath}/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${basePath}/${id}`);
  },

  async lookup(params: { phone?: string; loyaltyNumber?: string }): Promise<Customer> {
    const searchParams = new URLSearchParams();
    if (params.phone) {
      searchParams.set('phone', params.phone);
    }
    if (params.loyaltyNumber) {
      searchParams.set('loyaltyNumber', params.loyaltyNumber);
    }
    const query = searchParams.toString();
    const response = await apiClient.get<ApiResponse<Customer>>(`${basePath}/lookup?${query}`);
    return response.data.data;
  },

  async getLoyaltySummary(customerId: number): Promise<LoyaltySummary> {
    const response = await apiClient.get<ApiResponse<LoyaltySummary>>(`${basePath}/${customerId}/loyalty`);
    return response.data.data;
  },
};
