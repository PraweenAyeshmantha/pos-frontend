import apiClient from './apiClient';
import type {
  OutletSettings,
  UpdateOutletSettingsRequest,
  AccountSettings,
  UpdateAccountSettingsRequest,
  ChangePasswordRequest,
  SwitchOutletRequest,
  Outlet,
} from '../types/settings';

// Settings service for outlet and account management
class SettingsService {
  /**
   * Get current outlet settings
   * @returns Promise with outlet settings
   */
  async getOutletSettings(): Promise<OutletSettings> {
    const response = await apiClient.get('/pos/settings/outlet');
    return response.data.data;
  }

  /**
   * Update outlet settings
   * @param settings - Settings to update (partial)
   * @returns Promise with updated outlet settings
   */
  async updateOutletSettings(settings: UpdateOutletSettingsRequest): Promise<OutletSettings> {
    const response = await apiClient.put('/pos/settings/outlet', settings);
    return response.data.data;
  }

  /**
   * Reset outlet settings to defaults
   * @returns Promise with success message
   */
  async resetOutletSettings(): Promise<{ message: string }> {
    const response = await apiClient.post('/pos/settings/outlet/reset');
    return response.data.data;
  }

  /**
   * Switch to a different outlet for a cashier
   */
  async switchCashierOutlet(cashierId: number, outletRequest: SwitchOutletRequest): Promise<Outlet> {
    const response = await apiClient.post(`/pos/settings/outlet/switch/${cashierId}`, outletRequest);
    return response.data.data;
  }

  /**
   * Switch to a different outlet for an admin user
   */
  async switchAdminOutlet(userId: number, outletRequest: SwitchOutletRequest): Promise<Outlet> {
    const response = await apiClient.post(`/pos/settings/admin/outlet/switch/${userId}`, outletRequest);
    return response.data.data;
  }

  /**
   * Get account settings for a cashier
   * @param cashierId - ID of the cashier
   * @returns Promise with account settings
   */
  async getAccountSettings(cashierId: number): Promise<AccountSettings> {
    const response = await apiClient.get(`/pos/settings/account/${cashierId}`);
    return response.data.data;
  }

  /**
   * Update account settings (name only)
   * @param cashierId - ID of the cashier
   * @param settings - Account settings to update
   * @returns Promise with updated account settings
   */
  async updateAccountSettings(
    cashierId: number,
    settings: UpdateAccountSettingsRequest
  ): Promise<AccountSettings> {
    const response = await apiClient.put(`/pos/settings/account/${cashierId}`, settings);
    return response.data.data;
  }

  /**
   * Change password for a cashier
   * @param cashierId - ID of the cashier
   * @param passwordData - Password change request
   * @returns Promise with success response
   */
  async changePassword(cashierId: number, passwordData: ChangePasswordRequest): Promise<void> {
    await apiClient.put(`/pos/settings/account/${cashierId}/password`, passwordData);
  }

  /**
   * Get account settings for an admin user
   * @param userId - ID of the admin user
   * @returns Promise with account settings
   */
  async getAdminAccountSettings(userId: number): Promise<AccountSettings> {
    const response = await apiClient.get(`/pos/settings/admin/account/${userId}`);
    return response.data.data;
  }

  /**
   * Update account settings for an admin user (name only)
   * @param userId - ID of the admin user
   * @param settings - Account settings to update
   * @returns Promise with updated account settings
   */
  async updateAdminAccountSettings(
    userId: number,
    settings: UpdateAccountSettingsRequest
  ): Promise<AccountSettings> {
    const response = await apiClient.put(`/pos/settings/admin/account/${userId}`, settings);
    return response.data.data;
  }

  /**
   * Change password for an admin user
   * @param userId - ID of the admin user
   * @param passwordData - Password change request
   * @returns Promise with success response
   */
  async changeAdminPassword(userId: number, passwordData: ChangePasswordRequest): Promise<void> {
    await apiClient.put(`/pos/settings/admin/account/${userId}/password`, passwordData);
  }

  /**
   * Logout cashier
   * @param cashierId - ID of the cashier
   * @param clearBrowserData - Whether to clear browser data
   * @returns Promise with logout response
   */
  async logout(cashierId: number, clearBrowserData: boolean = false): Promise<{
    message: string;
    dataClearedFromBrowser: boolean;
    cashierUsername: string;
  }> {
    const response = await apiClient.post('/pos/settings/logout', {
      cashierId,
      clearBrowserData,
    });
    return response.data.data;
  }
}

export default new SettingsService();
