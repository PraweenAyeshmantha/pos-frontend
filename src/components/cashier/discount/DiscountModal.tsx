import React, { memo, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface DiscountModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (discountType: 'FIXED' | 'PERCENTAGE', discountValue: number) => void;
  totalAmount: number;
}

interface DiscountData {
  type: 'FIXED' | 'PERCENTAGE';
  value: string;
}

const DiscountModal: React.FC<DiscountModalProps> = memo(({ open, onClose, onSuccess, totalAmount }) => {
  const [discount, setDiscount] = useState<DiscountData>({ type: 'FIXED', value: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDiscount({ type: 'FIXED', value: '' });
      setError(null);
      const input = document.getElementById('discount-input');
      if (input instanceof HTMLInputElement) {
        setTimeout(() => {
          input.focus();
        }, 0);
      }
    }
  }, [open]);

  const validateDiscount = useCallback((): string | null => {
    if (!discount.value.trim()) {
      return 'Discount amount is required.';
    }

    const value = Number.parseFloat(discount.value);
    if (Number.isNaN(value) || value <= 0) {
      return 'Discount amount must be greater than 0.';
    }

    if (discount.type === 'PERCENTAGE') {
      if (value > 100) {
        return 'Percentage discount cannot exceed 100%.';
      }
    } else {
      if (value > totalAmount) {
        return `Fixed discount cannot exceed the total amount ($${totalAmount.toFixed(2)}).`;
      }
    }

    return null;
  }, [discount.type, discount.value, totalAmount]);

  const handleApplyDiscount = useCallback(() => {
    const validationError = validateDiscount();
    if (validationError) {
      setError(validationError);
      return;
    }

    onSuccess(discount.type, Number.parseFloat(discount.value));
    setDiscount({ type: 'FIXED', value: '' });
    setError(null);
  }, [discount, validateDiscount, onSuccess]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleApplyDiscount();
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [handleApplyDiscount, onClose],
  );

  const estimatedDiscount = useCallback(() => {
    if (!discount.value.trim()) return 0;
    const value = Number.parseFloat(discount.value);
    if (Number.isNaN(value)) return 0;

    let discountAmount: number;
    if (discount.type === 'PERCENTAGE') {
      discountAmount = (totalAmount * value) / 100;
    } else {
      discountAmount = Math.min(value, totalAmount);
    }
    
    // Truncate discount to 2 decimals to avoid over-discounting
    return Math.floor(discountAmount * 100) / 100;
  }, [discount, totalAmount]);

  const estimatedTotal = Math.floor((totalAmount - estimatedDiscount()) * 100) / 100;

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Apply Discount</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {/* Current Total */}
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Current Total</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              ${totalAmount.toFixed(2)}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Discount Type Selection */}
          <div>
            <label className="text-sm font-medium text-slate-700">Discount Type</label>
            <div className="mt-2 flex gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="discount-type"
                  value="FIXED"
                  checked={discount.type === 'FIXED'}
                  onChange={(e) => {
                    setDiscount((prev) => ({ ...prev, type: e.target.value as 'FIXED' | 'PERCENTAGE' }));
                    setError(null);
                  }}
                  className="h-4 w-4 border-slate-300 text-blue-600"
                />
                <span className="text-sm text-slate-600">Fixed Amount</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="discount-type"
                  value="PERCENTAGE"
                  checked={discount.type === 'PERCENTAGE'}
                  onChange={(e) => {
                    setDiscount((prev) => ({ ...prev, type: e.target.value as 'FIXED' | 'PERCENTAGE' }));
                    setError(null);
                  }}
                  className="h-4 w-4 border-slate-300 text-blue-600"
                />
                <span className="text-sm text-slate-600">Percentage</span>
              </label>
            </div>
          </div>

          {/* Discount Value Input */}
          <div>
            <label className="text-sm font-medium text-slate-700">
              {discount.type === 'FIXED' ? 'Discount Amount ($)' : 'Discount Percentage (%)'}
            </label>
            <div className="mt-1.5 relative">
              <input
                id="discount-input"
                type="number"
                min="0"
                step={discount.type === 'PERCENTAGE' ? '0.01' : '0.01'}
                value={discount.value}
                onChange={(e) => {
                  setDiscount((prev) => ({ ...prev, value: e.target.value }));
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder={discount.type === 'FIXED' ? 'e.g., 10.00' : 'e.g., 10'}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="absolute right-3 top-2.5 text-sm font-medium text-slate-500">
                {discount.type === 'FIXED' ? '$' : '%'}
              </span>
            </div>
          </div>

          {/* Summary Card */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700">Discount Amount:</span>
              <span className="font-semibold text-blue-900">
                ${estimatedDiscount().toFixed(2)}
              </span>
            </div>
            <div className="border-t border-blue-200 pt-2">
              <p className="text-xs text-blue-600">New Total</p>
              <p className="mt-1 text-xl font-bold text-blue-900">
                ${Math.max(0, estimatedTotal).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyDiscount}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Apply Discount
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
});

DiscountModal.displayName = 'DiscountModal';

export default DiscountModal;
