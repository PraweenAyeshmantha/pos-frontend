import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
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
      // Set first outlet as default if available
      if (data.length > 0 && !selectedOutlet) {
        setSelectedOutlet(data[0].name);
      }
    } catch (err) {
      console.error('Failed to load outlets', err);
      showAlert('error', 'Error', 'Failed to load outlets. Please try again.');
    }
  }, [selectedOutlet, showAlert]);

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
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        </div>
      );
    }

    if (stocks.length === 0) {
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-700">
          No products found. Create products before assigning stocks.
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  <div className="flex items-center">
                    <span className="mr-1">📷</span>
                    Name
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Product Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Barcode
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  <div className="flex items-center">
                    Custom Stock
                    <span className="ml-1 cursor-help" title="Custom stock for this outlet">ⓘ</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No products match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredStocks.map((stock) => {
                  const currentStockValue = editingStocks.get(stock.productId) ?? stock.customStock?.toString() ?? '';
                  
                  return (
                    <tr key={stock.productId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-md bg-gray-100 flex items-center justify-center mr-3">
                            <span className="text-gray-400 text-xs">📦</span>
                          </div>
                          <div className="text-sm font-medium text-gray-900">{stock.productName}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800">
                          {stock.productType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 font-mono">{stock.barcode || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          <span className="font-semibold text-gray-900">${stock.price.toFixed(2)}</span>
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
                            className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
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
      <div className="min-h-screen bg-gray-100">
        <div className="mx-auto max-w-7xl px-6 py-8">
          {/* Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-800">Assign Stocks</h1>
            <p className="mt-2 text-gray-600 max-w-2xl">
              Manage product stock levels for your outlets. View centralized stock status and update custom stock quantities per outlet.
            </p>
          </header>

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

          {/* Filters */}
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <label htmlFor="outlet-filter" className="text-sm font-medium text-gray-700">
                  Select Outlet:
                </label>
                <select
                  id="outlet-filter"
                  value={selectedOutlet}
                  onChange={(e) => setSelectedOutlet(e.target.value)}
                  className="h-10 w-64 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {outlets.map((outlet) => (
                    <option key={outlet.id} value={outlet.name}>
                      {outlet.name}
                    </option>
                  ))}
                </select>
                
                <button
                  type="button"
                  onClick={fetchStocks}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Filter
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {filteredStocks.length === stocks.length
                    ? `Showing ${stocks.length} product${stocks.length !== 1 ? 's' : ''}`
                    : `Showing ${filteredStocks.length} of ${stocks.length} product${stocks.length !== 1 ? 's' : ''}`}
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-80 rounded-lg border border-gray-200 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {/* Products Table */}
          {renderContent()}

          <p className="mt-6 text-sm text-gray-500">
            Update stock levels for products at the selected outlet. Stock quantities are managed per outlet.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AssignStocksPage;
