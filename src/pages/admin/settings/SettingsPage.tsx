import React, { useState, useEffect, memo, useCallback } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import Alert from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import type { AlertType } from '../../../components/common/Alert';
import settingsService from '../../../services/settingsService';
import authService from '../../../services/authService';
import type {
  AccountSettings,
  UpdateAccountSettingsRequest,
  ChangePasswordRequest,
  OutletSettings,
  UpdateOutletSettingsRequest,
} from '../../../types/settings';

const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: AlertType; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'account' | 'outlet'>('account');
  const isNonAdminUser = authService.getCurrentUser()?.cashierId && !authService.getCurrentUser()?.userId;

  // Account settings state
  const [accountSettings, setAccountSettings] = useState<AccountSettings>({
    id: 0,
    firstName: '',
    lastName: '',
    email: '',
    username: '',
  });

  // Password change state
  const [passwordData, setPasswordData] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Outlet settings state
  const [outletSettings, setOutletSettings] = useState<OutletSettings>({
    displayCategoryCards: true,
    enableSounds: true,
    pageWidthMm: 80,
    pageHeightMm: 297,
    pageMarginMm: 5,
  });

  const fetchAccountSettings = useCallback(async () => {
    try {
      const user = authService.getCurrentUser();
      if (user?.userId) {
        // Admin user - use admin endpoints
        const settings = await settingsService.getAdminAccountSettings(user.userId);
        setAccountSettings(settings);
      } else if (user?.cashierId) {
        // Cashier user - use regular endpoints
        const settings = await settingsService.getAccountSettings(user.cashierId);
        setAccountSettings(settings);
      } else {
        setMessage({ type: 'error', text: 'User not authenticated' });
      }
    } catch (error) {
      console.error('Error fetching account settings:', error);
      setMessage({ type: 'error', text: 'Failed to load account settings' });
    }
  }, []);

  const fetchOutletSettings = useCallback(async () => {
    try {
      const settings = await settingsService.getOutletSettings();
      setOutletSettings(settings);
    } catch (error) {
      console.error('Error fetching outlet settings:', error);
      setMessage({ type: 'error', text: 'Failed to load outlet settings' });
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      await fetchAccountSettings();
      
      // Only fetch outlet settings for non-admin users
      const user = authService.getCurrentUser();
      if (user?.cashierId && !user?.userId) {
        await fetchOutletSettings();
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchAccountSettings, fetchOutletSettings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleAccountSettingsChange = useCallback((key: keyof UpdateAccountSettingsRequest, value: string) => {
    setAccountSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleOutletSettingsChange = useCallback((key: keyof UpdateOutletSettingsRequest, value: boolean | number) => {
    setOutletSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const handlePasswordChange = useCallback((key: keyof ChangePasswordRequest, value: string) => {
    setPasswordData(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSaveAccountSettings = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const user = authService.getCurrentUser();
      if (!user) {
        setMessage({ type: 'error', text: 'User not authenticated' });
        return;
      }

      const updateData: UpdateAccountSettingsRequest = {
        firstName: accountSettings.firstName,
        lastName: accountSettings.lastName,
      };

      let updatedSettings: AccountSettings;
      if (user.userId) {
        // Admin user - use admin endpoints
        updatedSettings = await settingsService.updateAdminAccountSettings(user.userId, updateData);
      } else if (user.cashierId) {
        // Cashier user - use regular endpoints
        updatedSettings = await settingsService.updateAccountSettings(user.cashierId, updateData);
      } else {
        setMessage({ type: 'error', text: 'User not authenticated' });
        return;
      }

      setAccountSettings(updatedSettings);
      setMessage({ type: 'success', text: 'Account settings saved successfully!' });
    } catch (error) {
      console.error('Error saving account settings:', error);
      setMessage({ type: 'error', text: 'Failed to save account settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOutletSettings = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const updateData: UpdateOutletSettingsRequest = {
        displayCategoryCards: outletSettings.displayCategoryCards,
        enableSounds: outletSettings.enableSounds,
        pageWidthMm: outletSettings.pageWidthMm,
        pageHeightMm: outletSettings.pageHeightMm,
        pageMarginMm: outletSettings.pageMarginMm,
      };

      const updatedSettings = await settingsService.updateOutletSettings(updateData);
      setOutletSettings(updatedSettings);
      setMessage({ type: 'success', text: 'Outlet settings saved successfully!' });
    } catch (error) {
      console.error('Error saving outlet settings:', error);
      setMessage({ type: 'error', text: 'Failed to save outlet settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const user = authService.getCurrentUser();
      if (!user) {
        setMessage({ type: 'error', text: 'User not authenticated' });
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setMessage({ type: 'error', text: 'New password and confirm password do not match' });
        return;
      }

      if (user.userId) {
        // Admin user - use admin endpoints
        await settingsService.changeAdminPassword(user.userId, passwordData);
      } else if (user.cashierId) {
        // Cashier user - use regular endpoints
        await settingsService.changePassword(user.cashierId, passwordData);
      } else {
        setMessage({ type: 'error', text: 'User not authenticated' });
        return;
      }

      // Clear password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setMessage({ type: 'success', text: 'Password changed successfully!' });
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ type: 'error', text: 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl text-gray-600">Loading settings...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8">
        <AdminPageHeader
          title="Settings"
          description="Manage your account information, outlet settings, and change your password."
        />

        {message && (
          <ToastContainer>
            <Alert
              type={message.type}
              title={message.type === 'success' ? 'Success' : message.type === 'error' ? 'Error' : 'Info'}
              message={message.text}
              onClose={() => setMessage(null)}
            />
          </ToastContainer>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50/70 px-3 py-2 sm:px-5">
            <button
              type="button"
              onClick={() => setActiveTab('account')}
              className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                activeTab === 'account'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900'
              }`}
            >
              Account Settings
            </button>
            {isNonAdminUser && (
              <button
                type="button"
                onClick={() => setActiveTab('outlet')}
                className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  activeTab === 'outlet'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                Outlet Settings
              </button>
            )}
          </div>

          <div className="p-6 sm:p-8">
            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === 'account' && (
                <>
                  {/* Account Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Account Information</h3>

                {/* First Name */}
                <div className="flex items-center justify-between border-b border-gray-200 py-4">
                  <label className="font-semibold text-gray-800">First Name</label>
                  <input
                    type="text"
                    value={accountSettings.firstName}
                    onChange={(e) => handleAccountSettingsChange('firstName', e.target.value)}
                    className="min-w-[300px] rounded-md border border-gray-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your first name"
                  />
                </div>

                {/* Last Name */}
                <div className="flex items-center justify-between border-b border-gray-200 py-4">
                  <label className="font-semibold text-gray-800">Last Name</label>
                  <input
                    type="text"
                    value={accountSettings.lastName}
                    onChange={(e) => handleAccountSettingsChange('lastName', e.target.value)}
                    className="min-w-[300px] rounded-md border border-gray-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your last name"
                  />
                </div>

                {/* Email (Read-only) */}
                <div className="flex items-center justify-between border-b border-gray-200 py-4">
                  <label className="font-semibold text-gray-800">Email</label>
                  <input
                    type="email"
                    value={accountSettings.email}
                    readOnly
                    className="min-w-[300px] rounded-md border border-gray-300 bg-gray-50 px-4 py-2 text-gray-500 cursor-not-allowed"
                  />
                </div>

                {/* Username (Read-only) */}
                <div className="flex items-center justify-between py-4">
                  <label className="font-semibold text-gray-800">Username</label>
                  <input
                    type="text"
                    value={accountSettings.username}
                    readOnly
                    className="min-w-[300px] rounded-md border border-gray-300 bg-gray-50 px-4 py-2 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Save Account Settings Button */}
              <div className="flex items-center justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={handleSaveAccountSettings}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Account Settings'}
                </button>
              </div>

              {/* Change Password */}
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Change Password</h3>

                {/* Current Password */}
                <div className="flex items-center justify-between border-b border-gray-200 py-4">
                  <label className="font-semibold text-gray-800">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className="min-w-[300px] rounded-md border border-gray-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter current password"
                  />
                </div>

                {/* New Password */}
                <div className="flex items-center justify-between border-b border-gray-200 py-4">
                  <label className="font-semibold text-gray-800">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className="min-w-[300px] rounded-md border border-gray-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter new password"
                    minLength={4}
                  />
                </div>

                {/* Confirm Password */}
                <div className="flex items-center justify-between py-4">
                  <label className="font-semibold text-gray-800">Confirm Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className="min-w-[300px] rounded-md border border-gray-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm new password"
                    minLength={4}
                  />
                </div>
              </div>

              {/* Change Password Button */}
              <div className="flex items-center justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={handleChangePassword}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {saving ? 'Changing...' : 'Change Password'}
                </button>
              </div>
                </>
              )}

              {activeTab === 'outlet' && isNonAdminUser && (
                <>
                  {/* Outlet Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">Outlet Settings</h3>
                    
                    {/* Display Category Cards */}
                    <div className="flex items-center justify-between border-b border-gray-200 py-4">
                      <div className="flex flex-col">
                        <label className="font-semibold text-gray-800">Display Category Cards</label>
                        <span className="text-sm text-gray-600">Show category cards on the POS interface</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={outletSettings.displayCategoryCards}
                          onChange={(e) => handleOutletSettingsChange('displayCategoryCards', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Enable Sounds */}
                    <div className="flex items-center justify-between border-b border-gray-200 py-4">
                      <div className="flex flex-col">
                        <label className="font-semibold text-gray-800">Enable Sounds</label>
                        <span className="text-sm text-gray-600">Play sound effects for user interactions</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={outletSettings.enableSounds}
                          onChange={(e) => handleOutletSettingsChange('enableSounds', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {/* Page Width */}
                    <div className="flex items-center justify-between border-b border-gray-200 py-4">
                      <div className="flex flex-col">
                        <label className="font-semibold text-gray-800">Page Width (mm)</label>
                        <span className="text-sm text-gray-600">Width of printed receipts in millimeters</span>
                      </div>
                      <input
                        type="number"
                        value={outletSettings.pageWidthMm}
                        onChange={(e) => handleOutletSettingsChange('pageWidthMm', parseInt(e.target.value) || 80)}
                        className="min-w-[100px] rounded-md border border-gray-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="40"
                        max="120"
                      />
                    </div>

                    {/* Page Height */}
                    <div className="flex items-center justify-between border-b border-gray-200 py-4">
                      <div className="flex flex-col">
                        <label className="font-semibold text-gray-800">Page Height (mm)</label>
                        <span className="text-sm text-gray-600">Height of printed receipts in millimeters</span>
                      </div>
                      <input
                        type="number"
                        value={outletSettings.pageHeightMm}
                        onChange={(e) => handleOutletSettingsChange('pageHeightMm', parseInt(e.target.value) || 297)}
                        className="min-w-[100px] rounded-md border border-gray-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="100"
                        max="500"
                      />
                    </div>

                    {/* Page Margin */}
                    <div className="flex items-center justify-between py-4">
                      <div className="flex flex-col">
                        <label className="font-semibold text-gray-800">Page Margin (mm)</label>
                        <span className="text-sm text-gray-600">Margin around printed receipts in millimeters</span>
                      </div>
                      <input
                        type="number"
                        value={outletSettings.pageMarginMm}
                        onChange={(e) => handleOutletSettingsChange('pageMarginMm', parseInt(e.target.value) || 5)}
                        className="min-w-[100px] rounded-md border border-gray-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="0"
                        max="20"
                      />
                    </div>
                  </div>

                  {/* Save Outlet Settings Button */}
                  <div className="flex items-center justify-end pt-6 border-t border-gray-200">
                    <button
                      onClick={handleSaveOutletSettings}
                      disabled={saving}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Outlet Settings'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};

export default memo(SettingsPage);
