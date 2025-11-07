import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { outletService } from '../../../services/outletService';
import type {
  Outlet,
  OutletFormValues,
  OutletMode,
  CreateOutletRequest,
  UpdateOutletRequest,
} from '../../../types/outlet';
import type { RecordStatus } from '../../../types/configuration';

interface AddOutletModalProps {
  outlet: Outlet | null;
  onClose: () => void;
  onSuccess: (action: 'create' | 'update') => void;
  mode?: 'create' | 'edit' | 'view';
}

const PAYMENT_METHODS = ['Cash', 'Card', 'Chip & Pin', 'PayPal', 'Bank Transfer'];

const DEFAULT_FORM_VALUES: OutletFormValues = {
  name: '',
  code: '',
  mode: 'GROCERY_RETAIL',
  inventoryType: 'Custom/Manual Stock',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  country: 'United States (US)',
  postcode: '',
  phone: '',
  email: '',
  payments: [...PAYMENT_METHODS],
  invoice: 'Default Invoice',
  tables: '',
  recordStatus: 'ACTIVE',
};

const MODE_OPTIONS: Array<{ label: string; value: OutletMode }> = [
  { label: 'Grocery / Retail', value: 'GROCERY_RETAIL' },
  { label: 'Restaurant / Cafe', value: 'RESTAURANT_CAFE' },
];

const STATUS_OPTIONS: Array<{ label: string; value: RecordStatus }> = [
  { label: 'Enabled', value: 'ACTIVE' },
  { label: 'Disabled', value: 'INACTIVE' },
];

const COUNTRIES = ['United States (US)', 'Canada', 'United Kingdom', 'Australia'];
const INVENTORY_TYPES = ['Custom/Manual Stock', 'Centralized Stock'];
const INVOICE_TEMPLATES = ['Default Invoice', 'Compact Invoice'];

const ensureCode = (currentCode: string, name: string): string => {
  if (currentCode.trim().length > 0) {
    return currentCode.trim();
  }
  const normalized = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!normalized) {
    return '';
  }
  const timestampSuffix = Date.now().toString().slice(-4);
  return `${normalized.slice(0, 4)}${timestampSuffix}`;
};

const buildAddress = (values: OutletFormValues): string => {
  const parts = [
    values.addressLine1.trim(),
    values.addressLine2.trim(),
    values.city.trim(),
    values.state.trim(),
    values.country.trim(),
    values.postcode.trim(),
  ].filter(Boolean);
  return parts.join(', ');
};

const deriveInitialForm = (outlet: Outlet | null): OutletFormValues => {
  if (!outlet) {
    return { ...DEFAULT_FORM_VALUES, payments: [...PAYMENT_METHODS] };
  }

  return {
    ...DEFAULT_FORM_VALUES,
    payments: [...PAYMENT_METHODS],
    name: outlet.name,
    code: outlet.code,
    mode: outlet.mode,
    addressLine1: outlet.address,
    phone: outlet.phone,
    email: outlet.email,
    recordStatus: outlet.recordStatus,
  };
};

