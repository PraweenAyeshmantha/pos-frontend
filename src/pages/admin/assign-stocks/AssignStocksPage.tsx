import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import Alert, { type AlertType } from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import StockBatchTrackingModal from '../../../components/common/StockBatchTrackingModal';
import { stockService } from '../../../services/stockService';
import type { ProductWithStock } from '../../../types/stock';
import { useOutlet } from '../../../contexts/OutletContext';

const AssignStocksPage: React.FC = () => {
  const [stocks, setStocks] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [alert, setAlert] = useState<{ type: AlertType; title: string; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingStocks, setEditingStocks] = useState<Map<number, string>>(new Map());
  const [editingPrices, setEditingPrices] = useState<Map<number, string>>(new Map());
  const [batchTrackingModal, setBatchTrackingModal] = useState<{ isOpen: boolean; product?: ProductWithStock }>({ isOpen: false });
  const { currentOutlet } = useOutlet();

  const showAlert = useCallback((type: AlertType, title: string, message: string) => {
    setAlert({ type, title, message });
  }, []);

  const fetchStocks = useCallback(async () => {
    try {
      if (!currentOutlet?.id) {
        setStocks([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const data = await stockService.getProductStocks(currentOutlet.id);
      setStocks(data);
    } catch (err) {
      console.error('Failed to load stocks', err);
      showAlert('error', 'Error', 'Failed to load stocks. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentOutlet?.id, showAlert]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

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

  const handlePriceChange = useCallback((productId: number, value: string) => {
    // Allow decimal input for prices with up to 2 decimal places
    if (!/^\d*\.?\d{0,2}$/.test(value)) {
      return;
    }
    setEditingPrices((prev) => {
      const updated = new Map(prev);
      updated.set(productId, value);
      return updated;
    });
  }, []);

  const handleUpdateStock = useCallback(
    async (stock: ProductWithStock) => {
      const newStockValue = editingStocks.get(stock.productId);
      const newPriceValue = editingPrices.get(stock.productId);
      
      if (!newStockValue || !newStockValue.trim()) {
        showAlert('error', 'Validation Error', 'Stock value cannot be empty');
        return;
      }

      const stockLevel = parseInt(newStockValue, 10);
      if (isNaN(stockLevel) || stockLevel < 0) {
        showAlert('error', 'Validation Error', 'Stock value must be a valid positive number');
        return;
      }

      let costPrice: number | undefined;
      if (newPriceValue && newPriceValue.trim()) {
        costPrice = parseFloat(newPriceValue);
        if (isNaN(costPrice) || costPrice < 0) {
          showAlert('error', 'Validation Error', 'Cost price must be a valid positive number');
          return;
        }
      }

      if (!currentOutlet?.id) {
        showAlert('error', 'Outlet Required', 'Select a branch before updating stock.');
        return;
      }

      try {
        await stockService.updateStock({
          productId: stock.productId,
          outletId: currentOutlet.id,
          stockLevel: stockLevel,
          costPrice: costPrice !== undefined ? costPrice : undefined,
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
        setEditingPrices((prev) => {
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
    [editingStocks, editingPrices, showAlert, currentOutlet?.id, fetchStocks]
  );

  const handleTrackBatches = useCallback((stock: ProductWithStock) => {
    setBatchTrackingModal({ isOpen: true, product: stock });
  }, []);

  const handleCloseBatchModal = useCallback(() => {
    setBatchTrackingModal({ isOpen: false });
  }, []);

  const handleBatchModalError = useCallback((message: string) => {
    showAlert('error', 'Error', message);
  }, [showAlert]);

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
    if (!currentOutlet) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
          Select a branch from the top navigation to view products and assign stocks.
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
                  Selling Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <div className="flex items-center">
                    Cost Price
                    <span className="ml-1 cursor-help" title="Cost price for this stock batch">ⓘ</span>
                  </div>
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
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No products match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredStocks.map((stock) => {
                  const currentStockValue = editingStocks.get(stock.productId) ?? stock.customStock?.toString() ?? '';
                  const currentPriceValue = editingPrices.get(stock.productId) ?? '';
                  
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
                        <input
                          type="text"
                          value={currentPriceValue}
                          onChange={(e) => handlePriceChange(stock.productId, e.target.value)}
                          placeholder="Cost price"
                          inputMode="decimal"
                          className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
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
                          <button
                            type="button"
                            onClick={() => handleTrackBatches(stock)}
                            className="rounded-md border border-green-600 bg-white px-3 py-2 text-sm font-semibold text-green-600 transition hover:bg-green-50"
                            title="Track stock batches"
                          >
                            📦 Track
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
    <>
      <AdminLayout>
        <div className="flex flex-col gap-8 pb-12">
          <AdminPageHeader
            title="Assign Stocks"
            description="Manage product stock levels for your outlets. View centralized stock status and update custom stock quantities per outlet."
          />

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="text-xs text-slate-500 sm:text-sm whitespace-nowrap">
                {currentOutlet
                  ? `Managing ${filteredStocks.length} of ${stocks.length} products for ${currentOutlet.name}`
                  : 'Select a branch from the top navigation to manage outlet stock levels.'}
              </div>
              <div className="relative w-full md:max-w-sm">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </section>

          {renderContent()}

          <p className="mt-6 text-sm text-slate-500">
            Update stock levels for products at the active outlet. Stock quantities are managed per branch.
          </p>
        </div>
      </AdminLayout>

      {/* Toast Notifications - positioned outside AdminLayout for proper viewport positioning */}
      <ToastContainer>
        {alert && (
          <Alert
            type={alert.type}
            title={alert.title}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}
      </ToastContainer>

      {/* Stock Batch Tracking Modal - positioned outside AdminLayout */}
      <StockBatchTrackingModal
        isOpen={batchTrackingModal.isOpen}
        product={batchTrackingModal.product}
        outletId={currentOutlet?.id}
        onClose={handleCloseBatchModal}
        onError={handleBatchModalError}
      />
    </>
  );
};

export default AssignStocksPage;
