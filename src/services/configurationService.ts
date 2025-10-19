import apiClient from './apiClient';
import type { Configuration, ApiResponse } from '../types/configuration';

export const configurationService = {
  // Get all general configurations
  getAllGeneralConfigurations: async (): Promise<Configuration[]> => {
    const response = await apiClient.get<ApiResponse<Configuration[]>>(
      '/admin/configurations/general'
    );
    return response.data.data;
  },

  // Get configuration by key
  getConfigurationByKey: async (key: string, category: string = 'GENERAL'): Promise<Configuration> => {
    const response = await apiClient.get<ApiResponse<Configuration>>(
      `/admin/configurations/by-key?key=${key}&category=${category}`
    );
    return response.data.data;
  },

  // Update single configuration
  updateConfiguration: async (id: number, configValue: string, description?: string): Promise<Configuration> => {
    const response = await apiClient.put<ApiResponse<Configuration>>(
      `/admin/configurations/${id}`,
      { configValue, description }
    );
    return response.data.data;
  },

  // Bulk update configurations
  bulkUpdateConfigurations: async (configurations: Record<string, string>, category: string = 'GENERAL'): Promise<Configuration[]> => {
    const response = await apiClient.post<ApiResponse<Configuration[]>>(
      `/admin/configurations/bulk-update?category=${category}`,
      { configurations }
    );
    return response.data.data;
  },
};
