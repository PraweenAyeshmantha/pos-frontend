import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { ProductStock, UpdateStockRequest } from '../types/stock';

export const stockService = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getProductStocks(_outletId?: number): Promise<ProductStock[]> {
    // Fetch all stocks without outlet filter - backend may not support outlet filtering
    const response = await apiClient.get<ApiResponse<ProductStock[]>>('/admin/stocks');
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
