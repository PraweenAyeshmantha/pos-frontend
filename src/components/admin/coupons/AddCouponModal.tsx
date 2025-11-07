import React, { memo, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { couponService } from '../../../services/couponService';
import type { Coupon, CreateCouponPayload, DiscountType } from '../../../types/coupon';
import ProductSelector from './ProductSelector';

interface AddCouponModalProps {
  onClose: () => void;
  onSuccess: (coupon: Coupon) => void;
}

const DEFAULT_FORM_VALUES = {
  code: '',
  description: '',
  discountType: 'FIXED' as DiscountType,
  discountValue: '',
  validFrom: '',
  validTo: '',
  usageLimit: '',
  applicableProductIds: [] as number[],
};

type FormData = typeof DEFAULT_FORM_VALUES;

const AddCouponModal: React.FC<AddCouponModalProps> = memo(({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState<FormData>(() => ({ ...DEFAULT_FORM_VALUES }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const input = document.getElementById('coupon-code-input');
    if (input instanceof HTMLInputElement) {
      input.focus();
    }
  }, []);

  const handleChange = useCallback(
    (field: keyof FormData, value: string) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      setError(null);
    },
    [],
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

      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        return;
      }

      try {
        setSaving(true);
        const payload = buildPayload();
        const newCoupon = await couponService.create(payload);
        onSuccess(newCoupon);
      } catch (err) {
        console.error('Error creating coupon:', err);
        setError(err instanceof Error ? err.message : 'Failed to create coupon. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [validateForm, buildPayload, onSuccess],
  );

  const handleDismiss = useCallback(() => {
    setFormData({ ...DEFAULT_FORM_VALUES });
    setError(null);
    onClose();
  }, [onClose]);

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Add New Coupon</h2>
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
              <label htmlFor="coupon-code-input" className="block text-sm font-medium text-slate-700 mb-2">
                Coupon Code <span className="text-red-500">*</span>
              </label>
              <input
                id="coupon-code-input"
                type="text"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                placeholder="e.g., WELCOME10, SAVE50"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={saving}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="coupon-desc-input" className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                id="coupon-desc-input"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="e.g., 10% off for new customers"
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={saving}
              />
            </div>

            {/* Discount Type and Value */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="discount-type-select" className="block text-sm font-medium text-slate-700 mb-2">
                  Discount Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="discount-type-select"
                  value={formData.discountType}
                  onChange={(e) => handleChange('discountType', e.target.value as DiscountType)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={saving}
                >
                  <option value="FIXED">Fixed Amount ($)</option>
                  <option value="PERCENTAGE">Percentage (%)</option>
                </select>
              </div>

              <div>
                <label htmlFor="discount-value-input" className="block text-sm font-medium text-slate-700 mb-2">
                  Discount Value <span className="text-red-500">*</span>
                </label>
                <input
                  id="discount-value-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discountValue}
                  onChange={(e) => handleChange('discountValue', e.target.value)}
                  placeholder={formData.discountType === 'PERCENTAGE' ? 'e.g., 10' : 'e.g., 50.00'}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={saving}
                />
              </div>
            </div>

            {/* Valid From and To */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="valid-from-input" className="block text-sm font-medium text-slate-700 mb-2">
                  Valid From
                </label>
                <input
                  id="valid-from-input"
                  type="datetime-local"
                  value={formData.validFrom}
                  onChange={(e) => handleChange('validFrom', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={saving}
                />
              </div>

              <div>
                <label htmlFor="valid-to-input" className="block text-sm font-medium text-slate-700 mb-2">
                  Valid To
                </label>
                <input
                  id="valid-to-input"
                  type="datetime-local"
                  value={formData.validTo}
                  onChange={(e) => handleChange('validTo', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={saving}
                />
              </div>
            </div>

            {/* Usage Limit */}
            <div>
              <label htmlFor="usage-limit-input" className="block text-sm font-medium text-slate-700 mb-2">
                Usage Limit
              </label>
              <input
                id="usage-limit-input"
                type="number"
                min="0"
                value={formData.usageLimit}
                onChange={(e) => handleChange('usageLimit', e.target.value)}
                placeholder="Leave empty for unlimited usage"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={saving}
              />
            </div>

            {/* Product Selector */}
            <ProductSelector
              selectedProductIds={formData.applicableProductIds}
              onSelectionChange={(productIds) => {
                setFormData((prev) => ({
                  ...prev,
                  applicableProductIds: productIds,
                }));
              }}
              disabled={saving}
            />
          </div>

          {/* Form Actions */}
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={handleDismiss}
              disabled={saving}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? 'Creating...' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
});

AddCouponModal.displayName = 'AddCouponModal';

export default AddCouponModal;
