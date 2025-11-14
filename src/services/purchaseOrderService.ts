import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { PurchaseOrder, PurchaseOrderRequest, PurchaseOrderStatus } from '../types/purchaseOrder';

const basePath = '/admin/purchase-orders';

const buildQuery = (params?: {
  supplierId?: number;
  outletId?: number;
  statuses?: PurchaseOrderStatus[];
  limit?: number;
}) => {
  const searchParams = new URLSearchParams();
  if (params?.supplierId) {
    searchParams.append('supplierId', params.supplierId.toString());
  }
  if (params?.outletId) {
    searchParams.append('outletId', params.outletId.toString());
  }
  if (params?.limit) {
    searchParams.append('limit', params.limit.toString());
  }
  params?.statuses?.forEach((status) => searchParams.append('status', status));
  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

export const purchaseOrderService = {
  async list(params?: {
    supplierId?: number;
    outletId?: number;
    statuses?: PurchaseOrderStatus[];
    limit?: number;
  }): Promise<PurchaseOrder[]> {
    const response = await apiClient.get<ApiResponse<PurchaseOrder[]>>(`${basePath}${buildQuery(params)}`);
    return response.data.data ?? [];
  },

  async getById(id: number): Promise<PurchaseOrder> {
    const response = await apiClient.get<ApiResponse<PurchaseOrder>>(`${basePath}/${id}`);
    if (!response.data.data) {
      throw new Error('Failed to load purchase order');
    }
    return response.data.data;
  },

  async create(payload: PurchaseOrderRequest): Promise<PurchaseOrder> {
    const response = await apiClient.post<ApiResponse<PurchaseOrder>>(basePath, payload);
    if (!response.data.data) {
      throw new Error('Failed to create purchase order');
    }
    return response.data.data;
  },

  async update(id: number, payload: PurchaseOrderRequest): Promise<PurchaseOrder> {
    const response = await apiClient.put<ApiResponse<PurchaseOrder>>(`${basePath}/${id}`, payload);
    if (!response.data.data) {
      throw new Error('Failed to update purchase order');
    }
    return response.data.data;
  },

  async updateStatus(id: number, status: PurchaseOrderStatus): Promise<PurchaseOrder> {
    const response = await apiClient.post<ApiResponse<PurchaseOrder>>(`${basePath}/${id}/status`, { status });
    if (!response.data.data) {
      throw new Error('Failed to update purchase order status');
    }
    return response.data.data;
  },
};
