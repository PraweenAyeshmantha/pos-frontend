import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { ProductStock, ProductWithStock, UpdateStockRequest, StockConfiguration, StockBatch } from '../types/stock';
import type { Product } from '../types/product';

export const stockService = {
  async getProductStocks(outletId?: number): Promise<ProductWithStock[]> {
    // Fetch all products
    const productsResponse = await apiClient.get<ApiResponse<Product[]>>('/admin/products');
    const products = productsResponse.data.data ?? [];

    // Fetch stocks for the outlet if specified
    let stocks: ProductStock[] = [];
    if (outletId) {
      const stocksResponse = await apiClient.get<ApiResponse<ProductStock[]>>(
        `/admin/stocks/outlet/${outletId}`
      );
      stocks = stocksResponse.data.data ?? [];
    }

    // Map products to ProductWithStock by combining product and stock data
    return products.map((product) => {
      const stock = stocks.find((s) => s.productId === product.id);
      return {
        id: stock?.id ?? 0,
        productId: product.id,
        productName: product.name,
        productType: product.productType ?? 'Simple',
        barcode: product.barcode,
        price: product.price,
        customStock: stock?.quantity ?? 0,
        isInStock: (stock?.quantity ?? 0) > 0,
      };
    });
  },

  async updateStock(data: UpdateStockRequest): Promise<ProductStock> {
    // Use the assign endpoint for updating stock
    const response = await apiClient.post<ApiResponse<ProductStock>>(
      '/admin/stocks/assign',
      {
        productId: data.productId,
        outletId: data.outletId,
        quantity: data.stockLevel,
        costPrice: data.costPrice !== undefined ? data.costPrice : null,
      }
    );
    if (!response.data.data) {
      throw new Error('Failed to update stock');
    }
    return response.data.data;
  },

  // Get low stock alerts for an outlet
  async getLowStockAlerts(outletId: number): Promise<ProductStock[]> {
    const response = await apiClient.get<ApiResponse<ProductStock[]>>(
      `/admin/stocks/outlet/${outletId}/low`
    );
    return response.data.data ?? [];
  },

  // Get all stock configurations
  async getStockConfigurations(): Promise<StockConfiguration[]> {
    const response = await apiClient.get<ApiResponse<StockConfiguration[]>>(
      '/admin/configurations/stock'
    );
    return response.data.data ?? [];
  },

  // Update stock configuration
  async updateStockConfiguration(key: string, value: string, description?: string): Promise<StockConfiguration> {
    const response = await apiClient.put<ApiResponse<StockConfiguration>>(
      `/admin/configurations/by-key?key=${key}&category=STOCK`,
      { configValue: value, description }
    );
    return response.data.data;
  },

  // Bulk update stock configurations
  async bulkUpdateStockConfigurations(configurations: Record<string, string>): Promise<StockConfiguration[]> {
    const response = await apiClient.post<ApiResponse<StockConfiguration[]>>(
      '/admin/configurations/bulk-update?category=STOCK',
      { configurations }
    );
    return response.data.data;
  },

  // Get stock batches for a product at an outlet
  async getStockBatches(productId: number, outletId: number): Promise<StockBatch[]> {
    const response = await apiClient.get<ApiResponse<StockBatch[]>>(
      `/admin/stocks/product/${productId}/outlet/${outletId}/batches`
    );
    return response.data.data ?? [];
  },
};
