import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { SupplierProduct, SupplierProductRequest } from '../types/supplierProduct';

const buildPath = (supplierId: number, suffix = '') => `/admin/suppliers/${supplierId}/products${suffix}`;

export const supplierProductService = {
  async list(supplierId: number): Promise<SupplierProduct[]> {
    const response = await apiClient.get<ApiResponse<SupplierProduct[]>>(buildPath(supplierId));
    return response.data.data ?? [];
  },

  async create(supplierId: number, payload: SupplierProductRequest): Promise<SupplierProduct> {
    const response = await apiClient.post<ApiResponse<SupplierProduct>>(buildPath(supplierId), payload);
    if (!response.data.data) {
      throw new Error('Failed to create supplier product');
    }
    return response.data.data;
  },

  async update(supplierId: number, supplierProductId: number, payload: SupplierProductRequest): Promise<SupplierProduct> {
    const response = await apiClient.put<ApiResponse<SupplierProduct>>(buildPath(supplierId, `/${supplierProductId}`), payload);
    if (!response.data.data) {
      throw new Error('Failed to update supplier product');
    }
    return response.data.data;
  },

  async remove(supplierId: number, supplierProductId: number): Promise<void> {
    await apiClient.delete(buildPath(supplierId, `/${supplierProductId}`));
  },
};
