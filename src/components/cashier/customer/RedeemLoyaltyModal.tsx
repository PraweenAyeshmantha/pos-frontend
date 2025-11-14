import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { LoyaltySummary } from '../../../types/loyalty';

interface RedeemLoyaltyModalProps {
  open: boolean;
  summary: LoyaltySummary | null;
  onClose: () => void;
  onConfirm: (points: number) => void;
  pendingPoints?: number | null;
}

const RedeemLoyaltyModal: React.FC<RedeemLoyaltyModalProps> = ({
  open,
  summary,
  onClose,
  onConfirm,
  pendingPoints,
}) => {
  const [points, setPoints] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setPoints(pendingPoints ? String(pendingPoints) : '');
    }
  }, [open, pendingPoints]);

  const availablePoints = summary?.availablePoints ?? 0;
  const minPoints = summary?.minPointsToRedeem ?? 0;
  const maxPoints = summary?.maxPointsToRedeem ?? null;
  const currencyPerPoint = summary?.currencyPerPoint ?? 0;

  const redemptionValue = useMemo(() => {
    const parsed = Number.parseInt(points, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return 0;
    }
    return Math.round(parsed * currencyPerPoint * 100) / 100;
  }, [points, currencyPerPoint]);

  const validate = useCallback((value: number) => {
    if (value <= 0) {
      return 'Enter how many points to redeem.';
    }
    if (value > availablePoints) {
      return 'Cannot redeem more points than the customer currently has.';
    }
    if (minPoints && value < minPoints) {
      return `Redeem at least ${minPoints} points.`;
    }
    if (maxPoints && value > maxPoints) {
      return `Redeem up to ${maxPoints} points at a time.`;
    }
    return null;
  }, [availablePoints, minPoints, maxPoints]);

  const handleConfirm = useCallback(() => {
    const parsed = Number.parseInt(points, 10);
    if (Number.isNaN(parsed)) {
      setError('Enter how many points to redeem.');
      return;
    }
    const validationError = validate(parsed);
    if (validationError) {
      setError(validationError);
      return;
    }
    onConfirm(parsed);
  }, [points, validate, onConfirm]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Redeem Loyalty Points</h2>
            <p className="text-sm text-slate-500">Convert points into a discount on this sale.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Available</span>
              <span className="font-semibold text-slate-900">{availablePoints} pts</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>Min redeem</span>
              <span>{minPoints || 0} pts</span>
            </div>
            {maxPoints && (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Max redeem</span>
                <span>{maxPoints} pts</span>
              </div>
            )}
            <div className="mt-2 rounded-xl bg-white px-3 py-2 text-xs text-slate-500">
              1 pt ≈ {currencyPerPoint > 0 ? `$${currencyPerPoint.toFixed(2)}` : '$0.00'}
            </div>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Points to Redeem
            <input
              type="number"
              min={minPoints || 1}
              max={availablePoints}
              value={points}
              onChange={(event) => {
                setError(null);
                setPoints(event.target.value);
              }}
              placeholder="e.g., 250"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Redeems for approximately <span className="font-semibold">{`$${redemptionValue.toFixed(2)}`}</span>
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 sm:flex-none sm:px-6"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!summary}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60 sm:flex-none sm:px-6"
          >
            Apply to Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default RedeemLoyaltyModal;
