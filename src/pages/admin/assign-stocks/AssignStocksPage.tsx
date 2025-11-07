import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import Alert, { type AlertType } from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import { stockService } from '../../../services/stockService';
import { outletService } from '../../../services/outletService';
import type { ProductWithStock } from '../../../types/stock';
import type { Outlet } from '../../../types/outlet';

const AssignStocksPage: React.FC = () => {
  const [stocks, setStocks] = useState<ProductWithStock[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [alert, setAlert] = useState<{ type: AlertType; title: string; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingStocks, setEditingStocks] = useState<Map<number, string>>(new Map());

  const showAlert = useCallback((type: AlertType, title: string, message: string) => {
    setAlert({ type, title, message });
  }, []);

  const fetchOutlets = useCallback(async () => {
    try {
      const data = await outletService.getAll();
      setOutlets(data);
    } catch (err) {
      console.error('Failed to load outlets', err);
      showAlert('error', 'Error', 'Failed to load outlets. Please try again.');
    }
  }, [showAlert]);

  const fetchStocks = useCallback(async () => {
    try {
      setLoading(true);
      // Find the outlet ID from the selected outlet name
      const outlet = outlets.find(o => o.name === selectedOutlet);
      const data = await stockService.getProductStocks(outlet?.id);
      setStocks(data);
    } catch (err) {
      console.error('Failed to load stocks', err);
      showAlert('error', 'Error', 'Failed to load stocks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedOutlet, outlets, showAlert]);

  useEffect(() => {
    fetchOutlets();
  }, [fetchOutlets]);

  useEffect(() => {
    if (outlets.length > 0 && selectedOutlet) {
      fetchStocks();
    } else if (outlets.length > 0 && !selectedOutlet) {
      setLoading(false);
    }
  }, [fetchStocks, outlets.length, selectedOutlet]);

  const handleStockChange = useCallback((productId: number, value: string) => {
    // Only allow numeric input
    if (!/^\d*$/.test(value)) {
      return;
    }
    setEditingStocks((prev) => {
      const updated = new Map(prev);
      updated.set(productId, value);
      return updated;
    });
  }, []);

  const handleUpdateStock = useCallback(
    async (stock: ProductWithStock) => {
      const newStockValue = editingStocks.get(stock.productId);
      
      if (!newStockValue || !newStockValue.trim()) {
        showAlert('error', 'Validation Error', 'Stock value cannot be empty');
        return;
      }

      const stockLevel = parseInt(newStockValue, 10);
      if (isNaN(stockLevel) || stockLevel < 0) {
        showAlert('error', 'Validation Error', 'Stock value must be a valid positive number');
        return;
      }

      if (stockLevel === stock.customStock) {
        showAlert('info', 'No Change', 'Stock value is the same');
        return;
      }

      try {
        const outlet = outlets.find(o => o.name === selectedOutlet);
        await stockService.updateStock({
          productId: stock.productId,
          outletId: outlet?.id,
          stockLevel: stockLevel,
        });
        
        showAlert('success', 'Success', 'Stock updated successfully');
        
        // Update the stock in the list
        setStocks((prev) =>
          prev.map((s) => (s.productId === stock.productId ? { ...s, customStock: stockLevel, isInStock: stockLevel > 0 } : s))
        );
        
        // Clear editing state
        setEditingStocks((prev) => {
          const updated = new Map(prev);
          updated.delete(stock.productId);
          return updated;
        });
        
        // Refresh stocks
        fetchStocks();
      } catch (err) {
        console.error('Failed to update stock', err);
        showAlert('error', 'Update Failed', 'Unable to update stock. Please try again.');
      }
    },
    [editingStocks, showAlert, outlets, selectedOutlet, fetchStocks]
  );

  const filteredStocks = stocks.filter((stock) => {
    if (!searchQuery) {
      return true;
    }
    const query = searchQuery.toLowerCase();
    return (
      stock.productName.toLowerCase().includes(query) ||
      stock.productType.toLowerCase().includes(query) ||
      stock.barcode?.toLowerCase().includes(query) ||
      stock.price.toString().includes(query)
    );
  });

  const renderContent = () => {
    if (!selectedOutlet) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
          Select an outlet to view products and assign stocks.
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-4 text-slate-600">Loading products...</p>
          </div>
        </div>
      );
    }

    if (stocks.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
          No products found. Create products before assigning stocks.
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <div className="flex items-center">
                    <span className="mr-1">📷</span>
                    Name
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Product Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Barcode
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <div className="flex items-center">
                    Custom Stock
                    <span className="ml-1 cursor-help" title="Custom stock for this outlet">ⓘ</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No products match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredStocks.map((stock) => {
                  const currentStockValue = editingStocks.get(stock.productId) ?? stock.customStock?.toString() ?? '';
                  
                  return (
                    <tr key={stock.productId} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-md bg-slate-100 flex items-center justify-center mr-3">
                            <span className="text-slate-400 text-xs">📦</span>
                          </div>
                          <div className="text-sm font-medium text-slate-900">{stock.productName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800">
                          {stock.productType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600 font-mono">{stock.barcode || '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">
                          <span className="font-semibold text-slate-900">${stock.price.toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={currentStockValue}
                            onChange={(e) => handleStockChange(stock.productId, e.target.value)}
                            placeholder="Enter stock"
                            inputMode="numeric"
                            className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateStock(stock)}
                            className="rounded-md border border-blue-600 bg-white px-3 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                          >
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8 pb-12">
        <AdminPageHeader
          title="Assign Stocks"
          description="Manage product stock levels for your outlets. View centralized stock status and update custom stock quantities per outlet."
        />

        {/* Alert */}
        {alert && (
          <ToastContainer>
            <Alert
              type={alert.type}
              title={alert.title}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          </ToastContainer>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-xs text-slate-500 sm:text-sm whitespace-nowrap">
              {filteredStocks.length === stocks.length
                ? `Showing ${stocks.length} product${stocks.length !== 1 ? 's' : ''}`
                : `Showing ${filteredStocks.length} of ${stocks.length} product${stocks.length !== 1 ? 's' : ''}`}
            </div>
            <div className="flex w-full flex-col items-stretch gap-3 md:flex-row md:justify-end md:gap-3">
              <select
                value={selectedOutlet}
                onChange={(e) => setSelectedOutlet(e.target.value)}
                className="h-10 w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select Outlet</option>
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.name}>
                    {outlet.name}
                  </option>
                ))}
              </select>
              <div className="relative w-full md:max-w-xs">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>
        </section>

          {/* Products Table */}
          {renderContent()}

          <p className="mt-6 text-sm text-slate-500">
            Update stock levels for products at the selected outlet. Stock quantities are managed per outlet.
          </p>
      </div>
    </AdminLayout>
  );
};

export default AssignStocksPage;
