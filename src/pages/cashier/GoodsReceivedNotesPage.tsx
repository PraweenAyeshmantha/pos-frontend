import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CashierLayout from '../../components/layout/CashierLayout';
import Alert, { type AlertType } from '../../components/common/Alert';
import ToastContainer from '../../components/common/ToastContainer';
import SelectOutletReminder from '../../components/cashier/SelectOutletReminder';
import { supplierService } from '../../services/supplierService';
import { productService } from '../../services/productService';
import { goodsReceivedNoteService } from '../../services/goodsReceivedNoteService';
import { useOutlet } from '../../contexts/OutletContext';
import type { Supplier } from '../../types/supplier';
import type { Product } from '../../types/product';
import type {
  GoodsReceivedNote,
  GoodsReceivedNoteFormItem,
  GoodsReceivedNoteFormState,
  GoodsReceivedNoteRequest,
} from '../../types/goodsReceivedNote';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const formatCurrency = (value?: number): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return currencyFormatter.format(0);
  }
  return currencyFormatter.format(value);
};

const formatDate = (value?: string): string => {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const generateLineItemId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

const createLineItem = (): GoodsReceivedNoteFormItem => ({
  id: generateLineItemId(),
  productId: '',
  quantity: '1',
  unitCost: '',
  unitPrice: '',
  batchNumber: '',
});

const DEFAULT_FORM: GoodsReceivedNoteFormState = {
  supplierId: '',
  referenceNumber: '',
  remarks: '',
  status: 'POSTED',
  items: [createLineItem()],
};

const GoodsReceivedNotesPage: React.FC = () => {
  const { currentOutlet } = useOutlet();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [grns, setGrns] = useState<GoodsReceivedNote[]>([]);
  const [formState, setFormState] = useState<GoodsReceivedNoteFormState>(DEFAULT_FORM);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingGrns, setLoadingGrns] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: AlertType; title: string; message: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = useCallback((type: AlertType, title: string, message: string) => {
    setAlert({ type, title, message });
  }, []);

  const loadSuppliers = useCallback(async () => {
    try {
      setLoadingSuppliers(true);
      const data = await supplierService.getLookup();
      setSuppliers(data);
    } catch (err) {
      console.error('Failed to load suppliers', err);
      showToast('error', 'Suppliers', 'Unable to load supplier list. Try again later.');
    } finally {
      setLoadingSuppliers(false);
    }
  }, [showToast]);

  const loadProducts = useCallback(async () => {
    try {
      setLoadingProducts(true);
      const data = await productService.getAll();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products', err);
      showToast('error', 'Products', 'Unable to load products for receiving.');
    } finally {
      setLoadingProducts(false);
    }
  }, [showToast]);

  const loadGrns = useCallback(async () => {
    if (!currentOutlet?.id) {
      setGrns([]);
      return;
    }
    try {
      setLoadingGrns(true);
      const data = await goodsReceivedNoteService.list({ outletId: currentOutlet.id, limit: 20 });
      setGrns(data);
    } catch (err) {
      console.error('Failed to load goods received notes', err);
      showToast('error', 'Goods Received', 'Unable to fetch recent receiving notes.');
    } finally {
      setLoadingGrns(false);
    }
  }, [currentOutlet?.id, showToast]);

  useEffect(() => {
    void loadSuppliers();
    void loadProducts();
  }, [loadSuppliers, loadProducts]);

  useEffect(() => {
    void loadGrns();
  }, [loadGrns]);

  const handleItemChange = useCallback((itemId: string, field: keyof GoodsReceivedNoteFormItem, value: string) => {
    setFormState((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
    }));
    setFormError(null);
  }, []);

  const handleAddItem = useCallback(() => {
    setFormState((prev) => ({ ...prev, items: [...prev.items, createLineItem()] }));
  }, []);

  const handleRemoveItem = useCallback((itemId: string) => {
    setFormState((prev) => ({
      ...prev,
      items: prev.items.length === 1 ? prev.items : prev.items.filter((item) => item.id !== itemId),
    }));
  }, []);

  const totals = useMemo(() => {
    return formState.items.reduce(
      (accumulator, item) => {
        const quantity = Number(item.quantity) || 0;
        const unitCost = Number(item.unitCost) || 0;
        return {
          quantity: accumulator.quantity + quantity,
          amount: accumulator.amount + quantity * unitCost,
        };
      },
      { quantity: 0, amount: 0 },
    );
  }, [formState.items]);

  const validateForm = () => {
    if (!currentOutlet?.id) {
      return 'Select an outlet before recording stock receipts.';
    }
    if (!formState.items.length) {
      return 'Add at least one product line.';
    }
    for (const item of formState.items) {
      if (!item.productId) {
        return 'Select a product for each line item.';
      }
      const quantity = Number(item.quantity);
      if (!quantity || quantity <= 0) {
        return 'Enter a valid quantity for each line item.';
      }
      const unitCost = Number(item.unitCost);
      if (Number.isNaN(unitCost) || unitCost < 0) {
        return 'Enter a valid cost for each line item.';
      }
    }
    return null;
  };

  const resetForm = () => {
    setFormState({ ...DEFAULT_FORM, items: [createLineItem()] });
  };

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    if (!currentOutlet?.id) {
      return;
    }
    setSaving(true);
    try {
      const payload: GoodsReceivedNoteRequest = {
        outletId: currentOutlet.id,
        supplierId: formState.supplierId ? Number(formState.supplierId) : undefined,
        referenceNumber: formState.referenceNumber.trim() || undefined,
        remarks: formState.remarks.trim() || undefined,
        status: formState.status,
        receivedDate: new Date().toISOString(),
        items: formState.items.map((item) => ({
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
          unitPrice: item.unitPrice ? Number(item.unitPrice) : undefined,
          batchNumber: item.batchNumber.trim() || undefined,
        })),
      };

      const created = await goodsReceivedNoteService.create(payload);
      showToast('success', 'Goods Received', `GRN ${created.grnNumber} recorded.`);
      resetForm();
      await loadGrns();
    } catch (err) {
      console.error('Failed to record goods received note', err);
      setFormError(err instanceof Error ? err.message : 'Unable to save goods received note.');
    } finally {
      setSaving(false);
    }
  }, [currentOutlet?.id, formState.items, formState.referenceNumber, formState.remarks, formState.status, formState.supplierId, loadGrns, showToast]);

  if (!currentOutlet?.id) {
    return (
      <CashierLayout>
        <SelectOutletReminder message="Choose an outlet from the top bar to receive stock into inventory." />
      </CashierLayout>
    );
  }

  return (
    <CashierLayout>
      <div className="px-4 pb-12 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-2">
            <h1 className="mt-2.5 text-3xl font-semibold tracking-tight text-slate-900">Goods Received Notes</h1>
            <p className="text-sm text-slate-500">
              Capture supplier deliveries directly at the register so stock stays synced with each outlet.
            </p>
          </header>

          {alert && (
            <ToastContainer>
              <Alert type={alert.type} title={alert.title} message={alert.message} onClose={() => setAlert(null)} />
            </ToastContainer>
          )}

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Record Receipt</h2>
                  <p className="text-sm text-slate-500">Outlet: {currentOutlet.name}</p>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Reset
                </button>
              </div>

              {formError && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
              )}

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Supplier</span>
                <select
                  value={formState.supplierId}
                  onChange={(event) => setFormState((prev) => ({ ...prev, supplierId: event.target.value }))}
                  disabled={loadingSuppliers || saving}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Walk-in / Misc Supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  <span>Reference #</span>
                  <input
                    type="text"
                    value={formState.referenceNumber}
                    onChange={(event) => setFormState((prev) => ({ ...prev, referenceNumber: event.target.value }))}
                    placeholder="Supplier invoice, PO, etc."
                    disabled={saving}
                    className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                  <span>Status</span>
                  <select
                    value={formState.status}
                    onChange={(event) => setFormState((prev) => ({ ...prev, status: event.target.value as GoodsReceivedNoteFormState['status'] }))}
                    disabled={saving}
                    className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="POSTED">Posted</option>
                    <option value="DRAFT">Draft</option>
                  </select>
                </label>
              </div>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Notes</span>
                <textarea
                  rows={3}
                  value={formState.remarks}
                  onChange={(event) => setFormState((prev) => ({ ...prev, remarks: event.target.value }))}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <div className="space-y-4">
                {formState.items.map((item, index) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-700">Line {index + 1}</p>
                      {formState.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-xs font-medium text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="flex flex-col gap-2 text-xs font-semibold text-slate-600">
                        <span>Product</span>
                        <select
                          value={item.productId}
                          onChange={(event) => handleItemChange(item.id, 'productId', event.target.value)}
                          disabled={loadingProducts || saving}
                          className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        >
                          <option value="">Select product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-semibold text-slate-600">
                        <span>Batch # (optional)</span>
                        <input
                          type="text"
                          value={item.batchNumber}
                          onChange={(event) => handleItemChange(item.id, 'batchNumber', event.target.value)}
                          disabled={saving}
                          className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </label>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <label className="flex flex-col gap-2 text-xs font-semibold text-slate-600">
                        <span>Quantity</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(event) => handleItemChange(item.id, 'quantity', event.target.value)}
                          disabled={saving}
                          className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-semibold text-slate-600">
                        <span>Unit Cost</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitCost}
                          onChange={(event) => handleItemChange(item.id, 'unitCost', event.target.value)}
                          disabled={saving}
                          className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-xs font-semibold text-slate-600">
                        <span>Selling Price</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(event) => handleItemChange(item.id, 'unitPrice', event.target.value)}
                          disabled={saving}
                          className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="w-full rounded-2xl border border-dashed border-slate-300 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                + Add another product
              </button>

              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <div className="flex justify-between">
                  <span>Total Quantity</span>
                  <span className="font-semibold">{totals.quantity.toFixed(2)}</span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span>Total Cost</span>
                  <span className="font-semibold">{formatCurrency(totals.amount)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Record Goods Receipt'}
              </button>
            </form>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Recent Receipts</h2>
                  <p className="text-sm text-slate-500">Showing the last 20 notes for this outlet.</p>
                </div>
                <button
                  type="button"
                  onClick={() => void loadGrns()}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Refresh
                </button>
              </div>

              {loadingGrns ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
                  Loading goods received notes...
                </div>
              ) : grns.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
                  No goods received notes yet for {currentOutlet.name}.
                </div>
              ) : (
                <div className="space-y-4">
                  {grns.map((grn) => (
                    <article key={grn.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">GRN Number</p>
                          <p className="text-lg font-semibold text-slate-900">{grn.grnNumber}</p>
                          <p className="text-sm text-slate-500">{formatDate(grn.receivedDate)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Cost</p>
                          <p className="text-lg font-semibold text-slate-900">{formatCurrency(grn.totalAmount)}</p>
                          <p className="text-sm text-slate-500">{grn.totalQuantity?.toFixed(2)} units</p>
                        </div>
                      </div>
                      <div className="mt-4 text-sm text-slate-600">
                        <p>
                          Supplier: <span className="font-semibold">{grn.supplierName ?? 'Walk-in / Misc'}</span>
                        </p>
                        {grn.referenceNumber && <p className="mt-1">Reference: {grn.referenceNumber}</p>}
                        {grn.remarks && <p className="mt-1">Notes: {grn.remarks}</p>}
                      </div>
                      <div className="mt-4 divide-y divide-slate-100 rounded-2xl bg-slate-50">
                        {grn.items.map((item) => (
                          <div key={item.id ?? `${grn.id}-${item.productId}`} className="flex items-center justify-between px-4 py-3 text-sm text-slate-700">
                            <div>
                              <p className="font-medium">{item.productName}</p>
                              <p className="text-xs text-slate-500">Batch: {item.batchNumber ?? '—'}</p>
                            </div>
                            <div className="text-right">
                              <p>{item.quantity.toFixed(2)} units</p>
                              <p className="text-xs text-slate-500">{formatCurrency(item.unitCost)} each</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </section>
        </div>
      </div>
    </CashierLayout>
  );
};

export default GoodsReceivedNotesPage;
