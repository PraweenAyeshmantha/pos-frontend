import React, { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { transactionService } from '../../../services/transactionService';
import type { CashierSession } from '../../../types/cashierSession';
import { formatCurrency, getCurrencySymbol } from '../../../utils/currency';

interface CashTransactionModalProps {
  session: CashierSession;
  currentBalance: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  amount: string;
  description: string;
  isPositive: boolean;
}

const DEFAULT_FORM_DATA: FormData = {
  amount: '',
  description: '',
  isPositive: true,
};

const CashTransactionModal: React.FC<CashTransactionModalProps> = ({ session, currentBalance, onClose, onSuccess }) => {
  const currencySymbol = getCurrencySymbol();
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = useCallback((field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const amount = parseFloat(formData.amount);
      if (Number.isNaN(amount) || amount <= 0) {
        setError('Please enter a valid positive amount.');
        return;
      }

      if (!formData.description.trim()) {
        setError('Please enter a description for this transaction.');
        return;
      }

      setSaving(true);
      setError(null);

      try {
        await transactionService.createCashTransaction({
          sessionId: session.id,
          transactionType: formData.isPositive ? 'CASH_IN' : 'CASH_OUT',
          amount: Math.abs(amount),
          description: formData.description.trim(),
        });
        onSuccess();
        onClose();
      } catch (err) {
        console.error('Failed to create cash transaction', err);
        setError('Failed to record transaction. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [formData, session, onSuccess, onClose],
  );

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Cash Transaction</h2>
          <p className="mt-1 text-sm text-slate-600">
            Record a cash addition or removal during your shift at {session.outletName}.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="mb-4 rounded-lg bg-slate-50 p-4">
          <div className="text-sm">
            <span className="text-slate-500">Current Balance:</span>
            <div className="font-semibold text-slate-900">{formatCurrency(currentBalance)}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Transaction Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="transactionType"
                  checked={formData.isPositive}
                  onChange={() => handleInputChange('isPositive', true)}
                  disabled={saving}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-slate-300"
                />
                <span className="ml-2 text-sm text-slate-700">Add Cash (+)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="transactionType"
                  checked={!formData.isPositive}
                  onChange={() => handleInputChange('isPositive', false)}
                  disabled={saving}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-slate-300"
                />
                <span className="ml-2 text-sm text-slate-700">Remove Cash (-)</span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-slate-700">
              Amount
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-slate-500 sm:text-sm">{currencySymbol}</span>
              </div>
              <input
                type="number"
                id="amount"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                disabled={saving}
                step="0.01"
                min="0"
                className="block w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700">
              Description
            </label>
            <input
              type="text"
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={saving}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
              placeholder="e.g., Bank deposit, Petty cash, etc."
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
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {saving ? 'Recording...' : 'Record Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CashTransactionModal;
