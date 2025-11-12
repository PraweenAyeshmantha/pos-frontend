import React, { memo, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface WeightInputModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (weight: number) => void;
  productName: string;
  unit?: string;
}

const WeightInputModal: React.FC<WeightInputModalProps> = memo(({
  open,
  onClose,
  onSuccess,
  productName,
  unit = 'kg'
}) => {
  const [weight, setWeight] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setWeight('');
      setError(null);
      const input = document.getElementById('weight-input');
      if (input instanceof HTMLInputElement) {
        setTimeout(() => {
          input.focus();
        }, 0);
      }
    }
  }, [open]);

  const validateWeight = useCallback((weightValue: string): string | null => {
    if (!weightValue.trim()) {
      return 'Weight is required.';
    }

    const weightNum = Number.parseFloat(weightValue);
    if (Number.isNaN(weightNum)) {
      return 'Weight must be a valid number.';
    }

    if (weightNum <= 0) {
      return 'Weight must be greater than 0.';
    }

    if (weightNum > 999.99) {
      return 'Weight cannot exceed 999.99.';
    }

    return null;
  }, []);

  const handleInputChange = useCallback((value: string) => {
    setWeight(value);
    if (error) setError(null);
  }, [error]);

  const handleSubmit = useCallback(() => {
    const validationError = validateWeight(weight);
    if (validationError) {
      setError(validationError);
      return;
    }

    const weightNum = Number.parseFloat(weight);
    onSuccess(weightNum);
    onClose();
  }, [weight, validateWeight, onSuccess, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [handleSubmit, onClose]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Enter Weight</h2>
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
          {/* Product Info */}
          <div className="text-center">
            <p className="text-sm text-slate-600">
              Enter the weight for <span className="font-medium text-slate-900">{productName}</span>
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

          {/* Weight Input */}
          <div>
            <label htmlFor="weight-input" className="block text-sm font-medium text-slate-700">
              Weight ({unit}) *
            </label>
            <div className="relative mt-1">
              <input
                id="weight-input"
                type="number"
                step="0.01"
                min="0"
                max="999.99"
                value={weight}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="0.00"
                className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-sm text-slate-500">{unit}</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Enter weight in {unit} (e.g., 1.5 for 1.5 {unit})
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
});

WeightInputModal.displayName = 'WeightInputModal';

export default WeightInputModal;