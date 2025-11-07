import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { Product, ProductUpsertRequest, UpdateProductBarcodeRequest } from '../types/product';

const normalizeProduct = (product: Product): Product => ({
  ...product,
  stockStatus: product.stockStatus ?? 'IN_STOCK',
  productType: product.productType ?? 'Simple',
  tags: product.tags ?? [],
  tagIds: product.tagIds ?? [],
  brands: product.brands ?? [],
  brandIds: product.brandIds ?? [],
});

export const productService = {
  async getAll(): Promise<Product[]> {
    const response = await apiClient.get<ApiResponse<Product[]>>('/admin/products');
    const products = response.data.data ?? [];
    return products.map(normalizeProduct);
  },

  async getById(id: number): Promise<Product> {
    const response = await apiClient.get<ApiResponse<Product>>(`/admin/products/${id}`);
    if (!response.data.data) {
      throw new Error('Failed to load product');
    }
    return normalizeProduct(response.data.data);
  },

  async updateBarcode(data: UpdateProductBarcodeRequest): Promise<Product> {
    const response = await apiClient.put<ApiResponse<Product>>(
      `/admin/products/${data.id}/barcode`,
      { barcode: data.barcode }
    );
    if (!response.data.data) {
      throw new Error('Failed to update product barcode');
    }
    return normalizeProduct(response.data.data);
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

  async create(data: ProductUpsertRequest): Promise<Product> {
    const response = await apiClient.post<ApiResponse<Product>>('/admin/products', data);
    if (!response.data.data) {
      throw new Error(response.data.message ?? 'Failed to create product');
    }
    return normalizeProduct(response.data.data);
  },

  async update(id: number, data: ProductUpsertRequest): Promise<Product> {
    const response = await apiClient.put<ApiResponse<Product>>(`/admin/products/${id}`, data);
    if (!response.data.data) {
      throw new Error(response.data.message ?? 'Failed to update product');
    }
    return normalizeProduct(response.data.data);
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/admin/products/${id}`);
  },
};
