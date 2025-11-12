import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import Alert, { type AlertType } from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import { stockService } from '../../../services/stockService';
import type { StockConfiguration } from '../../../types/stock';

const StockConfigPage: React.FC = () => {
  const [configurations, setConfigurations] = useState<StockConfiguration[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: AlertType; title: string; message: string } | null>(null);

  // Load configurations on component mount
  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const configData = await stockService.getStockConfigurations();
      setConfigurations(configData);
    } catch (err) {
      console.error('Failed to load stock configurations:', err);
      setError('Failed to load stock configurations');
    } finally {
      setLoading(false);
    }
  }, []);

  const showToast = useCallback((type: AlertType, title: string, message: string) => {
    setToast({ type, title, message });
  }, []);

  const handleConfigurationChange = (key: string, value: string) => {
    setConfigurations(prev => {
      const existingConfig = prev.find(config => config.configKey === key);
      if (existingConfig) {
        // Update existing configuration
        return prev.map(config =>
          config.configKey === key
            ? { ...config, configValue: value }
            : config
        );
      } else {
        // Add new configuration
        return [...prev, {
          id: Date.now(), // Temporary ID for new configs
          configKey: key,
          configValue: value,
          category: 'STOCK',
          description: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }];
      }
    });
  };

  const handleSaveConfigurations = async () => {
    setSaving(true);
    try {
      const configUpdates: Record<string, string> = {};
      configurations.forEach(config => {
        configUpdates[config.configKey] = config.configValue;
      });

      await stockService.bulkUpdateStockConfigurations(configUpdates);
      showToast('success', 'Success', 'Stock configurations saved successfully');
    } catch (err) {
      console.error('Failed to save configurations:', err);
      showToast('error', 'Error', 'Failed to save stock configurations');
    } finally {
      setSaving(false);
    }
  };

  const getConfigurationValue = (key: string): string => {
    const config = configurations.find(c => c.configKey === key);
    return config?.configValue || '';
  };

  const setConfigurationValue = (key: string, value: string) => {
    handleConfigurationChange(key, value);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Stock Configuration"
          description="Configure stock management settings and thresholds"
        />

        {/* Configuration Form */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Stock Settings</h3>
            <p className="text-sm text-slate-600 mt-1">
              Configure stock management features and alert thresholds
            </p>
          </div>

          {error && (
            <div className="p-6">
              <Alert type="error" title="Error" message={error} />
            </div>
          )}

          {loading ? (
            <div className="p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-slate-600">Loading configurations...</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Stock Management Toggle */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-md font-medium text-slate-900">Stock Management</h4>
                  <p className="text-sm text-slate-600">Enable or disable stock tracking features</p>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="enable-stock-management"
                    checked={getConfigurationValue('ENABLE_STOCK_MANAGEMENT') === 'true'}
                    onChange={(e) => setConfigurationValue('ENABLE_STOCK_MANAGEMENT', e.target.checked.toString())}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <label htmlFor="enable-stock-management" className="text-sm font-medium text-slate-700">
                    Enable Stock Management
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="enable-stock-validation"
                    checked={getConfigurationValue('ENABLE_STOCK_VALIDATION') === 'true'}
                    onChange={(e) => setConfigurationValue('ENABLE_STOCK_VALIDATION', e.target.checked.toString())}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <label htmlFor="enable-stock-validation" className="text-sm font-medium text-slate-700">
                    Enable Stock Validation on Orders
                  </label>
                </div>
              </div>

              {/* Stock Batch Management */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-md font-medium text-slate-900">Stock Batch Management</h4>
                  <p className="text-sm text-slate-600">Configure advanced stock batch pricing and consumption strategies</p>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="enable-stock-batch-management"
                    checked={getConfigurationValue('ENABLE_STOCK_BATCH_MANAGEMENT') === 'true'}
                    onChange={(e) => setConfigurationValue('ENABLE_STOCK_BATCH_MANAGEMENT', e.target.checked.toString())}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <label htmlFor="enable-stock-batch-management" className="text-sm font-medium text-slate-700">
                    Enable Stock Batch Management
                  </label>
                  <span className="ml-1 cursor-help text-slate-400" title="Allows tracking different prices for stock batches and configurable consumption strategies">ⓘ</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="consumption-strategy" className="block text-sm font-medium text-slate-700">
                      Stock Consumption Strategy
                    </label>
                    <select
                      id="consumption-strategy"
                      value={getConfigurationValue('STOCK_CONSUMPTION_STRATEGY') || 'FIFO'}
                      onChange={(e) => setConfigurationValue('STOCK_CONSUMPTION_STRATEGY', e.target.value)}
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="FIFO">FIFO (First In, First Out)</option>
                      <option value="LIFO">LIFO (Last In, First Out)</option>
                      <option value="RANDOM">Random</option>
                    </select>
                    <p className="mt-1 text-xs text-slate-500">
                      How stock batches are selected when processing orders
                    </p>
                  </div>
                </div>
              </div>

              {/* Alert Thresholds */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-md font-medium text-slate-900">Alert Thresholds</h4>
                  <p className="text-sm text-slate-600">Set thresholds for stock alerts</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="low-stock-threshold" className="block text-sm font-medium text-slate-700">
                      Low Stock Threshold
                    </label>
                    <input
                      type="number"
                      id="low-stock-threshold"
                      min="0"
                      value={getConfigurationValue('LOW_STOCK_THRESHOLD') || '10'}
                      onChange={(e) => setConfigurationValue('LOW_STOCK_THRESHOLD', e.target.value)}
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="10"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Products with stock below this level will trigger low stock alerts
                    </p>
                  </div>

                  <div>
                    <label htmlFor="critical-stock-threshold" className="block text-sm font-medium text-slate-700">
                      Critical Stock Threshold
                    </label>
                    <input
                      type="number"
                      id="critical-stock-threshold"
                      min="0"
                      value={getConfigurationValue('CRITICAL_STOCK_THRESHOLD') || '5'}
                      onChange={(e) => setConfigurationValue('CRITICAL_STOCK_THRESHOLD', e.target.value)}
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="5"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Products with stock below this level will trigger critical alerts
                    </p>
                  </div>
                </div>
              </div>

              {/* Alert Settings */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-md font-medium text-slate-900">Alert Settings</h4>
                  <p className="text-sm text-slate-600">Configure how stock alerts are handled</p>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="enable-stock-alerts"
                    checked={getConfigurationValue('ENABLE_STOCK_ALERTS') === 'true'}
                    onChange={(e) => setConfigurationValue('ENABLE_STOCK_ALERTS', e.target.checked.toString())}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <label htmlFor="enable-stock-alerts" className="text-sm font-medium text-slate-700">
                    Enable Low Stock Alerts
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="alert-frequency" className="block text-sm font-medium text-slate-700">
                      Alert Check Frequency (minutes)
                    </label>
                    <input
                      type="number"
                      id="alert-frequency"
                      min="1"
                      value={getConfigurationValue('ALERT_CHECK_FREQUENCY_MINUTES') || '60'}
                      onChange={(e) => setConfigurationValue('ALERT_CHECK_FREQUENCY_MINUTES', e.target.value)}
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="60"
                    />
                  </div>

                  <div>
                    <label htmlFor="alert-email" className="block text-sm font-medium text-slate-700">
                      Alert Email Recipients
                    </label>
                    <input
                      type="email"
                      id="alert-email"
                      multiple
                      value={getConfigurationValue('ALERT_EMAIL_RECIPIENTS') || ''}
                      onChange={(e) => setConfigurationValue('ALERT_EMAIL_RECIPIENTS', e.target.value)}
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      placeholder="admin@example.com, manager@example.com"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Comma-separated email addresses for stock alerts
                    </p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-6 border-t border-slate-200">
                <button
                  onClick={handleSaveConfigurations}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save Configuration'
                  )}
                </button>
              </div>
            </div>
        )}
      </div>
    </div>

      {/* Toast Notifications */}
      <ToastContainer>
        {toast && (
          <Alert
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}
      </ToastContainer>
    </AdminLayout>
  );
};

export default StockConfigPage;