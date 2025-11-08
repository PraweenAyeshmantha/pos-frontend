import React, { memo, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { couponService } from '../../../services/couponService';
import type { Coupon, CreateCouponPayload, DiscountType } from '../../../types/coupon';
import ProductSelector from './ProductSelector';

interface EditCouponModalProps {
  coupon: Coupon;
  onClose: () => void;
  onSuccess: (coupon: Coupon) => void;
  mode?: 'edit' | 'view';
}

type FormData = {
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: string;
  validFrom: string;
  validTo: string;
  usageLimit: string;
  applicableProductIds: number[];
};

const EditCouponModal: React.FC<EditCouponModalProps> = memo(({ coupon, onClose, onSuccess, mode = 'edit' }) => {
  const isViewMode = mode === 'view';
  const readOnlyModifiers = isViewMode ? ' cursor-not-allowed bg-slate-50' : '';

  const [formData, setFormData] = useState<FormData>(() => ({
    code: coupon.code,
    description: coupon.description ?? '',
    discountType: coupon.discountType,
    discountValue: coupon.discountValue.toString(),
    validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().slice(0, 16) : '',
    validTo: coupon.validTo ? new Date(coupon.validTo).toISOString().slice(0, 16) : '',
    usageLimit: coupon.usageLimit?.toString() ?? '',
    applicableProductIds: coupon.applicableProductIds ?? [],
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isViewMode) {
      return;
    }
    const input = document.getElementById('edit-coupon-code-input');
    if (input instanceof HTMLInputElement) {
      input.focus();
    }
  }, [isViewMode]);

  const handleChange = useCallback(
    (field: keyof FormData, value: string) => {
      if (isViewMode) {
        return;
      }
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      setError(null);
    },
    [isViewMode],
  );

  const validateForm = useCallback((): string | null => {
    if (!formData.code.trim()) {
      return 'Coupon code is required.';
    }

    if (formData.code.trim().length > 50) {
      return 'Coupon code must be 50 characters or less.';
    }

    if (!formData.discountValue.trim()) {
      return 'Discount value is required.';
    }

    const discountValue = Number.parseFloat(formData.discountValue);
    if (Number.isNaN(discountValue) || discountValue <= 0) {
      return 'Discount value must be greater than 0.';
    }

    if (formData.discountType === 'PERCENTAGE' && discountValue > 100) {
      return 'Percentage discount cannot exceed 100%.';
    }

    if (formData.usageLimit.trim()) {
      const usageLimit = Number.parseInt(formData.usageLimit, 10);
      if (Number.isNaN(usageLimit) || usageLimit <= 0) {
        return 'Usage limit must be a positive number.';
      }
    }

    if (formData.validFrom.trim() && formData.validTo.trim()) {
      const validFrom = new Date(formData.validFrom);
      const validTo = new Date(formData.validTo);
      if (validFrom >= validTo) {
        return 'Valid from date must be before valid to date.';
      }
    }

    return null;
  }, [formData]);

  const buildPayload = useCallback((): CreateCouponPayload => {
    return {
      code: formData.code.trim(),
      description: formData.description.trim() || undefined,
      discountType: formData.discountType,
      discountValue: Number.parseFloat(formData.discountValue),
      validFrom: formData.validFrom.trim() ? formData.validFrom : null,
      validTo: formData.validTo.trim() ? formData.validTo : null,
      usageLimit: formData.usageLimit.trim() ? Number.parseInt(formData.usageLimit, 10) : null,
      applicableProductIds: formData.applicableProductIds,
    };
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (isViewMode) {
        handleDismiss();
        return;
      }

      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        return;
      }

      try {
        setSaving(true);
        const payload = buildPayload();
        const updatedCoupon = await couponService.update(coupon.id, payload);
        onSuccess(updatedCoupon);
      } catch (err) {
        console.error('Error updating coupon:', err);
        setError(err instanceof Error ? err.message : 'Failed to update coupon. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [isViewMode, validateForm, buildPayload, coupon.id, onSuccess],
  );

  const handleDismiss = useCallback(() => {
    setError(null);
    onClose();
  }, [onClose]);

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {isViewMode ? 'View Coupon' : 'Edit Coupon'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-6 px-6 py-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Coupon Code */}
            <div>
              <label htmlFor="edit-coupon-code-input" className="block text-sm font-medium text-slate-700 mb-2">
                Coupon Code <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-coupon-code-input"
                type="text"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                disabled={saving || isViewMode}
                className={`w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500${readOnlyModifiers}`}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="edit-coupon-desc-input" className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                id="edit-coupon-desc-input"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                disabled={saving || isViewMode}
                className={`w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500${readOnlyModifiers}`}
              />
            </div>

            {/* Discount Type and Value */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-discount-type-select" className="block text-sm font-medium text-slate-700 mb-2">
                  Discount Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="edit-discount-type-select"
                  value={formData.discountType}
                  onChange={(e) => handleChange('discountType', e.target.value as DiscountType)}
                  disabled={saving || isViewMode}
                  className={`w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500${readOnlyModifiers}`}
                >
                  <option value="FIXED">Fixed Amount ($)</option>
                  <option value="PERCENTAGE">Percentage (%)</option>
                </select>
              </div>

              <div>
                <label htmlFor="edit-discount-value-input" className="block text-sm font-medium text-slate-700 mb-2">
                  Discount Value <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-discount-value-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discountValue}
                  onChange={(e) => handleChange('discountValue', e.target.value)}
                  disabled={saving || isViewMode}
                  className={`w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500${readOnlyModifiers}`}
                />
              </div>
            </div>

            {/* Valid From and To */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-valid-from-input" className="block text-sm font-medium text-slate-700 mb-2">
                  Valid From
                </label>
                <input
                  id="edit-valid-from-input"
                  type="datetime-local"
                  value={formData.validFrom}
                  onChange={(e) => handleChange('validFrom', e.target.value)}
                  disabled={saving || isViewMode}
                  className={`w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500${readOnlyModifiers}`}
                />
              </div>

              <div>
                <label htmlFor="edit-valid-to-input" className="block text-sm font-medium text-slate-700 mb-2">
                  Valid To
                </label>
                <input
                  id="edit-valid-to-input"
                  type="datetime-local"
                  value={formData.validTo}
                  onChange={(e) => handleChange('validTo', e.target.value)}
                  disabled={saving || isViewMode}
                  className={`w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500${readOnlyModifiers}`}
                />
              </div>
            </div>

            {/* Usage Limit */}
            <div>
              <label htmlFor="edit-usage-limit-input" className="block text-sm font-medium text-slate-700 mb-2">
                Usage Limit
              </label>
              <input
                id="edit-usage-limit-input"
                type="number"
                min="0"
                value={formData.usageLimit}
                onChange={(e) => handleChange('usageLimit', e.target.value)}
                disabled={saving || isViewMode}
                className={`w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500${readOnlyModifiers}`}
              />
            </div>

            {/* Product Selector */}
            <ProductSelector
              selectedProductIds={formData.applicableProductIds}
              onSelectionChange={(productIds) => {
                if (!isViewMode) {
                  setFormData((prev) => ({
                    ...prev,
                    applicableProductIds: productIds,
                  }));
                }
              }}
              disabled={saving || isViewMode}
            />

            {/* Usage Stats (View Mode) */}
            {isViewMode && (
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-900">
                  <span className="font-medium">Times Used:</span> {coupon.timesUsed}
                  {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                </p>
                <p className="text-sm text-blue-900 mt-2">
                  <span className="font-medium">Status:</span> {coupon.recordStatus}
                </p>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={handleDismiss}
              disabled={saving}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              {isViewMode ? 'Close' : 'Cancel'}
            </button>
            {!isViewMode && (
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
});

EditCouponModal.displayName = 'EditCouponModal';

export default EditCouponModal;
