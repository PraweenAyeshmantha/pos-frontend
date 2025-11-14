import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { ProductStock, ProductWithStock, UpdateStockRequest, StockConfiguration, StockBatch } from '../types/stock';
import type { Product } from '../types/product';
import type {
  StockAdjustment,
  StockAdjustmentRequest,
  CycleCountRequest,
  CycleCountTask,
  StockTransferRequest,
  StockTransfer,
  StockTransferStatus,
} from '../types/inventory';

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
        reorderLevel: stock?.reorderLevel,
        maxStockLevel: stock?.maxStockLevel,
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

  async recordAdjustment(data: StockAdjustmentRequest): Promise<StockAdjustment> {
    const response = await apiClient.post<ApiResponse<StockAdjustment>>('/admin/stocks/adjustments', data);
    if (!response.data.data) {
      throw new Error('Failed to record stock adjustment');
    }
    return response.data.data;
  },

  async getAdjustments(params?: {
    outletId?: number;
    productId?: number;
    reason?: string;
    limit?: number;
  }): Promise<StockAdjustment[]> {
    const search = new URLSearchParams();
    if (params?.outletId) search.append('outletId', params.outletId.toString());
    if (params?.productId) search.append('productId', params.productId.toString());
    if (params?.reason) search.append('reason', params.reason);
    if (params?.limit) search.append('limit', params.limit.toString());
    const qs = search.toString();
    const response = await apiClient.get<ApiResponse<StockAdjustment[]>>(
      `/admin/stocks/adjustments${qs ? `?${qs}` : ''}`
    );
    return response.data.data ?? [];
  },

  async recordCycleCount(request: CycleCountRequest): Promise<CycleCountTask> {
    const response = await apiClient.post<ApiResponse<CycleCountTask>>('/admin/stocks/cycle-counts', request);
    if (!response.data.data) {
      throw new Error('Failed to record cycle count');
    }
    return response.data.data;
  },

  async getCycleCounts(params?: { outletId?: number; status?: string; limit?: number }): Promise<CycleCountTask[]> {
    const search = new URLSearchParams();
    if (params?.outletId) search.append('outletId', params.outletId.toString());
    if (params?.status) search.append('status', params.status);
    if (params?.limit) search.append('limit', params.limit.toString());
    const qs = search.toString();
    const response = await apiClient.get<ApiResponse<CycleCountTask[]>>(
      `/admin/stocks/cycle-counts${qs ? `?${qs}` : ''}`
    );
    return response.data.data ?? [];
  },

  async createTransfer(request: StockTransferRequest): Promise<StockTransfer> {
    const response = await apiClient.post<ApiResponse<StockTransfer>>('/admin/stocks/transfers', request);
    if (!response.data.data) {
      throw new Error('Failed to create transfer');
    }
    return response.data.data;
  },

  async updateTransferStatus(id: number, status: StockTransferStatus): Promise<StockTransfer> {
    const response = await apiClient.post<ApiResponse<StockTransfer>>(
      `/admin/stocks/transfers/${id}/status`,
      { status }
    );
    if (!response.data.data) {
      throw new Error('Failed to update transfer status');
    }
    return response.data.data;
  },

  async getTransfers(params?: {
    sourceOutletId?: number;
    targetOutletId?: number;
    status?: StockTransferStatus;
    limit?: number;
  }): Promise<StockTransfer[]> {
    const search = new URLSearchParams();
    if (params?.sourceOutletId) search.append('sourceOutletId', params.sourceOutletId.toString());
    if (params?.targetOutletId) search.append('targetOutletId', params.targetOutletId.toString());
    if (params?.status) search.append('status', params.status);
    if (params?.limit) search.append('limit', params.limit.toString());
    const qs = search.toString();
    const response = await apiClient.get<ApiResponse<StockTransfer[]>>(
      `/admin/stocks/transfers${qs ? `?${qs}` : ''}`
    );
    return response.data.data ?? [];
  },
};
