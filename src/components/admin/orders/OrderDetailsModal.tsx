import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import type { Order } from '../../../types/order';

interface OrderDetailsModalProps {
  order: Order;
  onClose: () => void;
  onPrintReceipt?: (orderId: number) => void;
}

const formatCurrency = (value?: number): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
};

const formatDate = (dateString?: string): string => {
  if (!dateString) {
    return '—';
  }
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return '—';
  }
};

const getOrderTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    COUNTER: 'Counter',
    DINE_IN: 'Dine In',
    TAKEAWAY: 'Takeaway',
    DELIVERY: 'Delivery',
  };
  return labels[type] ?? type;
};

const getStatusBadgeClass = (status: string): string => {
  const classes: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-700',
    PENDING: 'bg-blue-100 text-blue-700',
    PREPARING: 'bg-amber-100 text-amber-700',
    READY: 'bg-purple-100 text-purple-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-red-100 text-red-700',
    REFUNDED: 'bg-orange-100 text-orange-700',
    ON_HOLD: 'bg-yellow-100 text-yellow-700',
  };
  return classes[status] ?? 'bg-slate-100 text-slate-700';
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    PENDING: 'Pending',
    PREPARING: 'Preparing',
    READY: 'Ready',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    REFUNDED: 'Refunded',
    ON_HOLD: 'On Hold',
  };
  return labels[status] ?? status;
};

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = memo(({ order, onClose, onPrintReceipt }) => {
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-slate-900">Order Details</h2>
            <span className="text-lg font-bold text-blue-600">{order.orderNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            {onPrintReceipt && (
              <button
                type="button"
                onClick={() => onPrintReceipt(order.id)}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Receipt
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close modal"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            {/* Order Status & Type */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Status</span>
                <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-sm font-medium ${getStatusBadgeClass(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Order Type</span>
                <span className="text-sm text-slate-900">{getOrderTypeLabel(order.orderType)}</span>
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Created Date</span>
                <span className="text-sm text-slate-900">{formatDate(order.createdDate)}</span>
              </div>
              {order.completedDate && (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">Completed Date</span>
                  <span className="text-sm text-slate-900">{formatDate(order.completedDate)}</span>
                </div>
              )}
            </div>

            {/* Outlet Information */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Outlet Information</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-600">Name</span>
                  <span className="text-sm text-slate-900">{order.outletName}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-600">Code</span>
                  <span className="text-sm text-slate-900">{order.outletCode}</span>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            {order.customerId && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Customer Information</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-600">Name</span>
                    <span className="text-sm text-slate-900">{order.customerName ?? '—'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-600">Email</span>
                    <span className="text-sm text-slate-900">{order.customerEmail ?? '—'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-600">Phone</span>
                    <span className="text-sm text-slate-900">{order.customerPhone ?? '—'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Cashier Information */}
            {order.cashierId && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">Cashier Information</h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-600">Name</span>
                    <span className="text-sm text-slate-900">{order.cashierName ?? '—'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-600">Username</span>
                    <span className="text-sm text-slate-900">{order.cashierUsername ?? '—'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Financial Details */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-900">Financial Details</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Subtotal</span>
                  <span className="text-sm font-medium text-slate-900">{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Discount</span>
                  <span className="text-sm font-medium text-slate-900">-{formatCurrency(order.discountAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Tax</span>
                  <span className="text-sm font-medium text-slate-900">{formatCurrency(order.taxAmount)}</span>
                </div>
                <div className="border-t border-slate-300 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold text-slate-900">Total</span>
                    <span className="text-base font-bold text-slate-900">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Paid Amount</span>
                  <span className="text-sm font-medium text-emerald-600">{formatCurrency(order.paidAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Change</span>
                  <span className="text-sm font-medium text-slate-900">{formatCurrency(order.changeAmount)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Notes</span>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm text-slate-900">{order.notes}</p>
                </div>
              </div>
            )}

            {/* Online Order Badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Order Source:</span>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${order.isOnline ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                {order.isOnline ? 'Online Order' : 'In-Store Order'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
});

export default memo(OrderDetailsModal);
