import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { SalesAnalytics, SalesAnalyticsFilters } from '../types/analytics';

interface RawSalesAnalytics {
  totalSales: number | string;
  netSales: number | string;
  totalOrders: number | string;
  averageOrderValue: number | string;
  totalItemsSold: number | string;
  totalReturns: number | string;
  discountedOrders: number | string;
  grossDiscountAmount: number | string;
  totalTax: number | string;
  averageOrderTax: number | string;
}

const toNumber = (value: number | string | undefined | null): number => {
  if (value === undefined || value === null || value === '') {
    return 0;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapAnalytics = (payload: RawSalesAnalytics | undefined | null): SalesAnalytics => ({
  totalSales: toNumber(payload?.totalSales),
  netSales: toNumber(payload?.netSales),
  totalOrders: toNumber(payload?.totalOrders),
  averageOrderValue: toNumber(payload?.averageOrderValue),
  totalItemsSold: toNumber(payload?.totalItemsSold),
  totalReturns: toNumber(payload?.totalReturns),
  discountedOrders: toNumber(payload?.discountedOrders),
  grossDiscountAmount: toNumber(payload?.grossDiscountAmount),
  totalTax: toNumber(payload?.totalTax),
  averageOrderTax: toNumber(payload?.averageOrderTax),
});

export const analyticsService = {
  async fetchSalesAnalytics(filters: SalesAnalyticsFilters): Promise<SalesAnalytics> {
    const response = await apiClient.get<ApiResponse<RawSalesAnalytics>>('/analytics/sales', {
      params: filters,
    });

    return mapAnalytics(response.data.data);
  },
};
