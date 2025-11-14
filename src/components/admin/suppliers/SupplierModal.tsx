import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { supplierService } from '../../../services/supplierService';
import type { Supplier, SupplierFormValues, SupplierRequest } from '../../../types/supplier';
import type { RecordStatus } from '../../../types/configuration';

interface SupplierModalProps {
  mode: 'create' | 'edit' | 'view';
  supplier?: Supplier | null;
  onClose: () => void;
  onSuccess?: (supplier: Supplier) => void;
}

const STATUS_OPTIONS: Array<{ label: string; value: RecordStatus }> = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
];

const DEFAULT_FORM: SupplierFormValues = {
  supplierCode: '',
  name: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  taxNumber: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  notes: '',
  defaultLeadTimeDays: '',
  defaultPaymentTerms: '',
  preferredCurrency: '',
  preferredIncoterms: '',
  orderingNotes: '',
  recordStatus: 'ACTIVE',
};

const SupplierModal: React.FC<SupplierModalProps> = ({ mode, supplier, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<SupplierFormValues>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReadOnly = mode === 'view';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (supplier) {
      setFormData({
        supplierCode: supplier.supplierCode ?? '',
        name: supplier.name ?? '',
        contactName: supplier.contactName ?? '',
        contactEmail: supplier.contactEmail ?? '',
        contactPhone: supplier.contactPhone ?? '',
        taxNumber: supplier.taxNumber ?? '',
        addressLine1: supplier.addressLine1 ?? '',
        addressLine2: supplier.addressLine2 ?? '',
        city: supplier.city ?? '',
        state: supplier.state ?? '',
        postalCode: supplier.postalCode ?? '',
        country: supplier.country ?? '',
        notes: supplier.notes ?? '',
        defaultLeadTimeDays: supplier.defaultLeadTimeDays?.toString() ?? '',
        defaultPaymentTerms: supplier.defaultPaymentTerms ?? '',
        preferredCurrency: supplier.preferredCurrency ?? '',
        preferredIncoterms: supplier.preferredIncoterms ?? '',
        orderingNotes: supplier.orderingNotes ?? '',
        recordStatus: supplier.recordStatus ?? 'ACTIVE',
      });
    } else {
      setFormData(DEFAULT_FORM);
    }
    setError(null);
  }, [supplier, mode]);

  const title = useMemo(() => {
    switch (mode) {
      case 'edit':
        return 'Edit Supplier';
      case 'view':
        return 'Supplier Details';
      default:
        return 'Add Supplier';
    }
  }, [mode]);

  const handleChange = useCallback((field: keyof SupplierFormValues, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const closeIfAllowed = useCallback(() => {
    if (saving) {
      return;
    }
    onClose();
  }, [onClose, saving]);

  const buildPayload = useCallback((): SupplierRequest => {
    const trimmed = (value?: string) => value?.trim() || undefined;
    const toInteger = (value: string) => {
      if (!value.trim()) {
        return undefined;
      }
      const parsed = Number(value);
      return Number.isNaN(parsed) ? undefined : Math.max(0, Math.round(parsed));
    };
    const normalizeCurrency = (value: string) => trimmed(value)?.toUpperCase();
    return {
      supplierCode: trimmed(formData.supplierCode),
      name: formData.name.trim(),
      contactName: trimmed(formData.contactName),
      contactEmail: trimmed(formData.contactEmail),
      contactPhone: trimmed(formData.contactPhone),
      taxNumber: trimmed(formData.taxNumber),
      addressLine1: trimmed(formData.addressLine1),
      addressLine2: trimmed(formData.addressLine2),
      city: trimmed(formData.city),
      state: trimmed(formData.state),
      postalCode: trimmed(formData.postalCode),
      country: trimmed(formData.country),
      notes: trimmed(formData.notes),
      defaultLeadTimeDays: toInteger(formData.defaultLeadTimeDays),
      defaultPaymentTerms: trimmed(formData.defaultPaymentTerms),
      preferredCurrency: normalizeCurrency(formData.preferredCurrency),
      preferredIncoterms: trimmed(formData.preferredIncoterms)?.toUpperCase(),
      orderingNotes: trimmed(formData.orderingNotes),
      recordStatus: formData.recordStatus,
    };
  }, [formData]);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (isReadOnly) {
      onClose();
      return;
    }
    if (!formData.name.trim()) {
      setError('Supplier name is required');
      return;
    }
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      setError('Enter a valid email address');
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      let result: Supplier;
      if (mode === 'edit' && supplier) {
        result = await supplierService.update(supplier.id, payload);
      } else {
        result = await supplierService.create(payload);
      }
      onSuccess?.(result);
      onClose();
    } catch (err) {
      console.error('Failed to save supplier', err);
      setError(err instanceof Error ? err.message : 'Unable to save supplier. Please try again.');
      setSaving(false);
    }
  }, [buildPayload, formData.contactEmail, formData.name, isReadOnly, mode, onClose, onSuccess, supplier]);

  const body = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      onClick={closeIfAllowed}
    >
      <div
        className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
        role="document"
        onClick={(event) => event.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
              {supplier?.supplierCode && mode !== 'create' && (
                <p className="text-sm text-slate-500">Code: {supplier.supplierCode}</p>
              )}
            </div>
            <button
              type="button"
              onClick={closeIfAllowed}
              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
              aria-label="Close supplier modal"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="max-h-[calc(100vh-12rem)] space-y-6 overflow-y-auto px-6 py-6">
            {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Supplier Code</span>
                <input
                  type="text"
                  value={formData.supplierCode}
                  onChange={(event) => handleChange('supplierCode', event.target.value)}
                  placeholder="Auto-generated if empty"
                  disabled={saving || isReadOnly}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Name *</span>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  required
                  disabled={saving || isReadOnly}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Contact Person</span>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(event) => handleChange('contactName', event.target.value)}
                  disabled={saving || isReadOnly}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Contact Email</span>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(event) => handleChange('contactEmail', event.target.value)}
                  disabled={saving || isReadOnly}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Phone</span>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(event) => handleChange('contactPhone', event.target.value)}
                  disabled={saving || isReadOnly}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Tax Number</span>
                <input
                  type="text"
                  value={formData.taxNumber}
                  onChange={(event) => handleChange('taxNumber', event.target.value)}
                  disabled={saving || isReadOnly}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Address Line 1</span>
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={(event) => handleChange('addressLine1', event.target.value)}
                  disabled={saving || isReadOnly}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Address Line 2</span>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(event) => handleChange('addressLine2', event.target.value)}
                  disabled={saving || isReadOnly}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>City</span>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(event) => handleChange('city', event.target.value)}
                  disabled={saving || isReadOnly}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>State / Region</span>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(event) => handleChange('state', event.target.value)}
                  disabled={saving || isReadOnly}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Postal Code</span>
                <input
                  type="text"
                  value={formData.postalCode}
                  onChange={(event) => handleChange('postalCode', event.target.value)}
                  disabled={saving || isReadOnly}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Country</span>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(event) => handleChange('country', event.target.value)}
                  disabled={saving || isReadOnly}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Status</span>
                <select
                  value={formData.recordStatus}
                  onChange={(event) => handleChange('recordStatus', event.target.value as RecordStatus)}
                  disabled={saving || isReadOnly}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60">
              <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                Procurement Preferences
              </div>
              <div className="space-y-4 px-4 py-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                    <span>Lead Time (days)</span>
                    <input
                      type="number"
                      min={0}
                      value={formData.defaultLeadTimeDays}
                      onChange={(event) => handleChange('defaultLeadTimeDays', event.target.value)}
                      disabled={saving || isReadOnly}
                      className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                    <span>Payment Terms</span>
                    <input
                      type="text"
                      value={formData.defaultPaymentTerms}
                      onChange={(event) => handleChange('defaultPaymentTerms', event.target.value)}
                      disabled={saving || isReadOnly}
                      className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                    <span>Currency</span>
                    <input
                      type="text"
                      inputMode="text"
                      maxLength={3}
                      value={formData.preferredCurrency}
                      onChange={(event) => handleChange('preferredCurrency', event.target.value.toUpperCase())}
                      disabled={saving || isReadOnly}
                      className="h-11 rounded-lg border border-slate-200 px-3 uppercase text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                    <span>Incoterms</span>
                    <input
                      type="text"
                      value={formData.preferredIncoterms}
                      onChange={(event) => handleChange('preferredIncoterms', event.target.value.toUpperCase())}
                      disabled={saving || isReadOnly}
                      className="h-11 rounded-lg border border-slate-200 px-3 uppercase text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                    <span>Ordering Notes</span>
                    <input
                      type="text"
                      value={formData.orderingNotes}
                      onChange={(event) => handleChange('orderingNotes', event.target.value)}
                      disabled={saving || isReadOnly}
                      className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    />
                  </label>
                </div>
              </div>
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              <span>Notes</span>
              <textarea
                value={formData.notes}
                onChange={(event) => handleChange('notes', event.target.value)}
                rows={4}
                disabled={saving || isReadOnly}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
              />
            </label>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={closeIfAllowed}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {isReadOnly ? 'Close' : 'Cancel'}
            </button>
            {mode !== 'view' && (
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Create Supplier'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(body, document.body);
};

export default SupplierModal;
