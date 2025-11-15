import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { InvoiceData } from '../types/invoice';
import type { Order, OrderFilters, PartialRefundRequest, RefundResponse } from '../types/order';

const buildQuery = (filters?: OrderFilters): string => {
  if (!filters) {
    return '';
  }

  const params = new URLSearchParams();
  
  if (filters.outletId !== undefined) {
    params.append('outletId', filters.outletId.toString());
  }
  
  if (filters.status) {
    params.append('status', filters.status);
  }
  
  if (filters.isOnline !== undefined) {
    params.append('isOnline', filters.isOnline.toString());
  }
  
  if (filters.startDate) {
    params.append('startDate', filters.startDate);
  }
  
  if (filters.endDate) {
    params.append('endDate', filters.endDate);
  }
  
  if (filters.cashierId !== undefined) {
    params.append('cashierId', filters.cashierId.toString());
  }
  
  if (filters.cashierUsername) {
    params.append('cashierUsername', filters.cashierUsername);
  }

  const query = params.toString();
  return query ? `?${query}` : '';
};

export const orderService = {
  async getAll(filters?: OrderFilters): Promise<Order[]> {
    const query = buildQuery(filters);
    const response = await apiClient.get<ApiResponse<Order[]>>(`/admin/orders${query}`);
    return response.data.data ?? [];
  },

  async getById(id: number): Promise<Order> {
    const response = await apiClient.get<ApiResponse<Order>>(`/admin/orders/${id}`);
    if (!response.data.data) {
      throw new Error('Failed to load order');
    }
    return response.data.data;
  },

  async getOrderDetails(id: number): Promise<Order> {
    const response = await apiClient.get<ApiResponse<Order>>(`/admin/orders/${id}/details`);
    if (!response.data.data) {
      throw new Error('Failed to load order details');
    }
    return response.data.data;
  },

  async getByOrderNumber(orderNumber: string): Promise<Order> {
    const response = await apiClient.get<ApiResponse<Order>>(`/admin/orders/by-number/${orderNumber}`);
    if (!response.data.data) {
      throw new Error('Failed to load order');
    }
    return response.data.data;
  },

  async printReceipt(orderId: number): Promise<string> {
    const response = await apiClient.get(`/admin/orders/${orderId}/receipt`, {
      responseType: 'text',
    });
    return response.data;
  },

  async holdOrder(orderId: number, notes?: string | null): Promise<Order> {
    const response = await apiClient.post<ApiResponse<Order>>(
      `/admin/orders/${orderId}/hold`,
      { notes: notes ?? undefined },
    );
    if (!response.data.data) {
      throw new Error('Failed to hold order');
    }
    return response.data.data;
  },

  async restoreOrder(orderId: number): Promise<Order> {
    const response = await apiClient.post<ApiResponse<Order>>(`/admin/orders/${orderId}/restore`, {});
    if (!response.data.data) {
      throw new Error('Failed to restore order');
    }
    return response.data.data;
  },

  async transferToKitchen(orderId: number): Promise<Order> {
    const response = await apiClient.post<ApiResponse<Order>>(
      `/admin/orders/${orderId}/transfer-to-kitchen`,
      {},
    );
    if (!response.data.data) {
      throw new Error('Failed to transfer order to kitchen');
    }
    return response.data.data;
  },

  async deleteOrder(orderId: number): Promise<void> {
    await apiClient.delete(`/admin/orders/${orderId}`);
  },

  async getInvoiceData(orderId: number): Promise<InvoiceData> {
    const response = await apiClient.get<ApiResponse<InvoiceData>>(`/admin/orders/${orderId}/invoice`);
    if (!response.data.data) {
      throw new Error('Failed to load invoice data');
    }
    return response.data.data;
  },

  async processPartialRefund(orderId: number, request: PartialRefundRequest): Promise<RefundResponse> {
    const response = await apiClient.post<ApiResponse<RefundResponse>>(`/admin/orders/${orderId}/refund/partial`, request);
    if (!response.data.data) {
      throw new Error('Failed to process partial refund');
    }
    return response.data.data;
  },

  async processFullRefund(orderId: number, reason?: string, restockItems: boolean = true): Promise<RefundResponse> {
    const response = await apiClient.post<ApiResponse<RefundResponse>>(`/admin/orders/${orderId}/refund`, {
      reason,
      restockItems,
    });
    if (!response.data.data) {
      throw new Error('Failed to process full refund');
    }
    return response.data.data;
  },
};
