import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cashierSessionService } from '../../../services/cashierSessionService';
import { outletService } from '../../../services/outletService';
import { useAuth } from '../../../hooks/useAuth';
import type { Outlet } from '../../../types/outlet';

interface StartCashierSessionModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  outletId: number;
  openingBalance: string;
}

const DEFAULT_FORM_DATA: FormData = {
  outletId: 0,
  openingBalance: '0.00',
};

const StartCashierSessionModal: React.FC<StartCashierSessionModalProps> = ({ onClose, onSuccess }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const outletsData = await outletService.getAll();
        setOutlets(outletsData);
      } catch (err) {
        console.error('Failed to load outlets', err);
        setError('Unable to load outlets. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  const handleInputChange = useCallback((field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!user?.cashierId) {
        setError('Unable to identify current cashier. Please try logging in again.');
        return;
      }

      if (formData.outletId === 0) {
        setError('Please select an outlet.');
        return;
      }

      const openingBalance = parseFloat(formData.openingBalance);
      if (Number.isNaN(openingBalance) || openingBalance < 0) {
        setError('Please enter a valid opening balance.');
        return;
      }

      setSaving(true);
      setError(null);

      try {
        await cashierSessionService.startSession({
          cashierId: user.cashierId,
          outletId: formData.outletId,
          openingBalance,
        });

        onSuccess();
        onClose();
      } catch (err) {
        console.error('Failed to start session', err);
        setError('Failed to start session. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [formData, user, onSuccess, onClose],
  );

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Start Your Shift</h2>
          <p className="mt-1 text-sm text-slate-600">
            Enter your opening cash balance to begin your shift.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="outlet" className="block text-sm font-medium text-slate-700">
              Outlet
            </label>
            <select
              id="outlet"
              value={formData.outletId}
              onChange={(e) => handleInputChange('outletId', parseInt(e.target.value, 10))}
              disabled={loading || saving}
              className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
            >
              <option value={0}>Select an outlet</option>
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="openingBalance" className="block text-sm font-medium text-slate-700">
              Opening Balance
            </label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-slate-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="openingBalance"
                value={formData.openingBalance}
                onChange={(e) => handleInputChange('openingBalance', e.target.value)}
                disabled={saving}
                step="0.01"
                min="0"
                className="block w-full rounded-md border border-slate-300 pl-7 pr-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                placeholder="0.00"
              />
            </div>
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
              disabled={saving || loading}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {saving ? 'Starting...' : 'Start Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default StartCashierSessionModal;