import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type {
  LoyaltySummary,
  LoyaltyTier,
  LoyaltyRule,
  LoyaltyReward,
  LoyaltyRuleType,
  LoyaltyRedemptionRequest,
} from '../types/loyalty';

const basePath = '/admin/loyalty';

export const loyaltyService = {
  async getSummary(customerId: number): Promise<LoyaltySummary> {
    const response = await apiClient.get<ApiResponse<LoyaltySummary>>(`${basePath}/customers/${customerId}/summary`);
    return response.data.data;
  },

  async redeem(customerId: number, payload: LoyaltyRedemptionRequest) {
    const response = await apiClient.post<ApiResponse<any>>(`${basePath}/customers/${customerId}/redeem`, payload);
    return response.data.data;
  },

  async adjust(customerId: number, payload: LoyaltyRedemptionRequest) {
    const response = await apiClient.post<ApiResponse<any>>(`${basePath}/customers/${customerId}/adjust`, payload);
    return response.data.data;
  },

  async expireNow(): Promise<number> {
    const response = await apiClient.post<ApiResponse<number>>(`${basePath}/expire`);
    return response.data.data;
  },

  async getTiers(): Promise<LoyaltyTier[]> {
    const response = await apiClient.get<ApiResponse<LoyaltyTier[]>>(`${basePath}/tiers`);
    return response.data.data;
  },

  async createTier(payload: LoyaltyTier): Promise<LoyaltyTier> {
    const response = await apiClient.post<ApiResponse<LoyaltyTier>>(`${basePath}/tiers`, payload);
    return response.data.data;
  },

  async updateTier(id: number, payload: LoyaltyTier): Promise<LoyaltyTier> {
    const response = await apiClient.put<ApiResponse<LoyaltyTier>>(`${basePath}/tiers/${id}`, payload);
    return response.data.data;
  },

  async deleteTier(id: number): Promise<void> {
    await apiClient.delete(`${basePath}/tiers/${id}`);
  },

  async getRule(type: LoyaltyRuleType): Promise<LoyaltyRule> {
    const response = await apiClient.get<ApiResponse<LoyaltyRule>>(`${basePath}/rules/${type}`);
    return response.data.data;
  },

  async updateRule(type: LoyaltyRuleType, payload: LoyaltyRule): Promise<LoyaltyRule> {
    const response = await apiClient.put<ApiResponse<LoyaltyRule>>(`${basePath}/rules/${type}`, payload);
    return response.data.data;
  },

  async getRewards(): Promise<LoyaltyReward[]> {
    const response = await apiClient.get<ApiResponse<LoyaltyReward[]>>(`${basePath}/rewards`);
    return response.data.data;
  },

  async createReward(payload: LoyaltyReward): Promise<LoyaltyReward> {
    const response = await apiClient.post<ApiResponse<LoyaltyReward>>(`${basePath}/rewards`, payload);
    return response.data.data;
  },

  async updateReward(id: number, payload: LoyaltyReward): Promise<LoyaltyReward> {
    const response = await apiClient.put<ApiResponse<LoyaltyReward>>(`${basePath}/rewards/${id}`, payload);
    return response.data.data;
  },

  async deleteReward(id: number): Promise<void> {
    await apiClient.delete(`${basePath}/rewards/${id}`);
  },
};
