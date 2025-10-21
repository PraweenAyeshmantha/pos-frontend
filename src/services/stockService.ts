import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { ProductStock, UpdateStockRequest } from '../types/stock';

export const stockService = {
  async getProductStocks(outletId?: number): Promise<ProductStock[]> {
    const params = outletId ? { outletId } : {};
    const response = await apiClient.get<ApiResponse<ProductStock[]>>('/admin/stocks', { params });
    return response.data.data ?? [];
  },

  async updateStock(data: UpdateStockRequest): Promise<ProductStock> {
    const response = await apiClient.put<ApiResponse<ProductStock>>(
      `/admin/stocks/${data.productId}`,
      data
    );
    if (!response.data.data) {
      throw new Error('Failed to update stock');
    }
    return response.data.data;
  },
};
