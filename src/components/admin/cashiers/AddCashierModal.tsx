import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { cashierService } from '../../../services/cashierService';
import { outletService } from '../../../services/outletService';
import type { Outlet } from '../../../types/outlet';
import type {
  Cashier,
  CashierFormValues,
  CashierRole,
  CreateCashierRequest,
  UpdateCashierRequest,
} from '../../../types/cashier';

interface AddCashierModalProps {
  cashier: Cashier | null;
  onClose: () => void;
  onSuccess: (action: 'create' | 'update') => void;
}

const ROLE_OPTIONS: Array<{ label: string; value: CashierRole }> = [
  { label: 'POS Cashier', value: 'POS_CASHIER' },
  { label: 'Administrator', value: 'ADMINISTRATOR' },
];

const DEFAULT_FORM_VALUES: CashierFormValues = {
  username: '',
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  role: 'POS_CASHIER',
  password: '',
  recordStatus: 'ACTIVE',
  requirePasswordReset: true,
  sendCredentials: true,
  assignedOutletIds: [],
};

const extractNameParts = (name?: string): { firstName: string; lastName: string } => {
  if (!name) {
    return { firstName: '', lastName: '' };
  }
  const segments = name.trim().split(' ');
  if (segments.length === 0) {
    return { firstName: '', lastName: '' };
  }
  if (segments.length === 1) {
    return { firstName: segments[0], lastName: '' };
  }
  return {
    firstName: segments[0],
    lastName: segments.slice(1).join(' '),
  };
};

const buildDisplayName = (firstName: string, lastName: string, fallback: string): string => {
  const trimmedFirst = firstName.trim();
  const trimmedLast = lastName.trim();
  const combined = `${trimmedFirst} ${trimmedLast}`.trim();
  if (combined.length > 0) {
    return combined;
  }
  if (trimmedFirst.length > 0) {
    return trimmedFirst;
  }
  if (trimmedLast.length > 0) {
    return trimmedLast;
  }
  return fallback.trim();
};

const generateSecurePassword = (): string => {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
  const length = 14;
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const values = new Uint32Array(length);
    window.crypto.getRandomValues(values);
    return Array.from({ length }, (_, index) => charset[values[index] % charset.length]).join('');
  }
  return Array.from({ length }, () => charset[Math.floor(Math.random() * charset.length)]).join('');
};

const deriveInitialFormValues = (cashier: Cashier | null): CashierFormValues => {
  if (!cashier) {
    return { ...DEFAULT_FORM_VALUES };
  }

  const nameParts = extractNameParts(cashier.name);

  return {
    username: cashier.username,
    email: cashier.email,
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    phone: cashier.phone ?? '',
    role: cashier.role,
    password: '',
    recordStatus: cashier.recordStatus,
    requirePasswordReset: cashier.requirePasswordReset,
    sendCredentials: false,
    assignedOutletIds: cashier.assignedOutlets.map((outlet) => outlet.id),
  };
};

