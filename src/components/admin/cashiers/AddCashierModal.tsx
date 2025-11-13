import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { cashierService } from '../../../services/cashierService';
import type { Cashier, CashierCandidate, CashierFormValues, CreateCashierRequest, UpdateCashierRequest } from '../../../types/cashier';
import type { RecordStatus } from '../../../types/configuration';

interface AddCashierModalProps {
  cashier: Cashier | null;
  mode?: 'edit' | 'view';
  onClose: () => void;
  onSuccess: (action: 'create' | 'update') => void;
}

const defaultFormValues: CashierFormValues = {
  userId: null,
  otpPhoneNumber: '',
  otpEnabled: false,
  recordStatus: 'ACTIVE' as RecordStatus,
  requirePasswordReset: false,
  defaultOutletId: null,
};

const AddCashierModal: React.FC<AddCashierModalProps> = ({ cashier, mode, onClose, onSuccess }) => {
  const [candidates, setCandidates] = useState<CashierCandidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [formValues, setFormValues] = useState<CashierFormValues>(() =>
    cashier ? mapCashierToForm(cashier) : { ...defaultFormValues },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isViewMode = mode === 'view';

  useEffect(() => {
    if (!cashier) {
      setLoadingCandidates(true);
      cashierService
        .getCandidates()
        .then(setCandidates)
        .catch((err) => {
          console.error('Failed to load cashier candidates', err);
          setError('Unable to load cashier candidates. Please try again later.');
        })
        .finally(() => setLoadingCandidates(false));
    }
  }, [cashier]);

  useEffect(() => {
    if (cashier) {
      setFormValues(mapCashierToForm(cashier));
    } else {
      setFormValues({ ...defaultFormValues });
    }
  }, [cashier]);

  const selectedCandidate = useMemo(() => {
    if (!formValues.userId) {
      return null;
    }
    return candidates.find((candidate) => candidate.userId === formValues.userId) ?? null;
  }, [candidates, formValues.userId]);

  const availableOutlets = useMemo(() => {
    if (cashier) {
      return cashier.assignedOutlets;
    }
    return selectedCandidate?.assignedOutlets ?? [];
  }, [cashier, selectedCandidate]);

  const handleFieldChange = useCallback(<K extends keyof CashierFormValues>(field: K, value: CashierFormValues[K]) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleUserSelection = useCallback((userId: number) => {
    const candidate = candidates.find((item) => item.userId === userId);
    setFormValues((prev) => ({
      ...prev,
      userId,
      defaultOutletId: candidate?.assignedOutlets[0]?.id ?? null,
    }));
  }, [candidates]);

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isViewMode) {
      onClose();
      return;
    }
    setError(null);

    if (!cashier && !formValues.userId) {
      setError('Select a user profile to link to this cashier.');
      return;
    }

    setSaving(true);
    try {
      if (cashier) {
        const payload: UpdateCashierRequest = {
          id: cashier.id,
          otpPhoneNumber: formValues.otpPhoneNumber || undefined,
          otpEnabled: formValues.otpEnabled,
          recordStatus: formValues.recordStatus,
          requirePasswordReset: formValues.requirePasswordReset,
          defaultOutletId: formValues.defaultOutletId ?? undefined,
        };
        await cashierService.update(payload);
        onSuccess('update');
      } else {
        const payload: CreateCashierRequest = {
          userId: formValues.userId as number,
          otpPhoneNumber: formValues.otpPhoneNumber || undefined,
          otpEnabled: formValues.otpEnabled,
          recordStatus: formValues.recordStatus,
          requirePasswordReset: formValues.requirePasswordReset,
          defaultOutletId: formValues.defaultOutletId ?? undefined,
        };
        await cashierService.create(payload);
        onSuccess('create');
      }
    } catch (err) {
      console.error('Failed to save cashier', err);
      setError('Unable to save cashier. Please verify the form and try again.');
    } finally {
      setSaving(false);
    }
  }, [cashier, formValues, isViewMode, onClose, onSuccess]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 px-4 py-8">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {cashier ? (isViewMode ? 'View Cashier' : 'Edit Cashier') : 'Create Cashier'}
            </h2>
            <p className="text-sm text-slate-500">
              {cashier
                ? 'Update POS-specific settings for this cashier.'
                : 'Select an existing user with the cashier category to enable POS access.'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto px-6 py-4 space-y-5">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
          )}

          {!cashier && (
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Cashier User
                {loadingCandidates ? (
                  <div className="mt-2 text-sm text-slate-500">Loading users...</div>
                ) : (
                  <select
                    value={formValues.userId ?? ''}
                    onChange={(event) => handleUserSelection(Number(event.target.value))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select a user</option>
                    {candidates.map((candidate) => (
                      <option key={candidate.userId} value={candidate.userId}>
                        {candidate.name} ({candidate.username})
                      </option>
                    ))}
                  </select>
                )}
              </label>

              {selectedCandidate && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <div className="font-medium">{selectedCandidate.name}</div>
                  <div className="text-xs text-slate-500">{selectedCandidate.email || 'No email'}</div>
                  <div className="mt-2 text-xs text-slate-500">
                    Categories:{' '}
                    {selectedCandidate.categories.map((category) => category.categoryName).join(', ') || 'None'}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Branches:{' '}
                    {selectedCandidate.assignedOutlets.length > 0
                      ? selectedCandidate.assignedOutlets.map((outlet) => outlet.name).join(', ')
                      : 'None'}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              OTP Phone Number
              <input
                type="tel"
                value={formValues.otpPhoneNumber}
                disabled={isViewMode}
                onChange={(event) => handleFieldChange('otpPhoneNumber', event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Status
              <select
                value={formValues.recordStatus}
                disabled={isViewMode}
                onChange={(event) => handleFieldChange('recordStatus', event.target.value as RecordStatus)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={formValues.otpEnabled}
                disabled={isViewMode}
                onChange={(event) => handleFieldChange('otpEnabled', event.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-60"
              />
              Require OTP for login
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={formValues.requirePasswordReset}
                disabled={isViewMode}
                onChange={(event) => handleFieldChange('requirePasswordReset', event.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-60"
              />
              Require password reset
            </label>
          </div>

          {availableOutlets.length > 0 && (
            <label className="block text-sm font-medium text-slate-700">
              Default Outlet
              <select
                value={formValues.defaultOutletId ?? ''}
                disabled={isViewMode}
                onChange={(event) =>
                  handleFieldChange('defaultOutletId', event.target.value ? Number(event.target.value) : null)
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50"
              >
                <option value="">None</option>
                {availableOutlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          {availableOutlets.length > 0 && (
            <div className="rounded-lg border border-slate-200 p-3 text-xs text-slate-500">
              <div className="font-semibold text-slate-700">Assigned Outlets</div>
              <div>{availableOutlets.map((outlet) => outlet.name).join(', ')}</div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              {isViewMode ? 'Close' : 'Cancel'}
            </button>
            {!isViewMode && (
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'Saving...' : cashier ? 'Save Changes' : 'Create Cashier'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

const mapCashierToForm = (cashier: Cashier): CashierFormValues => ({
  userId: cashier.userId ?? null,
  otpPhoneNumber: cashier.otpPhoneNumber ?? '',
  otpEnabled: cashier.otpEnabled,
  recordStatus: cashier.recordStatus,
  requirePasswordReset: cashier.requirePasswordReset,
  defaultOutletId: cashier.defaultOutlet?.id ?? null,
});

export default AddCashierModal;
