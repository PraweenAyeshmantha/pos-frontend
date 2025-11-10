import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cashierSessionService } from '../../../services/cashierSessionService';
import { cashierService } from '../../../services/cashierService';
import { outletService } from '../../../services/outletService';
import type { Cashier } from '../../../types/cashier';
import type { Outlet } from '../../../types/outlet';

interface StartCashierSessionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  cashierId: number;
  outletId: number;
  openingBalance: string;
}

const DEFAULT_FORM_DATA: FormData = {
  cashierId: 0,
  outletId: 0,
  openingBalance: '0.00',
};

const StartCashierSessionModal: React.FC<StartCashierSessionModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cashiersData, outletsData] = await Promise.all([
          cashierService.getAll(),
          outletService.getAll(),
        ]);
        setCashiers(cashiersData);
        setOutlets(outletsData);
      } catch (err) {
        console.error('Failed to load data', err);
        setError('Unable to load cashiers and outlets. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFieldChange = useCallback((field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (formData.cashierId === 0 || formData.outletId === 0) {
        setError('Please select both a cashier and an outlet.');
        return;
      }

      const openingBalance = parseFloat(formData.openingBalance);
      if (isNaN(openingBalance) || openingBalance < 0) {
        setError('Please enter a valid opening balance.');
        return;
      }

      setSaving(true);
      setError(null);

      try {
        await cashierSessionService.startSession({
          cashierId: formData.cashierId,
          outletId: formData.outletId,
          openingBalance,
        });
        onSuccess();
        onClose();
      } catch (err) {
        console.error('Failed to start session', err);
        setError(err instanceof Error ? err.message : 'Failed to start cashier session.');
      } finally {
        setSaving(false);
      }
    },
    [formData, onSuccess, onClose],
  );

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Start Cashier Session</h2>
            <p className="text-sm text-gray-600">Begin a new cashier shift with opening balance</p>
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
            <div>
              <label htmlFor="cashierId" className="block text-sm font-medium text-gray-700">
                Cashier
              </label>
              <select
                id="cashierId"
                value={formData.cashierId}
                onChange={(e) => handleFieldChange('cashierId', parseInt(e.target.value, 10))}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                disabled={loading}
              >
                <option value={0}>Select a cashier</option>
                {cashiers.map((cashier) => (
                  <option key={cashier.id} value={cashier.id}>
                    {cashier.name} ({cashier.username})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="outletId" className="block text-sm font-medium text-gray-700">
                Outlet
              </label>
              <select
                id="outletId"
                value={formData.outletId}
                onChange={(e) => handleFieldChange('outletId', parseInt(e.target.value, 10))}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                disabled={loading}
              >
                <option value={0}>Select an outlet</option>
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name} ({outlet.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="openingBalance" className="block text-sm font-medium text-gray-700">
                Opening Balance
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  id="openingBalance"
                  value={formData.openingBalance}
                  onChange={(e) => handleFieldChange('openingBalance', e.target.value)}
                  step="0.01"
                  min="0"
                  className="block w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="0.00"
                  disabled={loading}
                />
              </div>
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
              disabled={saving || loading}
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
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
                  Starting...
                </>
              ) : (
                'Start Session'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default StartCashierSessionModal;