import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';

export interface CreateTransactionRequest {
  outletId: number;
  cashierId?: number;
  transactionType: 'OPENING_BALANCE' | 'CLOSING_BALANCE' | 'CASH_IN' | 'CASH_OUT' | 'EXPENSE' | 'REFUND' | 'SALE';
  amount: number;
  description?: string;
  referenceNumber?: string;
}

export interface Transaction {
  id: number;
  transactionType: string;
  amount: number;
  amountIn?: number;
  amountOut?: number;
  description?: string;
  referenceNumber?: string;
  transactionDate: string;
  createdDate: string;
  paymentMethod?: string;
  outletId: number;
  outletName: string;
  outletCode?: string;
  cashierId?: number;
  cashierName?: string;
  cashierUsername?: string;
  orderId?: number;
  orderNumber?: string;
}

export interface GetTransactionsParams {
  outletId?: number;
  cashierId?: number;
  transactionType?: string;
  startDate?: string;
  endDate?: string;
}

export const transactionService = {
  async createTransaction(request: CreateTransactionRequest): Promise<Transaction> {
    const response = await apiClient.post<ApiResponse<Transaction>>('/admin/transactions', request);
    if (!response.data.data) {
      throw new Error('Failed to create transaction');
    }
    return response.data.data;
  },

  async getAll(params?: GetTransactionsParams): Promise<Transaction[]> {
    const queryParams = new URLSearchParams();
    if (params?.outletId) queryParams.append('outletId', params.outletId.toString());
    if (params?.cashierId) queryParams.append('cashierId', params.cashierId.toString());
    if (params?.transactionType) queryParams.append('transactionType', params.transactionType);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const url = `/admin/transactions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<ApiResponse<Transaction[]>>(url);
    return response.data.data ?? [];
  },
};
