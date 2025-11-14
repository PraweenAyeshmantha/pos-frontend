import React from 'react';
import type { Order } from '../../../types/order';

interface PaymentSuccessModalProps {
  open: boolean;
  order: Order | null;
  onClose: () => void;
  onPrintReceipt?: () => void;
  onNewOrder?: () => void;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const formatCurrency = (value: number): string => currencyFormatter.format(value);

const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  open,
  order,
  onClose,
  onPrintReceipt,
  onNewOrder,
}) => {
  if (!open || !order) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl">
        {/* Success Icon */}
        <div className="flex flex-col items-center px-8 pt-10 pb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-10 w-10 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-slate-900">Payment Successful!</h2>
          <p className="mt-2 text-sm text-slate-500">Order #{order.orderNumber}</p>
          {!order.isOnline && (
            <p className="mt-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              Saved offline - will sync automatically
            </p>
          )}
        </div>

        {/* Change Amount (if applicable) */}
        {order.changeAmount > 0 && (
          <div className="mx-8 mb-6 rounded-2xl border-2 border-violet-200 bg-violet-50 px-6 py-5">
            <p className="text-center text-sm font-medium text-violet-700">Change Due</p>
            <p className="mt-2 text-center text-4xl font-bold text-violet-900">{formatCurrency(order.changeAmount)}</p>
          </div>
        )}

        {/* Order Summary */}
        <div className="border-t border-slate-200 px-8 py-6">
          <h3 className="text-sm font-semibold text-slate-900">Order Summary</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Subtotal</span>
              <span className="font-semibold text-slate-900">{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Discount</span>
                <span className="font-semibold text-emerald-600">-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Tax</span>
              <span className="font-semibold text-slate-900">{formatCurrency(order.taxAmount)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="font-bold text-slate-900">{formatCurrency(order.totalAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Paid</span>
              <span className="font-semibold text-slate-900">{formatCurrency(order.paidAmount)}</span>
            </div>
            {order.changeAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Change</span>
                <span className="font-semibold text-violet-600">{formatCurrency(order.changeAmount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 border-t border-slate-200 px-8 py-6">
          {onPrintReceipt && (
            <button
              type="button"
              onClick={onPrintReceipt}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Receipt
            </button>
          )}
          {onNewOrder && (
            <button
              type="button"
              onClick={onNewOrder}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Start New Order
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-slate-500 transition hover:text-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessModal;
