export interface SalesAnalytics {
  totalSales: number;
  netSales: number;
  totalOrders: number;
  averageOrderValue: number;
  totalItemsSold: number;
  totalReturns: number;
  discountedOrders: number;
  grossDiscountAmount: number;
  totalTax: number;
  averageOrderTax: number;
}

export interface SalesAnalyticsFilters {
  outletId?: number;
  startDate?: string;
  endDate?: string;
}
