import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type {
  CreateDiningTableRequest,
  DiningTable,
  UpdateDiningTableRequest,
} from '../types/table';

const basePath = '/admin/dining-tables';

export const tableService = {
  async getAll(outletId?: number): Promise<DiningTable[]> {
    const query = outletId ? `?outletId=${outletId}` : '';
    const response = await apiClient.get<ApiResponse<DiningTable[]>>(`${basePath}${query}`);
    return response.data.data ?? [];
  },

  async create(payload: CreateDiningTableRequest): Promise<DiningTable> {
    const response = await apiClient.post<ApiResponse<DiningTable>>(basePath, {
      outlet: { id: payload.outletId },
      tableNumber: payload.tableNumber,
      capacity: payload.capacity,
      status: payload.status,
      recordStatus: payload.recordStatus,
    });

    if (!response.data.data) {
      throw new Error('Failed to create dining table');
    }

    return response.data.data;
  },

  async update(payload: UpdateDiningTableRequest): Promise<DiningTable> {
    const response = await apiClient.put<ApiResponse<DiningTable>>(`${basePath}/${payload.id}`, {
      tableNumber: payload.tableNumber,
      capacity: payload.capacity,
      status: payload.status,
      recordStatus: payload.recordStatus,
    });

    if (!response.data.data) {
      throw new Error('Failed to update dining table');
    }

    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${basePath}/${id}`);
  },
};
