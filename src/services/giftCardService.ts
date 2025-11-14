import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type {
  GiftCardListItem,
  GiftCardDetail,
  GiftCardBreakageSummary,
  GiftCardIssuePayload,
  GiftCardActivationPayload,
  GiftCardAdjustmentPayload,
  GiftCardLookupResponse,
} from '../types/giftCard';

export interface GiftCardFilters {
  status?: string;
  type?: string;
  search?: string;
}

export interface BreakageReportFilters {
  inactivityDays?: number;
  asOf?: string;
}

export const giftCardService = {
  async list(filters: GiftCardFilters = {}): Promise<GiftCardListItem[]> {
    const response = await apiClient.get<ApiResponse<GiftCardListItem[]>>('/admin/gift-cards', {
      params: filters,
    });
    return response.data.data ?? [];
  },

  async get(id: number): Promise<GiftCardDetail> {
    const response = await apiClient.get<ApiResponse<GiftCardDetail>>(`/admin/gift-cards/${id}`);
    if (!response.data.data) {
      throw new Error('Gift card not found');
    }
    return response.data.data;
  },

  async issue(payload: GiftCardIssuePayload): Promise<GiftCardDetail> {
    const response = await apiClient.post<ApiResponse<GiftCardDetail>>('/admin/gift-cards', payload);
    if (!response.data.data) {
      throw new Error('Failed to issue gift card');
    }
    return response.data.data;
  },

  async activate(id: number, payload: GiftCardActivationPayload): Promise<GiftCardDetail> {
    const response = await apiClient.post<ApiResponse<GiftCardDetail>>(`/admin/gift-cards/${id}/activate`, payload);
    if (!response.data.data) {
      throw new Error('Failed to activate gift card');
    }
    return response.data.data;
  },

  async adjust(id: number, payload: GiftCardAdjustmentPayload): Promise<GiftCardDetail> {
    const response = await apiClient.post<ApiResponse<GiftCardDetail>>(`/admin/gift-cards/${id}/adjust`, payload);
    if (!response.data.data) {
      throw new Error('Failed to adjust gift card');
    }
    return response.data.data;
  },

  async lookup(code: string): Promise<GiftCardLookupResponse> {
    const response = await apiClient.get<ApiResponse<GiftCardLookupResponse>>(
      `/pos/gift-cards/${encodeURIComponent(code)}/lookup`
    );
    if (!response.data.data) {
      throw new Error('Unable to lookup gift card');
    }
    return response.data.data;
  },

  async getBreakageSummary(filters: BreakageReportFilters = {}): Promise<GiftCardBreakageSummary> {
    const response = await apiClient.get<ApiResponse<GiftCardBreakageSummary>>('/admin/gift-cards/breakage', {
      params: filters,
    });
    if (!response.data.data) {
      throw new Error('Failed to load breakage report');
    }
    return response.data.data;
  },
};
