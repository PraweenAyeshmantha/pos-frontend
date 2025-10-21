import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { ProductStock, UpdateStockRequest } from '../types/stock';

export const stockService = {
  async getProductStocks(outletId?: number): Promise<ProductStock[]> {
    // Use outlet-specific endpoint if outlet is provided
    const endpoint = outletId ? `/admin/stocks/outlet/${outletId}` : '/admin/stocks';
    const response = await apiClient.get<ApiResponse<ProductStock[]>>(endpoint);
    return response.data.data ?? [];
  },

  async updateStock(data: UpdateStockRequest): Promise<ProductStock> {
    // Use the assign endpoint for updating stock
    const response = await apiClient.post<ApiResponse<ProductStock>>(
      '/admin/stocks/assign',
      {
        productId: data.productId,
        outletId: data.outletId,
        quantity: data.stockLevel,
      }
    );
    if (!response.data.data) {
      throw new Error('Failed to update stock');
    }
    return response.data.data;
  },
};
