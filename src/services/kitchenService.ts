import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { KitchenOrder } from '../types/kitchen';

export const kitchenService = {
  async getOrders(outletId: number): Promise<KitchenOrder[]> {
    const response = await apiClient.get<ApiResponse<KitchenOrder[]>>(
      `/admin/kitchen/orders?outletId=${outletId}`,
    );
    return response.data.data ?? [];
  },

  async markReady(orderId: number): Promise<void> {
    await apiClient.post(`/admin/kitchen/orders/${orderId}/ready`, {});
  },
};

export default kitchenService;
