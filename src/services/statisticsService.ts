import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';

export interface DailySalesReport {
  openCashDrawerAmount: number;
  todaysCashSale: number;
  todaysTotalSale: number;
  expectedDrawerAmount: number;
  actualClosingBalance: number;
  closingBalanceDifference: number;
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
      expectedDrawerAmount: 0,
      actualClosingBalance: 0,
      closingBalanceDifference: 0
    };
  },

  async getCashierDailySalesReport(outletId: number, cashierId: number, date?: string): Promise<DailySalesReport> {
    const params = new URLSearchParams({ 
      outletId: outletId.toString(),
      cashierId: cashierId.toString()
    });
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
      expectedDrawerAmount: 0,
      actualClosingBalance: 0,
      closingBalanceDifference: 0
    };
  },

  async getCurrentSessionBalance(cashierId: number, outletId: number): Promise<DailySalesReport> {
    const params = new URLSearchParams({ 
      cashierId: cashierId.toString(),
      outletId: outletId.toString()
    });
    const response = await apiClient.get<ApiResponse<DailySalesReport>>(
      `/statistics/current-session-balance?${params.toString()}`
    );
    return response.data.data ?? { 
      openCashDrawerAmount: 0, 
      todaysCashSale: 0, 
      todaysTotalSale: 0, 
      expectedDrawerAmount: 0,
      actualClosingBalance: 0,
      closingBalanceDifference: 0
    };
  },
};
