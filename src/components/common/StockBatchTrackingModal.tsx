import React, { useCallback, useEffect, useRef, useState } from 'react';
import { stockService } from '../../services/stockService';
import type { StockBatch, ProductWithStock } from '../../types/stock';

interface StockBatchTrackingModalProps {
  isOpen: boolean;
  product?: ProductWithStock;
  outletId?: number;
  onClose: () => void;
  onError?: (message: string) => void;
}

const StockBatchTrackingModal: React.FC<StockBatchTrackingModalProps> = ({
  isOpen,
  product,
  outletId,
  onClose,
  onError,
}) => {
  const [batches, setBatches] = useState<StockBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const onErrorRef = useRef(onError);

  // Update the ref whenever onError changes
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const loadBatches = useCallback(async () => {
    if (!product || !outletId) return;

    setLoading(true);
    try {
      const batchData = await stockService.getStockBatches(product.productId, outletId);
      setBatches(batchData);
    } catch (err) {
      console.error('Failed to load stock batches:', err);
      const errorMessage = 'Failed to load stock batches';
      if (onErrorRef.current) {
        onErrorRef.current(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [product, outletId]);

  useEffect(() => {
    if (isOpen && product && outletId) {
      loadBatches();
    } else if (!isOpen) {
      // Reset state when modal closes
      setBatches([]);
      setLoading(false);
    }
  }, [isOpen, product, outletId, loadBatches]);

  if (!isOpen || !product) return null;

  // Separate batches into categories
  const availableBatches = batches.filter(batch => batch.remainingQuantity > 0);
  const currentBatch = availableBatches.length > 0 ? availableBatches[0] : null; // First available batch (FIFO)
  const consumedBatches = batches
    .filter(batch => batch.remainingQuantity === 0)
    .sort((a, b) => new Date(b.modifiedDate || b.batchDate).getTime() - new Date(a.modifiedDate || a.batchDate).getTime())
    .slice(0, 5); // Show up to 5 consumed batches
  const futureBatches = availableBatches.length > 1 ? availableBatches.slice(1) : []; // All other available batches

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Stock Batch Tracking - {product.productName}
            </h2>
            <p className="text-sm text-slate-600">
              Track stock consumption across different batches
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                <p className="mt-2 text-slate-600">Loading batches...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Batch Being Consumed */}
              {currentBatch && (
                <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
                  <h3 className="mb-3 flex items-center text-sm font-semibold text-blue-900">
                    <span className="mr-2">🔄</span>
                    Currently Consuming
                  </h3>
                  <div className="rounded-lg bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
                      <div>
                        <p className="text-xs font-medium text-slate-500">Batch Number</p>
                        <p className="text-sm font-semibold text-slate-900">{currentBatch.batchNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">Remaining</p>
                        <p className="text-sm font-semibold text-green-600">{currentBatch.remainingQuantity.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">Cost Price</p>
                        <p className="text-sm font-semibold text-slate-900">${currentBatch.costPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500">Selling Price</p>
                        <p className="text-sm font-semibold text-slate-900">${currentBatch.sellingPrice.toFixed(2)}</p>
                      </div>
                      <div className="md:col-span-1">
                        <p className="text-xs font-medium text-slate-500">Batch Date</p>
                        <p className="text-sm text-slate-600">{formatDate(currentBatch.batchDate)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recently Consumed Batches */}
              {consumedBatches.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="mb-3 flex items-center text-sm font-semibold text-slate-900">
                    <span className="mr-2">✅</span>
                    Recently Consumed Batches
                  </h3>
                  <div className="space-y-3">
                    {consumedBatches.map((batch) => (
                      <div key={batch.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
                          <div>
                            <p className="text-xs font-medium text-slate-500">Batch Number</p>
                            <p className="text-sm font-semibold text-slate-900">{batch.batchNumber}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500">Quantity</p>
                            <p className="text-sm text-slate-600">{batch.quantity.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500">Cost Price</p>
                            <p className="text-sm text-slate-600">${batch.costPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500">Selling Price</p>
                            <p className="text-sm text-slate-600">${batch.sellingPrice.toFixed(2)}</p>
                          </div>
                          <div className="md:col-span-1">
                            <p className="text-xs font-medium text-slate-500">Consumed Date</p>
                            <p className="text-sm text-slate-600">{formatDate(batch.modifiedDate || batch.batchDate)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Future Batches to Consume */}
              {futureBatches.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="mb-3 flex items-center text-sm font-semibold text-slate-900">
                    <span className="mr-2">⏳</span>
                    Future Batches to Consume
                  </h3>
                  <div className="space-y-3">
                    {futureBatches.map((batch) => (
                      <div key={batch.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
                          <div>
                            <p className="text-xs font-medium text-slate-500">Batch Number</p>
                            <p className="text-sm font-semibold text-slate-900">{batch.batchNumber}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500">Remaining</p>
                            <p className="text-sm font-semibold text-blue-600">{batch.remainingQuantity.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500">Cost Price</p>
                            <p className="text-sm text-slate-600">${batch.costPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-500">Selling Price</p>
                            <p className="text-sm text-slate-600">${batch.sellingPrice.toFixed(2)}</p>
                          </div>
                          <div className="md:col-span-1">
                            <p className="text-xs font-medium text-slate-500">Batch Date</p>
                            <p className="text-sm text-slate-600">{formatDate(batch.batchDate)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No batches message */}
              {batches.length === 0 && !loading && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="text-slate-600">No stock batches found for this product.</p>
                  <p className="mt-1 text-sm text-slate-500">Add stock to create batches.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockBatchTrackingModal;