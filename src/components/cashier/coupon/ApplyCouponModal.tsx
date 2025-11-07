import React, { memo, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { couponService } from '../../../services/couponService';
import type { Coupon } from '../../../types/coupon';

interface CartItem {
  productId: number;
  name: string;
  price?: number;
  quantity?: number;
  weight?: number | null;
  isWeightBased?: boolean;
}

interface ApplyCouponModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (coupon: Coupon) => void;
  totalAmount: number;
  cartItems?: CartItem[];
}

const ApplyCouponModal: React.FC<ApplyCouponModalProps> = memo(({ open, onClose, onSuccess, totalAmount, cartItems = [] }) => {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [couponDetails, setCouponDetails] = useState<Coupon | null>(null);

  useEffect(() => {
    if (open) {
      setCouponCode('');
      setError(null);
      setWarning(null);
      setCouponDetails(null);
      const input = document.getElementById('coupon-code-input');
      if (input instanceof HTMLInputElement) {
        input.focus();
      }
    }
  }, [open]);

  const checkProductApplicability = useCallback(
    (coupon: Coupon): { applicable: boolean; message: string | null } => {
      // If no product IDs are specified, coupon applies to all products
      if (!coupon.applicableProductIds || coupon.applicableProductIds.length === 0) {
        return { applicable: true, message: null };
      }

      // Check if any cart items are applicable
      const applicableItems = cartItems.filter((item) =>
        coupon.applicableProductIds?.includes(item.productId),
      );

      if (applicableItems.length === 0) {
        return {
          applicable: false,
          message: 'This coupon does not apply to any items in your cart.',
        };
      }

      if (applicableItems.length < cartItems.length) {
        const inapplicableItems = cartItems.filter(
          (item) => !coupon.applicableProductIds?.includes(item.productId),
        );
        return {
          applicable: true,
          message: `This coupon applies to ${applicableItems.length} of ${cartItems.length} items. The following items won't get the discount: ${inapplicableItems.map((item) => item.name).join(', ')}.`,
        };
      }

      return { applicable: true, message: null };
    },
    [cartItems],
  );

  const handleSearch = useCallback(async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code.');
      return;
    }

    setLoading(true);
    setError(null);
    setWarning(null);
    setCouponDetails(null);

    try {
      const coupon = await couponService.getByCode(couponCode.trim().toUpperCase());
      
      // Validate coupon
      if (coupon.recordStatus !== 'ACTIVE') {
        setError('This coupon is not active.');
        setCouponDetails(null);
        return;
      }

      if (coupon.validFrom && new Date(coupon.validFrom) > new Date()) {
        setError('This coupon is not valid yet.');
        setCouponDetails(null);
        return;
      }

      if (coupon.validTo && new Date(coupon.validTo) < new Date()) {
        setError('This coupon has expired.');
        setCouponDetails(null);
        return;
      }

      if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
        setError('This coupon has reached its usage limit.');
        setCouponDetails(null);
        return;
      }

      // Check product applicability
      const { applicable, message } = checkProductApplicability(coupon);
      if (!applicable) {
        setError(message);
        setCouponDetails(null);
        return;
      }

      // Set warning if partial applicability
      if (message) {
        setWarning(message);
      }

      setCouponDetails(coupon);
    } catch (err) {
      console.error('Error fetching coupon:', err);
      setError('Coupon not found or is invalid.');
      setCouponDetails(null);
    } finally {
      setLoading(false);
    }
  }, [couponCode, checkProductApplicability]);

  const handleApplyCoupon = useCallback(() => {
    if (!couponDetails) {
      return;
    }
    onSuccess(couponDetails);
    setCouponCode('');
    setCouponDetails(null);
    setError(null);
  }, [couponDetails, onSuccess]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !couponDetails) {
        e.preventDefault();
        void handleSearch();
      } else if (e.key === 'Enter' && couponDetails) {
        e.preventDefault();
        handleApplyCoupon();
      } else if (e.key === 'Escape') {
        onClose();
      }
    },
    [couponDetails, handleSearch, handleApplyCoupon, onClose],
  );

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Apply Coupon</h2>
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

          {/* Warning Message - Partial Applicability */}
          {warning && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3">
              <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4v2m.95-15A10.5 10.5 0 1112.5 22.5" />
              </svg>
              <p className="text-sm text-amber-700">{warning}</p>
            </div>
          )}

          {/* Coupon Code Input */}
          <div>
            <label className="text-sm font-medium text-slate-700">Coupon Code</label>
            <div className="mt-1.5 flex gap-2">
              <input
                id="coupon-code-input"
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                disabled={loading || !!couponDetails}
                placeholder="Enter coupon code"
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
              />
              {!couponDetails && (
                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={loading || !couponCode.trim()}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={2} fill="none" opacity={0.25} />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    'Search'
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Coupon Details */}
          {couponDetails && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-900">{couponDetails.code}</p>
                  {couponDetails.description && (
                    <p className="mt-1 text-xs text-emerald-700">{couponDetails.description}</p>
                  )}
                </div>
                <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                  ✓ Valid
                </span>
              </div>

              {/* Discount Info */}
              <div className="space-y-2 border-t border-emerald-200 pt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-700">Discount:</span>
                  <span className="font-semibold text-emerald-900">
                    {couponDetails.discountType === 'PERCENTAGE'
                      ? `${couponDetails.discountValue}%`
                      : `$${couponDetails.discountValue.toFixed(2)}`}
                  </span>
                </div>
                
                {couponDetails.usageLimit && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-600">Uses remaining:</span>
                    <span className="font-medium text-emerald-800">
                      {couponDetails.usageLimit - couponDetails.timesUsed} / {couponDetails.usageLimit}
                    </span>
                  </div>
                )}
              </div>

              {/* Estimated Total */}
              <div className="border-t border-emerald-200 pt-3">
                <p className="text-xs text-emerald-600">
                  {couponDetails.applicableProductIds && couponDetails.applicableProductIds.length > 0
                    ? 'Estimated Savings'
                    : 'Estimated Savings (Full Cart)'}
                </p>
                
                {/* Calculate discount based on applicable items */}
                {(() => {
                  const hasRestrictions =
                    couponDetails.applicableProductIds &&
                    couponDetails.applicableProductIds.length > 0;

                  let applicableSubtotal = totalAmount;
                  if (hasRestrictions) {
                    applicableSubtotal = cartItems
                      .filter((item) =>
                        couponDetails.applicableProductIds?.includes(item.productId),
                      )
                      .reduce((acc, item) => {
                        const price = item.price || 0;
                        // Handle weight-based products
                        if (item.isWeightBased && item.weight) {
                          return acc + price * item.weight;
                        }
                        // Handle regular products
                        const quantity = item.quantity || 1;
                        return acc + price * quantity;
                      }, 0);
                    // Don't round here - keep full precision for percentage calculation
                  }

                  let discountAmount =
                    couponDetails.discountType === 'PERCENTAGE'
                      ? (applicableSubtotal * couponDetails.discountValue) / 100
                      : couponDetails.discountValue;
                  
                  // Round discount down to avoid over-discounting by a cent due to floating point
                  discountAmount = Math.floor(discountAmount * 100) / 100;

                  const newTotal = Math.max(0, Math.floor((totalAmount - discountAmount) * 100) / 100);

                  return (
                    <>
                      <p className="mt-1 text-lg font-bold text-emerald-900">
                        -${discountAmount.toFixed(2)}
                      </p>
                      <p className="mt-2 text-xs text-emerald-600">New Total</p>
                      <p className="mt-1 text-xl font-bold text-emerald-900">
                        ${newTotal.toFixed(2)}
                      </p>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
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
            onClick={handleApplyCoupon}
            disabled={!couponDetails || loading}
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : 'Apply Coupon'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
});

ApplyCouponModal.displayName = 'ApplyCouponModal';

export default ApplyCouponModal;
