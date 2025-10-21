import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { Product, UpdateProductBarcodeRequest } from '../types/product';

export const productService = {
  async getAll(): Promise<Product[]> {
    const response = await apiClient.get<ApiResponse<Product[]>>('/admin/products');
    return response.data.data ?? [];
  },

  async updateBarcode(data: UpdateProductBarcodeRequest): Promise<Product> {
    const response = await apiClient.put<ApiResponse<Product>>(
      `/admin/products/${data.id}/barcode`,
      { barcode: data.barcode }
    );
    if (!response.data.data) {
      throw new Error('Failed to update product barcode');
    }
    return response.data.data;
  },

  async generateBarcodeImage(productId: number): Promise<string> {
    const response = await apiClient.get<ApiResponse<{ barcodeImage: string }>>(
      `/admin/products/${productId}/barcode-image`
    );
    if (!response.data.data?.barcodeImage) {
      throw new Error('Failed to generate barcode image');
    }
    return response.data.data.barcodeImage;
  },
};