const AddCashierModal: React.FC<AddCashierModalProps> = ({ cashier, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CashierFormValues>(() => deriveInitialFormValues(cashier));
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loadingOutlets, setLoadingOutlets] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(deriveInitialFormValues(cashier));
    setError(null);
  }, [cashier]);

  useEffect(() => {
    const fetchOutlets = async () => {
      setLoadingOutlets(true);
      try {
        const data = await outletService.getAll();
        setOutlets(data);
      } catch (err) {
        console.error('Failed to load outlets for cashier modal', err);
        setError('Unable to load outlets. Please try again.');
      } finally {
        setLoadingOutlets(false);
      }
    };

    fetchOutlets();
  }, []);

  const handleFieldChange = useCallback(
    (field: keyof CashierFormValues, value: string | boolean | number[]) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const handleOutletToggle = useCallback((outletId: number) => {
    setFormData((prev) => {
      const alreadySelected = prev.assignedOutletIds.includes(outletId);
      return {
        ...prev,
        assignedOutletIds: alreadySelected
          ? prev.assignedOutletIds.filter((id) => id !== outletId)
          : [...prev.assignedOutletIds, outletId],
      };
    });
  }, []);

  const handleGeneratePassword = useCallback(() => {
    const password = generateSecurePassword();
    setFormData((prev) => ({
      ...prev,
      password,
      requirePasswordReset: true,
    }));
  }, []);

  const selectedOutlets = useMemo(() => {
    return outlets.filter((outlet) => formData.assignedOutletIds.includes(outlet.id));
  }, [formData.assignedOutletIds, outlets]);

  const submitLabel = cashier ? 'Save Changes' : 'Create Cashier';

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);

      if (!formData.username.trim()) {
        setError('Username is required.');
        return;
      }

      if (!formData.email.trim()) {
        setError('Email is required.');
        return;
      }

      if (!cashier && !formData.password.trim()) {
        setError('Password is required when creating a cashier.');
        return;
      }

      setSaving(true);

      const name = buildDisplayName(formData.firstName, formData.lastName, formData.username);

      const basePayload = {
        name,
        username: formData.username.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        role: formData.role,
        recordStatus: formData.recordStatus,
        requirePasswordReset: formData.requirePasswordReset,
        assignedOutletIds: formData.assignedOutletIds,
        sendCredentials: formData.sendCredentials,
      };

      try {
        if (cashier) {
          const updatePayload: UpdateCashierRequest = {
            id: cashier.id,
            ...basePayload,
          };

          const trimmedPassword = formData.password.trim();
          if (trimmedPassword) {
            updatePayload.password = trimmedPassword;
          }

          await cashierService.update(updatePayload);
          onSuccess('update');
        } else {
          const createPayload: CreateCashierRequest = {
            ...basePayload,
            password: formData.password.trim(),
          };
          await cashierService.create(createPayload);
          onSuccess('create');
          setFormData({ ...DEFAULT_FORM_VALUES, assignedOutletIds: [], password: '' });
        }
      } catch (err) {
        console.error('Failed to save cashier', err);
        setError(err instanceof Error ? err.message : 'Failed to save cashier.');
      } finally {
        setSaving(false);
      }
    },
    [cashier, formData, onSuccess],
  );

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{cashier ? 'Edit Cashier' : 'Add Cashier'}</h2>
            <p className="mt-1 text-sm text-gray-600">Manage credentials, status, and outlet assignments.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10l-4.95-4.95A1 1 0 115.05 3.636L10 8.586z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        <form
          id="cashier-modal-form"
          onSubmit={handleSubmit}
          className="overflow-y-auto"
          style={{ maxHeight: 'calc(92vh - 140px)' }}
        >
          <div className="space-y-6 px-6 py-6">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="cashier-username" className="text-sm font-medium text-gray-700">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  id="cashier-username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={(event) => handleFieldChange('username', event.target.value)}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="cashier-email" className="text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="cashier-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(event) => handleFieldChange('email', event.target.value)}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="cashier-first-name" className="text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  id="cashier-first-name"
                  type="text"
                  value={formData.firstName}
                  onChange={(event) => handleFieldChange('firstName', event.target.value)}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="cashier-last-name" className="text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  id="cashier-last-name"
                  type="text"
                  value={formData.lastName}
                  onChange={(event) => handleFieldChange('lastName', event.target.value)}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="cashier-phone" className="text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  id="cashier-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(event) => handleFieldChange('phone', event.target.value)}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="cashier-role" className="text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  id="cashier-role"
                  value={formData.role}
                  onChange={(event) => handleFieldChange('role', event.target.value as CashierRole)}
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="cashier-password" className="text-sm font-medium text-gray-700">
                Password {cashier ? <span className="text-gray-500 text-xs">(leave blank to keep existing)</span> : <span className="text-red-500">*</span>}
              </label>
              <div className="flex gap-3">
                <input
                  id="cashier-password"
                  type="text"
                  value={formData.password}
                  onChange={(event) => handleFieldChange('password', event.target.value)}
                  placeholder={cashier ? '••••••••••' : 'Generate or enter a secure password'}
                  className="h-11 flex-1 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Generate
                </button>
              </div>
              <p className="text-xs text-gray-500">Generated passwords force a reset on first login.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.recordStatus === 'ACTIVE'}
                  onChange={(event) => handleFieldChange('recordStatus', event.target.checked ? 'ACTIVE' : 'INACTIVE')}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Active Cashier
              </label>
              <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.requirePasswordReset}
                  onChange={(event) => handleFieldChange('requirePasswordReset', event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Require password reset on next login
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-4 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.sendCredentials}
                onChange={(event) => handleFieldChange('sendCredentials', event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Email credentials to cashier
            </label>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Assigned Outlets
                </label>
                {selectedOutlets.length > 0 && (
                  <span className="text-xs text-gray-500">{selectedOutlets.length} selected</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedOutlets.map((outlet) => (
                  <span
                    key={outlet.id}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                  >
                    {outlet.name}
                    <button
                      type="button"
                      onClick={() => handleOutletToggle(outlet.id)}
                      className="text-blue-500 hover:text-blue-700"
                      aria-label={`Remove ${outlet.name}`}
                    >
                      &times;
                    </button>
                  </span>
                ))}
                {selectedOutlets.length === 0 && (
                  <span className="text-xs text-gray-500">No outlets selected yet.</span>
                )}
              </div>
              <div className="rounded-lg border border-gray-200">
                <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                  {loadingOutlets && (
                    <div className="px-4 py-3 text-sm text-gray-500">Loading outlets...</div>
                  )}
                  {!loadingOutlets && outlets.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500">No outlets available.</div>
                  )}
                  {!loadingOutlets &&
                    outlets.map((outlet) => {
                      const checked = formData.assignedOutletIds.includes(outlet.id);
                      return (
                        <label
                          key={outlet.id}
                          className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleOutletToggle(outlet.id)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                              <div className="font-medium text-gray-800">{outlet.name}</div>
                              <div className="text-xs text-gray-500">{outlet.code}</div>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {outlet.mode ? outlet.mode.replace(/_/g, ' ') : ''}
                          </span>
                        </label>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="cashier-modal-form"
            disabled={saving}
            className={`rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${saving ? 'opacity-70' : ''}`}
          >
            {saving ? 'Saving...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default AddCashierModal;
