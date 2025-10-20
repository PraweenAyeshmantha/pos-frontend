import apiClient from './apiClient';
import type { Configuration, ApiResponse } from '../types/configuration';

const getConfigurationsByCategory = async (category: string): Promise<Configuration[]> => {
  const response = await apiClient.get<ApiResponse<Configuration[]>>(
    `/admin/configurations/${category.toLowerCase()}`
  );
  return response.data.data;
};

export const configurationService = {
  // Get configurations for a specific category
  getAllConfigurationsByCategory: getConfigurationsByCategory,

  // Get all general configurations
  getAllGeneralConfigurations: async (): Promise<Configuration[]> => {
    return getConfigurationsByCategory('general');
  },

  // Get all PWA configurations
  getAllPwaConfigurations: async (): Promise<Configuration[]> => {
    return getConfigurationsByCategory('pwa');
  },

  // Get all Login configurations
  getAllLoginConfigurations: async (): Promise<Configuration[]> => {
    return getConfigurationsByCategory('login');
  },

  // Get all Printer configurations
  getAllPrinterConfigurations: async (): Promise<Configuration[]> => {
    return getConfigurationsByCategory('printer');
  },

  // Get all Layout configurations
  getAllLayoutConfigurations: async (): Promise<Configuration[]> => {
    return getConfigurationsByCategory('layout');
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
