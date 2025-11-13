import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { GoodsReceivedNote, GoodsReceivedNoteRequest } from '../types/goodsReceivedNote';

const basePath = '/cashier/grns';

export const goodsReceivedNoteService = {
  async create(payload: GoodsReceivedNoteRequest): Promise<GoodsReceivedNote> {
    const response = await apiClient.post<ApiResponse<GoodsReceivedNote>>(basePath, payload);
    if (!response.data.data) {
      throw new Error('Failed to create goods received note');
    }
    return response.data.data;
  },

  async list(params?: { outletId?: number; limit?: number }): Promise<GoodsReceivedNote[]> {
    const searchParams = new URLSearchParams();
    if (params?.outletId) {
      searchParams.append('outletId', params.outletId.toString());
    }
    if (params?.limit) {
      searchParams.append('limit', params.limit.toString());
    }
    const query = searchParams.toString();
    const response = await apiClient.get<ApiResponse<GoodsReceivedNote[]>>(
      `${basePath}${query ? `?${query}` : ''}`
    );
    return response.data.data ?? [];
  },

  async getById(id: number): Promise<GoodsReceivedNote> {
    const response = await apiClient.get<ApiResponse<GoodsReceivedNote>>(`${basePath}/${id}`);
    if (!response.data.data) {
      throw new Error('Failed to load goods received note');
    }
    return response.data.data;
  },
};
