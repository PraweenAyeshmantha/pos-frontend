import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { CashierSession, StartCashierSessionRequest, CloseCashierSessionRequest } from '../types/cashierSession';

export const cashierSessionService = {
  async getAll(): Promise<CashierSession[]> {
    const response = await apiClient.get<ApiResponse<CashierSession[]>>('/admin/cashier-sessions');
    return response.data.data ?? [];
  },

  async getById(id: number): Promise<CashierSession> {
    const response = await apiClient.get<ApiResponse<CashierSession>>(`/admin/cashier-sessions/${id}`);
    if (!response.data.data) {
      throw new Error('Session not found');
    }
    return response.data.data;
  },

  async startSession(request: StartCashierSessionRequest): Promise<CashierSession> {
    const response = await apiClient.post<ApiResponse<CashierSession>>('/cashier/sessions/start', request);
    if (!response.data.data) {
      throw new Error('Failed to start session');
    }
    return response.data.data;
  },

  async closeSession(request: CloseCashierSessionRequest): Promise<CashierSession> {
    const response = await apiClient.put<ApiResponse<CashierSession>>('/cashier/sessions/close', request);
    if (!response.data.data) {
      throw new Error('Failed to close session');
    }
    return response.data.data;
  },

  async getActiveSession(cashierId: number, outletId: number): Promise<CashierSession | null> {
    const response = await apiClient.get<ApiResponse<CashierSession>>(`/admin/cashier-sessions/active/${cashierId}/${outletId}`);
    return response.data.data ?? null;
  },

  async getMyActiveSession(outletId?: number): Promise<CashierSession | null> {
    const query = outletId ? `?outletId=${outletId}` : '';
    const response = await apiClient.get<ApiResponse<CashierSession>>(`/cashier/sessions/active${query}`);
    return response.data.data ?? null;
  },

  async getMySessions(startDate?: string, endDate?: string): Promise<CashierSession[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const url = `/cashier/sessions${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiClient.get<ApiResponse<CashierSession[]>>(url);
    return response.data.data ?? [];
  },

  async getMySessionById(id: number): Promise<CashierSession> {
    const response = await apiClient.get<ApiResponse<CashierSession>>(`/cashier/sessions/${id}`);
    if (!response.data.data) {
      throw new Error('Session not found');
    }
    return response.data.data;
  },
};
