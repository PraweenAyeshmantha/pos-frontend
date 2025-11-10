import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { cashierSessionService } from '../../../services/cashierSessionService';
import type { CashierSession } from '../../../types/cashierSession';

interface CloseCashierSessionModalProps {
  session: CashierSession;
  currentBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  closingBalance: string;
  notes: string;
}

const DEFAULT_FORM_DATA: FormData = {
  closingBalance: '0.00',
  notes: '',
};

const CloseCashierSessionModal: React.FC<CloseCashierSessionModalProps> = ({ session, currentBalance, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const closingBalance = parseFloat(formData.closingBalance);
      if (Number.isNaN(closingBalance) || closingBalance < 0) {
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
        setError('Failed to close session. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [formData, session, onSuccess, onClose],
  );

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900">End Your Shift</h2>
          <p className="mt-1 text-sm text-slate-600">
            Enter your closing cash balance to end your shift at {session.outletName}.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="mb-4 rounded-lg bg-slate-50 p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Opening Balance:</span>
              <div className="font-semibold text-slate-900">{formatCurrency(session.openingBalance)}</div>
            </div>
            <div>
              <span className="text-slate-500">Current Balance:</span>
              <div className="font-semibold text-slate-900">{formatCurrency(currentBalance)}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="closingBalance" className="block text-sm font-medium text-slate-700">
              Closing Balance
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-slate-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="closingBalance"
                value={formData.closingBalance}
                onChange={(e) => handleInputChange('closingBalance', e.target.value)}
                disabled={saving}
                step="0.01"
                min="0"
                className="block w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              disabled={saving}
              rows={3}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
              placeholder="Any notes about this shift..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {saving ? 'Ending Shift...' : 'End Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CloseCashierSessionModal;