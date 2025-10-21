import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { ProductStock, ProductWithStock, UpdateStockRequest } from '../types/stock';
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
        productType: product.productType,
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
      }
    );
    if (!response.data.data) {
      throw new Error('Failed to update stock');
    }
    return response.data.data;
  },
};
