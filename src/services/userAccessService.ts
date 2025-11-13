import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { ApplicationScreen, UserAccessPermission } from '../types/access';
import type { UserAccess } from '../types/auth';

export const userAccessService = {
  async getScreens(): Promise<ApplicationScreen[]> {
    const response = await apiClient.get<ApiResponse<ApplicationScreen[]>>('/admin/user-access/screens');
    return response.data.data ?? [];
  },

  async getUserAccess(userId: number): Promise<UserAccess[]> {
    const response = await apiClient.get<ApiResponse<UserAccess[]>>(`/admin/user-access/users/${userId}`);
    return response.data.data ?? [];
  },

  async updateUserAccess(userId: number, permissions: UserAccessPermission[]): Promise<UserAccess[]> {
    const payload = { permissions };
    const response = await apiClient.put<ApiResponse<UserAccess[]>>(`/admin/user-access/users/${userId}`, payload);
    return response.data.data ?? [];
  },
};
