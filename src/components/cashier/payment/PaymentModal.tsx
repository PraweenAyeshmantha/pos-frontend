import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { PaymentMethod } from '../../../types/payment';

interface PaymentEntry {
  id: string;
  paymentMethodId: number;
  amount: string;
}

interface PaymentModalProps {
  open: boolean;
  totalDue: number;
  onConfirm: (payments: { paymentMethodId: number; amount: number }[], notes: string) => void;
  onClose: () => void;
  paymentMethods: PaymentMethod[];
  enableOrderNotes?: boolean;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

const formatCurrency = (value: number): string => currencyFormatter.format(value);

const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  totalDue,
  onConfirm,
  onClose,
  paymentMethods,
  enableOrderNotes = false,
}) => {
  const [payments, setPayments] = useState<PaymentEntry[]>([
    { id: '1', paymentMethodId: paymentMethods[0]?.id ?? 1, amount: '' },
  ]);
  const [orderNotes, setOrderNotes] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setPayments([{ id: '1', paymentMethodId: paymentMethods[0]?.id ?? 1, amount: '' }]);
      setOrderNotes('');
      setCurrentAmount('');
    }
  }, [open, paymentMethods]);

  const totalPaying = useMemo(() => {
    return payments.reduce((sum, payment) => {
      const amount = parseFloat(payment.amount) || 0;
      return sum + amount;
    }, 0);
  }, [payments]);

  const payLeft = useMemo(() => Math.max(0, totalDue - totalPaying), [totalDue, totalPaying]);
  const change = useMemo(() => Math.max(0, totalPaying - totalDue), [totalPaying, totalDue]);

  const quickAmounts = useMemo(() => {
    const rounded = Math.ceil(totalDue);
    return [
      totalDue,
      rounded,
      rounded + 10,
      rounded + 20,
    ];
  }, [totalDue]);

  const handleAddPaymentMethod = useCallback(() => {
    const nextId = (Math.max(...payments.map((payment) => parseInt(payment.id))) + 1).toString();
    setPayments((prev) => [
      ...prev,
      { id: nextId, paymentMethodId: paymentMethods[0]?.id ?? 1, amount: '' },
    ]);
  }, [payments, paymentMethods]);

  const handleRemovePayment = useCallback((id: string) => {
    setPayments((prev) => prev.filter((payment) => payment.id !== id));
  }, []);

  const handlePaymentMethodChange = useCallback((id: string, methodId: number) => {
    setPayments((prev) =>
      prev.map((payment) => (payment.id === id ? { ...payment, paymentMethodId: methodId } : payment)),
    );
  }, []);

  const handleAmountChange = useCallback((id: string, amount: string) => {
    setPayments((prev) =>
      prev.map((payment) => (payment.id === id ? { ...payment, amount } : payment)),
    );
  }, []);

  const handleNumPadClick = useCallback((value: string) => {
    if (payments.length === 0) return;
    
    const currentPayment = payments[payments.length - 1];
    let newAmount = currentAmount;

    if (value === 'clear') {
      newAmount = '';
    } else if (value === 'backspace') {
      newAmount = newAmount.slice(0, -1);
    } else if (value === '.') {
      if (!newAmount.includes('.')) {
        newAmount = newAmount || '0';
        newAmount += '.';
      }
    } else if (value === '00') {
      newAmount += '00';
    } else {
      newAmount += value;
    }

    // Validate decimal places
    if (newAmount.includes('.')) {
      const parts = newAmount.split('.');
      if (parts[1] && parts[1].length > 2) {
        return;
      }
    }

    setCurrentAmount(newAmount);
    handleAmountChange(currentPayment.id, newAmount);
  }, [currentAmount, payments, handleAmountChange]);

  const handleQuickAmount = useCallback((amount: number) => {
    if (payments.length === 0) return;
    const currentPayment = payments[payments.length - 1];
    const amountStr = amount.toFixed(2);
    setCurrentAmount(amountStr);
    handleAmountChange(currentPayment.id, amountStr);
  }, [payments, handleAmountChange]);

  const handlePay = useCallback(() => {
    if (payLeft > 0) {
      return;
    }

    const validPayments = payments
      .filter((payment) => parseFloat(payment.amount) > 0)
      .map((payment) => ({
        paymentMethodId: payment.paymentMethodId,
        amount: parseFloat(payment.amount),
      }));

    if (validPayments.length === 0) {
      return;
    }

    onConfirm(validPayments, orderNotes);
  }, [payments, payLeft, orderNotes, onConfirm]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 py-4">
      <div className="flex h-[95vh] max-h-[900px] w-full max-w-5xl flex-col rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Payment</h2>
              <p className="mt-0.5 text-xs text-slate-500">Complete the order payment</p>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Payment Totals */}
        <div className="grid grid-cols-4 gap-3 border-b border-slate-200 px-6 py-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-xs font-medium text-blue-700">Total Due</p>
            <p className="mt-1 text-2xl font-bold text-blue-900">{formatCurrency(totalDue)}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <p className="text-xs font-medium text-emerald-700">Total Paying</p>
            <p className="mt-1 text-2xl font-bold text-emerald-900">{formatCurrency(totalPaying)}</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
            <p className="text-xs font-medium text-amber-700">Pay Left</p>
            <p className="mt-1 text-2xl font-bold text-amber-900">{formatCurrency(payLeft)}</p>
          </div>
          <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
            <p className="text-xs font-medium text-violet-700">Change</p>
            <p className="mt-1 text-2xl font-bold text-violet-900">{formatCurrency(change)}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid flex-1 grid-cols-2 gap-6 overflow-hidden p-6">
          {/* Left Side: Payment Methods */}
          <div className="flex flex-col space-y-3 overflow-y-auto pr-2">
            {/* Payment Entries */}
            <div className="space-y-3">
              {payments.map((payment, index) => (
                <div key={payment.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-semibold text-slate-600">Payment {index + 1}</span>
                    {payments.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePayment(payment.id)}
                        className="rounded-full p-0.5 text-slate-400 transition hover:bg-slate-200 hover:text-rose-600"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700">Method</label>
                      <select
                        value={payment.paymentMethodId}
                        onChange={(e) => handlePaymentMethodChange(payment.id, parseInt(e.target.value))}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        {paymentMethods.map((method) => (
                          <option key={method.id} value={method.id}>
                            {method.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700">Amount</label>
                      <div className="mt-1 flex rounded-lg border border-slate-200 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                        <span className="flex items-center justify-center px-2 text-xs text-slate-500">$</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={payment.amount}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
                              handleAmountChange(payment.id, value);
                              if (index === payments.length - 1) {
                                setCurrentAmount(value);
                              }
                            }
                          }}
                          onFocus={() => {
                            if (index === payments.length - 1) {
                              setCurrentAmount(payment.amount);
                            }
                          }}
                          placeholder="0.00"
                          className="flex-1 rounded-r-lg border-0 bg-transparent py-2 pr-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Another Payment Method */}
            <button
              type="button"
              onClick={handleAddPaymentMethod}
              className="w-full rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-600 transition hover:border-blue-400 hover:bg-blue-100"
            >
              <svg className="mx-auto mb-0.5 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Another Payment Method
            </button>

            {/* Order Notes */}
            {enableOrderNotes && (
              <div>
                <label className="block text-xs font-medium text-slate-700">Add Order Note</label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Add any special instructions or notes..."
                  rows={2}
                  className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            )}
          </div>

          {/* Right Side: Number Pad & Quick Amounts */}
          <div className="flex flex-col space-y-3">
            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((amount, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleQuickAmount(amount)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  {formatCurrency(amount)}
                </button>
              ))}
            </div>

            {/* Number Pad */}
            <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="grid grid-cols-3 gap-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '00'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleNumPadClick(num)}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-3.5 text-base font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-100 active:scale-95"
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleNumPadClick('clear')}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  clear
                </button>
                <button
                  type="button"
                  onClick={() => handleNumPadClick('backspace')}
                  className="flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-3 text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePay}
            disabled={payLeft > 0}
            className={`rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition ${
              payLeft > 0
                ? 'cursor-not-allowed bg-slate-300'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }`}
          >
            {payLeft > 0 ? `Pay $${payLeft.toFixed(2)} more` : 'Pay'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
