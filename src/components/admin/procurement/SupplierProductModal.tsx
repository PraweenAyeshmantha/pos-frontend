import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supplierProductService } from '../../../services/supplierProductService';
import type { SupplierProduct, SupplierProductRequest } from '../../../types/supplierProduct';
import type { Product } from '../../../types/product';

interface SupplierProductModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  supplierId: number;
  products: Product[];
  record?: SupplierProduct | null;
  onClose: () => void;
  onSuccess: (product: SupplierProduct) => void;
}

const DEFAULT_FORM = {
  productId: '',
  supplierSku: '',
  supplierProductName: '',
  leadTimeDays: '',
  minimumOrderQuantity: '',
  purchaseCost: '',
  currencyCode: '',
  preferredSupplier: false,
  notes: '',
};

const SupplierProductModal: React.FC<SupplierProductModalProps> = ({
  open,
  mode,
  supplierId,
  products,
  record,
  onClose,
  onSuccess,
}) => {
  const [form, setForm] = useState<typeof DEFAULT_FORM>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    if (record) {
      setForm({
        productId: record.productId.toString(),
        supplierSku: record.supplierSku ?? '',
        supplierProductName: record.supplierProductName ?? '',
        leadTimeDays: record.leadTimeDays?.toString() ?? '',
        minimumOrderQuantity: record.minimumOrderQuantity?.toString() ?? '',
        purchaseCost: record.purchaseCost?.toString() ?? '',
        currencyCode: record.currencyCode ?? '',
        preferredSupplier: Boolean(record.preferredSupplier),
        notes: record.notes ?? '',
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setError(null);
  }, [open, record]);

  const title = useMemo(() => (mode === 'edit' ? 'Update Supplier Product' : 'Link Product'), [mode]);

  const handleChange = useCallback((field: keyof typeof DEFAULT_FORM, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const buildPayload = useCallback((): SupplierProductRequest => {
    const toNumber = (value: string) => {
      if (!value.trim()) {
        return undefined;
      }
      const parsed = Number(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    };
    return {
      productId: Number(form.productId),
      supplierSku: form.supplierSku.trim() || undefined,
      supplierProductName: form.supplierProductName.trim() || undefined,
      leadTimeDays: toNumber(form.leadTimeDays),
      minimumOrderQuantity: toNumber(form.minimumOrderQuantity),
      purchaseCost: toNumber(form.purchaseCost),
      currencyCode: form.currencyCode.trim() ? form.currencyCode.trim().toUpperCase() : undefined,
      preferredSupplier: form.preferredSupplier,
      notes: form.notes.trim() || undefined,
    };
  }, [form]);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving) {
      return;
    }
    if (!form.productId) {
      setError('Select a product to continue.');
      return;
    }
    if (Number.isNaN(Number(form.purchaseCost))) {
      setError('Enter a valid purchase cost');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      let result: SupplierProduct;
      if (mode === 'edit' && record) {
        result = await supplierProductService.update(supplierId, record.id, payload);
      } else {
        result = await supplierProductService.create(supplierId, payload);
      }
      onSuccess(result);
      onClose();
    } catch (err) {
      console.error('Failed to save supplier product', err);
      setError(err instanceof Error ? err.message : 'Unable to save supplier product.');
      setSaving(false);
    }
  }, [buildPayload, form.productId, form.purchaseCost, mode, onClose, onSuccess, record, saving, supplierId]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
        role="document"
        onClick={(event) => event.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4 px-6 py-6">
            {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              <span>Product *</span>
              <select
                value={form.productId}
                onChange={(event) => handleChange('productId', event.target.value)}
                required
                disabled={saving || mode === 'edit'}
                className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Supplier SKU</span>
                <input
                  type="text"
                  value={form.supplierSku}
                  onChange={(event) => handleChange('supplierSku', event.target.value)}
                  disabled={saving}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Catalog Name</span>
                <input
                  type="text"
                  value={form.supplierProductName}
                  onChange={(event) => handleChange('supplierProductName', event.target.value)}
                  disabled={saving}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Lead Time (days)</span>
                <input
                  type="number"
                  min={0}
                  value={form.leadTimeDays}
                  onChange={(event) => handleChange('leadTimeDays', event.target.value)}
                  disabled={saving}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>MOQ</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.minimumOrderQuantity}
                  onChange={(event) => handleChange('minimumOrderQuantity', event.target.value)}
                  disabled={saving}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Unit Cost</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.purchaseCost}
                  onChange={(event) => handleChange('purchaseCost', event.target.value)}
                  disabled={saving}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Currency</span>
                <input
                  type="text"
                  maxLength={3}
                  value={form.currencyCode}
                  onChange={(event) => handleChange('currencyCode', event.target.value.toUpperCase())}
                  disabled={saving}
                  className="h-11 rounded-lg border border-slate-200 px-3 uppercase text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={form.preferredSupplier}
                  onChange={(event) => handleChange('preferredSupplier', event.target.checked)}
                  disabled={saving}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Preferred supplier for this product
              </label>
            </div>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              <span>Notes</span>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(event) => handleChange('notes', event.target.value)}
                disabled={saving}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Link Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierProductModal;
