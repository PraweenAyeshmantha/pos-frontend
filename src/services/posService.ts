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
  giftCardCode?: string | null;
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
  loyaltyPointsRedeemed?: number;
  loyaltyRewardId?: number;
  offlineReference?: string;
  offlineCapturedAt?: string;
}

export interface OfflineOrderSyncPayload {
  clientReference: string;
  capturedAt: string;
  order: CreateOrderRequest;
}

export interface OfflineOrderSyncResult {
  clientReference: string | null;
  status: 'CREATED' | 'DUPLICATE' | 'FAILED';
  message: string;
  order?: Order;
}

export interface OfflineOrderSyncResponse {
  results: OfflineOrderSyncResult[];
  createdCount: number;
  duplicateCount: number;
  failedCount: number;
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

  async syncOfflineOrders(payloads: OfflineOrderSyncPayload[]): Promise<OfflineOrderSyncResponse> {
    const response = await apiClient.post<ApiResponse<OfflineOrderSyncResponse>>(
      '/pos/offline/orders/sync',
      payloads
    );
    if (!response.data.data) {
      throw new Error('Failed to sync offline orders');
    }
    return response.data.data;
  },

  async applyCoupon(orderId: number, couponCode: string): Promise<Order> {
    const response = await apiClient.post<ApiResponse<Order>>(`/pos/orders/${orderId}/coupon`, {
      couponCode,
    });
    if (!response.data.data) {
      throw new Error('Failed to apply coupon');
    }
    return response.data.data;
  },

  async applyDiscount(
    orderId: number,
    discountType: 'FIXED' | 'PERCENTAGE',
    discountValue: number
  ): Promise<Order> {
    const response = await apiClient.post<ApiResponse<Order>>(`/pos/orders/${orderId}/discount`, {
      discountType,
      discountValue,
    });
    if (!response.data.data) {
      throw new Error('Failed to apply discount');
    }
    return response.data.data;
  },
};
