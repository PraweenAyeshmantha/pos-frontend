import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { Order, OrderFilters } from '../types/order';

const buildQuery = (filters?: OrderFilters): string => {
  if (!filters) {
    return '';
  }

  const params = new URLSearchParams();
  
  if (filters.outletId !== undefined) {
    params.append('outletId', filters.outletId.toString());
  }
  
  if (filters.status) {
    params.append('status', filters.status);
  }
  
  if (filters.isOnline !== undefined) {
    params.append('isOnline', filters.isOnline.toString());
  }
  
  if (filters.startDate) {
    params.append('startDate', filters.startDate);
  }
  
  if (filters.endDate) {
    params.append('endDate', filters.endDate);
  }
  
  if (filters.cashierId !== undefined) {
    params.append('cashierId', filters.cashierId.toString());
  }
  
  if (filters.cashierUsername) {
    params.append('cashierUsername', filters.cashierUsername);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
};

export const orderService = {
  async getAll(filters?: OrderFilters): Promise<Order[]> {
    const query = buildQuery(filters);
    const response = await apiClient.get<ApiResponse<Order[]>>(`/admin/orders${query}`);
    return response.data.data ?? [];
  },

  async getById(id: number): Promise<Order> {
    const response = await apiClient.get<ApiResponse<Order>>(`/admin/orders/${id}`);
    if (!response.data.data) {
      throw new Error('Failed to load order');
    }
    return response.data.data;
  },

  async getByOrderNumber(orderNumber: string): Promise<Order> {
    const response = await apiClient.get<ApiResponse<Order>>(`/admin/orders/by-number/${orderNumber}`);
    if (!response.data.data) {
      throw new Error('Failed to load order');
    }
    return response.data.data;
  },
};
