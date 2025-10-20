import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type {
  PaymentMethod,
  PaymentMethodCreatePayload,
  PaymentMethodUpdatePayload,
} from '../types/payment';

export const paymentMethodService = {
  getAll: async (): Promise<PaymentMethod[]> => {
    const response = await apiClient.get<ApiResponse<PaymentMethod[]>>('/admin/payment-methods');
    return response.data.data;
  },

  create: async (payload: PaymentMethodCreatePayload): Promise<PaymentMethod> => {
    const response = await apiClient.post<ApiResponse<PaymentMethod>>('/admin/payment-methods', payload);
    return response.data.data;
  },

  update: async (id: number, payload: PaymentMethodUpdatePayload): Promise<PaymentMethod> => {
    const response = await apiClient.put<ApiResponse<PaymentMethod>>(
      `/admin/payment-methods/${id}`,
      payload,
    );
    return response.data.data;
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/admin/payment-methods/${id}`);
  },
};
