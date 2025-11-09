import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';

export interface DailySalesReport {
  openCashDrawerAmount: number;
  todaysCashSale: number;
  todaysTotalSale: number;
  expectedDrawerAmount: number;
}

export const statisticsService = {
  async getDailySalesReport(outletId: number, date?: string): Promise<DailySalesReport> {
    const params = new URLSearchParams({ outletId: outletId.toString() });
    if (date) {
      params.append('date', date);
    }
    const response = await apiClient.get<ApiResponse<DailySalesReport>>(
      `/statistics/daily-sales-report?${params.toString()}`
    );
    return response.data.data ?? { 
      openCashDrawerAmount: 0, 
      todaysCashSale: 0, 
      todaysTotalSale: 0, 
      expectedDrawerAmount: 0 
    };
  },
};