const AddOutletModal: React.FC<AddOutletModalProps> = ({ outlet, onClose, onSuccess, mode }) => {
  const resolvedMode: 'create' | 'edit' | 'view' = mode ?? (outlet ? 'edit' : 'create');
  const isViewMode = resolvedMode === 'view';
  const [formData, setFormData] = useState<OutletFormValues>(() => deriveInitialForm(outlet));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(deriveInitialForm(outlet));
  }, [outlet]);

  const statusValue = formData.recordStatus;
  const fieldDisabled = isViewMode || saving;
  const inputDisabledClasses = isViewMode ? ' cursor-not-allowed bg-gray-100' : '';

  const handleChange = useCallback(
    (field: keyof OutletFormValues, value: string | boolean | string[]) => {
      if (isViewMode) {
        return;
      }
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [isViewMode],
  );

  const handlePaymentToggle = useCallback((payment: string) => {
    if (isViewMode) {
      return;
    }
    setFormData((prev) => {
      const exists = prev.payments.includes(payment);
      return {
        ...prev,
        payments: exists
          ? prev.payments.filter((method) => method !== payment)
          : [...prev.payments, payment],
      };
    });
  }, [isViewMode]);

  const submitLabel = useMemo(() => {
    if (resolvedMode === 'edit') {
      return 'Save Changes';
    }
    return 'Create Outlet';
  }, [resolvedMode]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (isViewMode) {
        return;
      }
      setError(null);
      setSaving(true);

      const payload: CreateOutletRequest | UpdateOutletRequest = {
        name: formData.name.trim(),
        code: ensureCode(formData.code, formData.name),
        mode: formData.mode,
        address: buildAddress(formData),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        recordStatus: formData.recordStatus,
        ...(outlet ? { id: outlet.id } : {}),
      } as UpdateOutletRequest | CreateOutletRequest;

      try {
        if (outlet) {
          await outletService.update(payload as UpdateOutletRequest);
          onSuccess('update');
        } else {
          await outletService.create(payload as CreateOutletRequest);
          onSuccess('create');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save outlet');
      } finally {
        setSaving(false);
      }
    },
    [formData, isViewMode, outlet, onSuccess],
  );

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">{outlet ? 'Edit Outlet' : 'Add Outlet'}</h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto space-y-6 px-6 py-6">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="outlet-name" className="text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="outlet-name"
                type="text"
                required
                value={formData.name}
                onChange={(event) => handleChange('name', event.target.value)}
                className={`h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100${inputDisabledClasses}`}
                disabled={fieldDisabled}
                readOnly={isViewMode}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="outlet-code" className="text-sm font-medium text-gray-700">
                Outlet Code
              </label>
              <input
                id="outlet-code"
                type="text"
                value={formData.code}
                onChange={(event) => handleChange('code', event.target.value)}
                placeholder="AUTO"
                className={`h-11 rounded-lg border border-gray-200 px-3 text-sm uppercase tracking-wide focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100${inputDisabledClasses}`}
                disabled={fieldDisabled}
                readOnly={isViewMode}
              />
              <p className="text-xs text-gray-500">Leave blank to auto-generate a unique code.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="outlet-mode" className="text-sm font-medium text-gray-700">
                Mode <span className="text-red-500">*</span>
              </label>
              <select
                id="outlet-mode"
                required
                value={formData.mode}
                onChange={(event) => handleChange('mode', event.target.value as OutletMode)}
                className={`h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100${inputDisabledClasses}`}
                disabled={fieldDisabled}
              >
                {MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="inventory-type" className="text-sm font-medium text-gray-700">
                Inventory Type
              </label>
              <select
                id="inventory-type"
                value={formData.inventoryType}
                onChange={(event) => handleChange('inventoryType', event.target.value)}
                className={`h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100${inputDisabledClasses}`}
                disabled={fieldDisabled}
              >
                {INVENTORY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="address-line-1" className="text-sm font-medium text-gray-700">
                Address Line 1 <span className="text-red-500">*</span>
              </label>
              <input
                id="address-line-1"
                type="text"
                required
                value={formData.addressLine1}
                onChange={(event) => handleChange('addressLine1', event.target.value)}
                className={`h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100${inputDisabledClasses}`}
                disabled={fieldDisabled}
                readOnly={isViewMode}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="address-line-2" className="text-sm font-medium text-gray-700">
                Address Line 2
              </label>
              <input
                id="address-line-2"
                type="text"
                value={formData.addressLine2}
                onChange={(event) => handleChange('addressLine2', event.target.value)}
                className={`h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100${inputDisabledClasses}`}
                disabled={fieldDisabled}
                readOnly={isViewMode}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="city" className="text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(event) => handleChange('city', event.target.value)}
                  className={`h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100${inputDisabledClasses}`}
                  disabled={fieldDisabled}
                  readOnly={isViewMode}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="state" className="text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  id="state"
                  type="text"
                  value={formData.state}
                  onChange={(event) => handleChange('state', event.target.value)}
                  className={`h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100${inputDisabledClasses}`}
                  disabled={fieldDisabled}
                  readOnly={isViewMode}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="country" className="text-sm font-medium text-gray-700">
                  Country
                </label>
                <select
                  id="country"
                  value={formData.country}
                  onChange={(event) => handleChange('country', event.target.value)}
                  className={`h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100${inputDisabledClasses}`}
                  disabled={fieldDisabled}
                >
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="postcode" className="text-sm font-medium text-gray-700">
                  Postcode
                </label>
                <input
                  id="postcode"
                  type="text"
                  value={formData.postcode}
                  onChange={(event) => handleChange('postcode', event.target.value)}
                  className={`h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100${inputDisabledClasses}`}
                  disabled={fieldDisabled}
                  readOnly={isViewMode}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(event) => handleChange('phone', event.target.value)}
                  className={`h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100${inputDisabledClasses}`}
                  disabled={fieldDisabled}
                  readOnly={isViewMode}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                  className={`h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100${inputDisabledClasses}`}
                  disabled={fieldDisabled}
                  readOnly={isViewMode}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Payments</label>
              <div className="flex flex-wrap gap-2 rounded-lg border border-gray-200 p-3">
                {PAYMENT_METHODS.map((method) => {
                  const selected = formData.payments.includes(method);
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => handlePaymentToggle(method)}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition${
                        selected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }${inputDisabledClasses}`}
                      disabled={isViewMode}
                    >
                      {selected ? '✓ ' : ''}{method}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="invoice" className="text-sm font-medium text-gray-700">
                Invoice Template
              </label>
              <select
                id="invoice"
                value={formData.invoice}
                onChange={(event) => handleChange('invoice', event.target.value)}
                className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                {INVOICE_TEMPLATES.map((template) => (
                  <option key={template} value={template}>
                    {template}
                  </option>
                ))}
              </select>
            </div>

            {formData.mode === 'RESTAURANT_CAFE' && (
              <div className="flex flex-col gap-2">
                <label htmlFor="tables" className="text-sm font-medium text-gray-700">
                  Tables
                </label>
                <input
                  id="tables"
                  type="text"
                  value={formData.tables}
                  onChange={(event) => handleChange('tables', event.target.value)}
                  placeholder="e.g., 1, 2, 3, 4"
                  className={`h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100${inputDisabledClasses}`}
                  disabled={fieldDisabled}
                  readOnly={isViewMode}
                />
                <p className="text-xs text-gray-500">Visible only for Restaurant / Cafe outlets.</p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label htmlFor="status" className="text-sm font-medium text-gray-700">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                value={statusValue}
                onChange={(event) => handleChange('recordStatus', event.target.value as RecordStatus)}
                className={`h-11 rounded-lg border border-gray-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100${inputDisabledClasses}`}
                disabled={fieldDisabled}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving && !isViewMode}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
            >
              {isViewMode ? 'Close' : 'Cancel'}
            </button>
            {!isViewMode && (
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {saving ? 'Saving...' : submitLabel}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return modal;
  }

  return createPortal(modal, document.body);
};

export default memo(AddOutletModal);
