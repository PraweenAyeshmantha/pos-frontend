import React, { useCallback, useState, useEffect } from 'react';
import Alert, { type AlertType } from '../../common/Alert';
import ToastContainer from '../../common/ToastContainer';
import { orderService } from '../../../services/orderService';
import type { Order, OrderItem, PartialRefundRequest, RefundResponse } from '../../../types/order';
import { formatCurrency } from '../../../utils/currency';

interface RefundModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (refundResponse: RefundResponse) => void;
  order?: Order | null;
}

interface RefundItem {
  orderItemId: number;
  productName: string;
  availableQuantity: number;
  unitPrice: number;
  refundQuantity: number;
  maxRefundQuantity: number;
}

const RefundModal: React.FC<RefundModalProps> = ({ open, onClose, onSuccess, order: initialOrder }) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [refundItems, setRefundItems] = useState<RefundItem[]>([]);
  const [restockItems, setRestockItems] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [refundType, setRefundType] = useState<'full' | 'partial' | 'custom'>('partial');
  const [customRefundAmount, setCustomRefundAmount] = useState<string>('');
  const [toast, setToast] = useState<{ type: AlertType; title: string; message: string } | null>(null);

  const showToast = useCallback((type: AlertType, title: string, message: string) => {
    setToast({ type, title, message });
  }, []);

  // Handle initial order when provided
  useEffect(() => {
    if (initialOrder && open) {
      if (initialOrder.status !== 'COMPLETED') {
        showToast('error', 'Invalid Order', 'Only completed orders can be refunded.');
        return;
      }

      // Fetch full order details including items
      const fetchFullOrder = async () => {
        try {
          const fullOrder = await orderService.getOrderDetails(initialOrder.id);
          setOrder(fullOrder);

          // Initialize refund items
          const items: RefundItem[] = (fullOrder.items || []).map((item: OrderItem) => ({
            orderItemId: item.id,
            productName: item.productName,
            availableQuantity: item.quantity,
            unitPrice: item.unitPrice,
            refundQuantity: 0,
            maxRefundQuantity: item.quantity,
          }));

          setRefundItems(items);
        } catch (error) {
          console.error('Failed to load full order details:', error);
          showToast('error', 'Failed to Load Order', 'Could not load order details for refund.');
        }
      };

      fetchFullOrder();
    }
  }, [initialOrder, open, showToast]);

  const resetModal = useCallback(() => {
    setOrderNumber('');
    setOrder(null);
    setRefundItems([]);
    setRestockItems(false);
    setReason('');
    setLoading(false);
    setRefundType('partial');
    setCustomRefundAmount('');
  }, []);

  const handleClose = useCallback(() => {
    resetModal();
    onClose();
  }, [resetModal, onClose]);

  const handleSearchOrder = useCallback(async () => {
    if (!orderNumber.trim()) {
      showToast('error', 'Invalid Input', 'Please enter an order number.');
      return;
    }

    try {
      setSearching(true);
      const foundOrder = await orderService.getByOrderNumber(orderNumber.trim());

      if (foundOrder.status !== 'COMPLETED') {
        showToast('error', 'Invalid Order', 'Only completed orders can be refunded.');
        return;
      }

      setOrder(foundOrder);

      // Initialize refund items
      const items: RefundItem[] = (foundOrder.items || []).map((item: OrderItem) => ({
        orderItemId: item.id,
        productName: item.productName,
        availableQuantity: item.quantity,
        unitPrice: item.unitPrice,
        refundQuantity: 0,
        maxRefundQuantity: item.quantity,
      }));

      setRefundItems(items);
    } catch (error) {
      console.error('Failed to find order:', error);
      showToast('error', 'Order Not Found', 'Could not find an order with that number.');
    } finally {
      setSearching(false);
    }
  }, [orderNumber, showToast]);

  const handleRefundQuantityChange = useCallback((orderItemId: number, quantity: number) => {
    setRefundItems((prev) =>
      prev.map((item) =>
        item.orderItemId === orderItemId
          ? { ...item, refundQuantity: Math.max(0, Math.min(quantity, item.maxRefundQuantity)) }
          : item
      )
    );
  }, []);

  const getTotalRefundAmount = useCallback(() => {
    return refundItems.reduce((total, item) => total + item.refundQuantity * item.unitPrice, 0);
  }, [refundItems]);

  const hasSelectedItems = useCallback(() => {
    return refundItems.some((item) => item.refundQuantity > 0);
  }, [refundItems]);

  const handleProcessRefund = useCallback(async () => {
    if (!order) {
      showToast('error', 'No Order', 'Please search for an order first.');
      return;
    }

    try {
      setLoading(true);

      let refundResponse: RefundResponse;

      if (refundType === 'full') {
        refundResponse = await orderService.processFullRefund(order.id, reason || undefined, restockItems);
      } else if (refundType === 'custom') {
        // Validate custom amount
        const amount = parseFloat(customRefundAmount);
        if (isNaN(amount) || amount <= 0) {
          showToast('error', 'Invalid Amount', 'Please enter a valid refund amount.');
          return;
        }
        if (amount > order.totalAmount) {
          showToast('error', 'Amount Too High', 'Refund amount cannot exceed order total.');
          return;
        }
        
        // TODO: Implement custom refund API endpoint
        showToast('error', 'Not Implemented', 'Custom refund amount feature is pending backend implementation.');
        return;
      } else {
        const selectedItems = refundItems.filter((item) => item.refundQuantity > 0);

        if (selectedItems.length === 0) {
          showToast('error', 'No Items Selected', 'Please select at least one item to refund.');
          return;
        }

        const request: PartialRefundRequest = {
          items: selectedItems.map((item) => ({
            orderItemId: item.orderItemId,
            quantity: item.refundQuantity,
          })),
          reason: reason || undefined,
          restockItems,
        };
        refundResponse = await orderService.processPartialRefund(order.id, request);
      }

      const refundMessage = `Successfully refunded ${formatCurrency(refundResponse.refundedAmount)}`;
      showToast('success', 'Refund Processed', refundMessage);

      if (onSuccess) {
        onSuccess(refundResponse);
      }

      handleClose();
    } catch (error) {
      console.error('Failed to process refund:', error);
      showToast('error', 'Refund Failed', 'Failed to process refund. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [order, refundType, refundItems, reason, restockItems, customRefundAmount, showToast, onSuccess, handleClose]);

  if (!open) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Process Refund</h2>
            <p className="mt-1 text-sm text-slate-600">
              {initialOrder ? 'Select items to refund from this order.' : 'Search for an order and select items to refund.'}
            </p>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
            {/* Order Search - only show when no initial order provided */}
            {!initialOrder && (
              <div className="mb-6">
                <label htmlFor="orderNumber" className="block text-sm font-medium text-slate-700">
                  Order Number
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    id="orderNumber"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchOrder()}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Enter order number..."
                    disabled={searching}
                  />
                  <button
                    type="button"
                    onClick={handleSearchOrder}
                    disabled={searching || !orderNumber.trim()}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {searching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>
            )}

            {/* Order Details */}
            {order && (
              <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-slate-700">Order:</span> {order.orderNumber}
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Total:</span> {formatCurrency(order.totalAmount ?? 0)}
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Customer:</span> {order.customerName || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium text-slate-700">Date:</span>{' '}
                    {new Date(order.createdDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}

            {/* Refund Type Selection */}
            {order && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Refund Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setRefundType('full')}
                    className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                      refundType === 'full'
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🔄</span>
                      <div className="text-left">
                        <div className="font-semibold">Full Refund</div>
                        <div className="text-xs opacity-75">Refund entire order</div>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundType('partial')}
                    className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                      refundType === 'partial'
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📦</span>
                      <div className="text-left">
                        <div className="font-semibold">Partial Refund</div>
                        <div className="text-xs opacity-75">Select specific items</div>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundType('custom')}
                    className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                      refundType === 'custom'
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">💰</span>
                      <div className="text-left">
                        <div className="font-semibold">Custom Amount</div>
                        <div className="text-xs opacity-75">Enter specific amount</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Refund Items */}
            {refundItems.length > 0 && refundType === 'partial' && (
              <div className="mb-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-700">Select Items to Refund</h3>
                  <span className="text-xs text-slate-500">Enter quantities below</span>
                </div>
                <div className="space-y-3">
                  {refundItems.map((item) => (
                    <div key={item.orderItemId} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{item.productName}</div>
                        <div className="text-sm text-slate-600">
                          Available: {item.availableQuantity} × {formatCurrency(item.unitPrice)} each
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Max refund: {item.maxRefundQuantity} item{item.maxRefundQuantity !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <label htmlFor={`quantity-${item.orderItemId}`} className="text-sm font-medium text-slate-700">
                            Refund:
                          </label>
                          <input
                            id={`quantity-${item.orderItemId}`}
                            type="number"
                            min="0"
                            max={item.maxRefundQuantity}
                            value={item.refundQuantity}
                            onChange={(e) => handleRefundQuantityChange(item.orderItemId, parseInt(e.target.value) || 0)}
                            className="w-16 rounded border border-slate-300 px-2 py-1 text-sm text-center focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="0"
                          />
                        </div>
                        {item.refundQuantity > 0 && (
                          <div className="text-xs text-blue-600 font-medium">
                            = {formatCurrency(item.refundQuantity * item.unitPrice)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-lg bg-blue-50 p-3">
                  <div className="text-sm">
                    <span className="font-medium text-blue-900">Total selected: </span>
                    <span className="font-semibold text-blue-700">{formatCurrency(getTotalRefundAmount())}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Amount Input */}
            {order && refundType === 'custom' && (
              <div className="mb-6">
                <label htmlFor="customAmount" className="block text-sm font-medium text-slate-700 mb-2">
                  Refund Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    id="customAmount"
                    type="number"
                    min="0.01"
                    max={order.totalAmount}
                    step="0.01"
                    value={customRefundAmount}
                    onChange={(e) => setCustomRefundAmount(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 pl-7 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Maximum refundable: {formatCurrency(order.totalAmount)}
                </p>
              </div>
            )}

            {/* Refund Options */}
            {order && (refundType === 'full' || refundType === 'custom' || hasSelectedItems()) && (
              <div className="mb-6 space-y-4">
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-slate-700">
                    Reason (Optional)
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Enter refund reason..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="restockItems"
                    checked={restockItems}
                    onChange={(e) => setRestockItems(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    disabled={refundType === 'custom'}
                  />
                  <label htmlFor="restockItems" className="ml-2 text-sm text-slate-700">
                    Restock refunded items to inventory
                    {refundType === 'custom' && (
                      <span className="ml-1 text-xs text-slate-500">(Not available for custom amount refunds)</span>
                    )}
                  </label>
                </div>

                {/* Show refund amount */}
                {refundType === 'partial' && hasSelectedItems() && (
                  <div className="rounded-lg bg-blue-50 p-3">
                    <div className="text-sm font-medium text-blue-900">
                      Total Refund Amount: {formatCurrency(getTotalRefundAmount())}
                    </div>
                  </div>
                )}

                {refundType === 'custom' && customRefundAmount && (
                  <div className="rounded-lg bg-amber-50 p-3">
                    <div className="text-sm font-medium text-amber-900">
                      Refund Amount: {formatCurrency(parseFloat(customRefundAmount) || 0)}
                    </div>
                  </div>
                )}

                {refundType === 'full' && (
                  <div className="rounded-lg bg-amber-50 p-3">
                    <div className="text-sm font-medium text-amber-900">
                      Full Refund Amount: {formatCurrency(order.totalAmount ?? 0)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 px-6 py-4">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessRefund}
                disabled={
                  loading || 
                  !order || 
                  (refundType === 'partial' && !hasSelectedItems()) ||
                  (refundType === 'custom' && (!customRefundAmount || parseFloat(customRefundAmount) <= 0))
                }
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
              >
                {loading 
                  ? 'Processing...' 
                  : refundType === 'full' 
                    ? 'Process Full Refund' 
                    : refundType === 'custom'
                      ? 'Process Custom Refund'
                      : 'Process Partial Refund'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <ToastContainer>
          <Alert
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </ToastContainer>
      )}
    </>
  );
};

export default RefundModal;
