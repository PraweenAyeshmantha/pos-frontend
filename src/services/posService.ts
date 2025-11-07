import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { PaymentMethod } from '../types/payment';
import type { Order } from '../types/order';

export interface CreateOrderItemRequest {
  productId?: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  notes?: string | null;
  weight?: number | null;
}

export interface CreateOrderPaymentRequest {
  paymentMethodId: number;
  amount: number;
}

export interface CreateOrderRequest {
  outletId: number;
  cashierId?: number;
  customerId?: number;
  orderType: 'COUNTER' | 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  items: CreateOrderItemRequest[];
  discountAmount?: number;
  discountType?: 'FIXED' | 'PERCENTAGE';
  couponCode?: string | null;
  payments?: CreateOrderPaymentRequest[];
  notes?: string | null;
  isOffline?: boolean;
}

export const posService = {
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await apiClient.get<ApiResponse<PaymentMethod[]>>('/pos/payment-methods');
    return response.data.data ?? [];
  },

  async createOrder(request: CreateOrderRequest): Promise<Order> {
    const response = await apiClient.post<ApiResponse<Order>>('/pos/orders', request);
    if (!response.data.data) {
      throw new Error('Failed to create order');
    }
    return response.data.data;
  },
};
