import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { cashierSessionService } from '../../../services/cashierSessionService';
import type { CashierSession } from '../../../types/cashierSession';

interface CloseCashierSessionModalProps {
  session: CashierSession;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  closingBalance: string;
  notes: string;
}

const CloseCashierSessionModal: React.FC<CloseCashierSessionModalProps> = ({ session, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<FormData>({
    closingBalance: session.currentBalance.toString(),
    notes: '',
  });
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFieldChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      const closingBalance = parseFloat(formData.closingBalance);
      if (isNaN(closingBalance) || closingBalance < 0) {
        setError('Please enter a valid closing balance.');
        return;
      }

      setSaving(true);
      setError(null);

      try {
        await cashierSessionService.closeSession({
          sessionId: session.id,
          closingBalance,
          notes: formData.notes.trim() || undefined,
        });
        onSuccess();
        onClose();
      } catch (err) {
        console.error('Failed to close session', err);
        setError(err instanceof Error ? err.message : 'Failed to close cashier session.');
      } finally {
        setSaving(false);
      }
    },
    [session.id, formData, onSuccess, onClose],
  );

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Close Cashier Session</h2>
            <p className="text-sm text-gray-600">
              End the shift for {session.cashierName} at {session.outletName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-y-auto p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Session Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Opening Balance:</span>
                  <div className="font-semibold">{formatCurrency(session.openingBalance)}</div>
                </div>
                <div>
                  <span className="text-gray-500">Current Balance:</span>
                  <div className="font-semibold">{formatCurrency(session.currentBalance)}</div>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="closingBalance" className="block text-sm font-medium text-gray-700">
                Actual Closing Balance
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="closingBalance"
                  value={formData.closingBalance}
                  onChange={(e) => handleFieldChange('closingBalance', e.target.value)}
                  step="0.01"
                  min="0"
                  className="block w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="0.00"
                  disabled={saving}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Enter the actual cash amount counted at closing
              </p>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Any notes about the closing..."
                disabled={saving}
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Closing...
                </>
              ) : (
                'Close Session'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CloseCashierSessionModal;