import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import Alert, { type AlertType } from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import { stockService } from '../../../services/stockService';
import { outletService } from '../../../services/outletService';
import type { ProductStock } from '../../../types/stock';
import type { Outlet } from '../../../types/outlet';

const StockAlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<ProductStock[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: AlertType; title: string; message: string } | null>(null);

  // Load outlets on component mount
  useEffect(() => {
    const loadOutlets = async () => {
      try {
        const outletData = await outletService.getAll();
        setOutlets(outletData);
      } catch (err) {
        console.error('Failed to load outlets:', err);
        setError('Failed to load outlets');
      }
    };
    loadOutlets();
  }, []);

  // Load alerts when outlet changes
  useEffect(() => {
    if (selectedOutletId) {
      loadAlerts();
    }
  }, [selectedOutletId]);

  const loadAlerts = useCallback(async () => {
    if (!selectedOutletId) return;

    setLoading(true);
    setError(null);
    try {
      const alertData = await stockService.getLowStockAlerts(selectedOutletId);
      const normalizedAlerts = alertData.map((alert) => ({
        ...alert,
        quantity: Number(alert.quantity ?? 0),
        reorderLevel: alert.reorderLevel != null ? Number(alert.reorderLevel) : undefined,
      }));
      setAlerts(normalizedAlerts);
    } catch (err) {
      console.error('Failed to load stock alerts:', err);
      setError('Failed to load stock alerts');
    } finally {
      setLoading(false);
    }
  }, [selectedOutletId]);

  const selectedOutlet = outlets.find(outlet => outlet.id === selectedOutletId);

  const alertStats = useMemo(() => {
    const lowStockCount = alerts.filter(alert => alert.quantity > 0 && alert.quantity <= (alert.reorderLevel || 10)).length;
    const outOfStockCount = alerts.filter(alert => alert.quantity === 0).length;
    return { lowStockCount, outOfStockCount, totalAlerts: alerts.length };
  }, [alerts]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Stock Alerts"
          description="Monitor low stock and out of stock alerts across your outlets"
        />

        {/* Outlet Selector */}
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Select Outlet</h3>
              <p className="text-sm text-slate-600 mt-1">
                Choose an outlet to view stock alerts
              </p>
            </div>
            <select
              value={selectedOutletId ?? ''}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedOutletId(value ? Number(value) : null);
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select an outlet...</option>
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Alert Statistics */}
        {selectedOutletId && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="flex items-center">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Low Stock Alerts</p>
                  <p className="text-2xl font-bold text-slate-900">{alertStats.lowStockCount}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="flex items-center">
                <div className="p-2 bg-rose-100 rounded-lg">
                  <svg className="w-6 h-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Out of Stock</p>
                  <p className="text-2xl font-bold text-slate-900">{alertStats.outOfStockCount}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Alerts</p>
                  <p className="text-2xl font-bold text-slate-900">{alertStats.totalAlerts}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alerts Table */}
        {selectedOutletId && (
          <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                Stock Alerts for {selectedOutlet?.name}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Products that need attention
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
                <p className="mt-2 text-slate-600">Loading alerts...</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-slate-900">No alerts</h3>
                <p className="mt-1 text-sm text-slate-500">
                  All products are sufficiently stocked at this outlet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Current Stock
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Reorder Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {alerts.map((alert) => (
                      <tr key={alert.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-slate-900">
                                {alert.productName}
                              </div>
                              <div className="text-sm text-slate-500">
                                ID: {alert.productId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            alert.quantity === 0
                              ? 'bg-rose-100 text-rose-800'
                              : alert.quantity <= (alert.reorderLevel || 10)
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {alert.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {alert.reorderLevel || 'Not set'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            alert.quantity === 0
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {alert.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {/* Navigate to assign stocks page */}}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Restock
                          </button>
                          <button
                            onClick={() => {/* Mark as acknowledged */}}
                            className="text-slate-600 hover:text-slate-900"
                          >
                            Acknowledge
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
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

export default StockAlertsPage;
