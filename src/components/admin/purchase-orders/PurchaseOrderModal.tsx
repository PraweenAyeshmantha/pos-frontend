import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { purchaseOrderService } from '../../../services/purchaseOrderService';
import { supplierProductService } from '../../../services/supplierProductService';
import type { Supplier } from '../../../types/supplier';
import type { Outlet } from '../../../types/outlet';
import type { Product } from '../../../types/product';
import type { SupplierProduct } from '../../../types/supplierProduct';
import type { PurchaseOrder, PurchaseOrderStatus } from '../../../types/purchaseOrder';

interface PurchaseOrderModalProps {
  open: boolean;
  suppliers: Supplier[];
  outlets: Outlet[];
  products: Product[];
  onClose: () => void;
  onSuccess: (order: PurchaseOrder) => void;
}

interface PurchaseOrderFormItem {
  id: string;
  productId: string;
  supplierProductId?: string;
  quantity: string;
  unitCost: string;
  note: string;
}

const STATUSES: PurchaseOrderStatus[] = ['DRAFT', 'SUBMITTED'];

const createItem = (): PurchaseOrderFormItem => ({
  id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
  productId: '',
  supplierProductId: undefined,
  quantity: '1',
  unitCost: '',
  note: '',
});

const PurchaseOrderModal: React.FC<PurchaseOrderModalProps> = ({ open, suppliers, outlets, products, onClose, onSuccess }) => {
  const [supplierId, setSupplierId] = useState('');
  const [outletId, setOutletId] = useState('');
  const [status, setStatus] = useState<PurchaseOrderStatus>('SUBMITTED');
  const [expectedDate, setExpectedDate] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [currencyCode, setCurrencyCode] = useState('');
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState<PurchaseOrderFormItem[]>([createItem()]);
  const [supplierCatalog, setSupplierCatalog] = useState<SupplierProduct[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSupplier = useMemo(() => suppliers.find((supplier) => supplier.id === Number(supplierId)), [supplierId, suppliers]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setSupplierId('');
    setOutletId('');
    setStatus('SUBMITTED');
    setExpectedDate('');
    setReferenceNumber('');
    setPaymentTerms('');
    setCurrencyCode('');
    setRemarks('');
    setItems([createItem()]);
    setSupplierCatalog([]);
    setError(null);
    setSaving(false);
  }, [open]);

  useEffect(() => {
    if (!supplierId) {
      setSupplierCatalog([]);
      return;
    }
    setLoadingCatalog(true);
    supplierProductService
      .list(Number(supplierId))
      .then((data) => {
        setSupplierCatalog(data);
        setPaymentTerms((prev) => prev || selectedSupplier?.defaultPaymentTerms || '');
        setCurrencyCode((prev) => prev || selectedSupplier?.preferredCurrency || '');
      })
      .catch((err) => {
        console.error('Failed to load supplier catalog', err);
      })
      .finally(() => setLoadingCatalog(false));
  }, [supplierId, selectedSupplier]);

  const closeModal = useCallback(() => {
    if (saving) {
      return;
    }
    onClose();
  }, [onClose, saving]);

  const updateItem = useCallback((itemId: string, changes: Partial<PurchaseOrderFormItem>) => {
    setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...changes } : item)));
  }, []);

  const handleProductChange = useCallback(
    (itemId: string, productValue: string) => {
      const catalogEntry = supplierCatalog.find((entry) => entry.productId === Number(productValue));
      updateItem(itemId, {
        productId: productValue,
        supplierProductId: catalogEntry?.id?.toString(),
        unitCost: catalogEntry?.purchaseCost?.toString() ?? '',
      });
    },
    [supplierCatalog, updateItem]
  );

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, createItem()]);
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((item) => item.id !== itemId)));
  }, []);

  const totals = useMemo(() => {
    return items.reduce(
      (accumulator, item) => {
        const quantity = Number(item.quantity) || 0;
        const unitCost = Number(item.unitCost) || 0;
        return {
          quantity: accumulator.quantity + quantity,
          amount: accumulator.amount + quantity * unitCost,
        };
      },
      { quantity: 0, amount: 0 }
    );
  }, [items]);

  const validateForm = useCallback(() => {
    if (!supplierId) {
      return 'Select a supplier to continue.';
    }
    if (!outletId) {
      return 'Select a destination outlet.';
    }
    if (!items.length) {
      return 'Add at least one product line.';
    }
    for (const item of items) {
      if (!item.productId) {
        return 'Each line item must have a product.';
      }
      const quantity = Number(item.quantity);
      if (!quantity || quantity <= 0) {
        return 'Quantities must be greater than zero.';
      }
      const unitCost = Number(item.unitCost);
      if (Number.isNaN(unitCost) || unitCost < 0) {
        return 'Enter a valid cost for every line item.';
      }
    }
    return null;
  }, [items, outletId, supplierId]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (saving) {
        return;
      }
      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        return;
      }
      setSaving(true);
      try {
        const payload = {
          supplierId: Number(supplierId),
          outletId: Number(outletId),
          status,
          expectedDate: expectedDate ? new Date(expectedDate).toISOString() : undefined,
          referenceNumber: referenceNumber.trim() || undefined,
          paymentTerms: paymentTerms.trim() || undefined,
          currencyCode: currencyCode.trim() ? currencyCode.trim().toUpperCase() : undefined,
          remarks: remarks.trim() || undefined,
          items: items.map((item) => ({
            productId: Number(item.productId),
            supplierProductId: item.supplierProductId ? Number(item.supplierProductId) : undefined,
            orderedQuantity: Number(item.quantity),
            unitCost: Number(item.unitCost),
            note: item.note.trim() || undefined,
          })),
        };
        const created = await purchaseOrderService.create(payload);
        onSuccess(created);
        onClose();
      } catch (err) {
        console.error('Failed to create purchase order', err);
        setError(err instanceof Error ? err.message : 'Unable to create purchase order.');
        setSaving(false);
      }
    },
    [currencyCode, expectedDate, items, onClose, onSuccess, outletId, paymentTerms, referenceNumber, remarks, saving, status, supplierId, validateForm]
  );

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" onClick={closeModal}>
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl" role="document" onClick={(event) => event.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Create Purchase Order</h2>
              <p className="text-sm text-slate-500">Send replenishment requests directly from procurement.</p>
            </div>
            <button type="button" onClick={closeModal} className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100" aria-label="Close">
              ✕
            </button>
          </div>

          <div className="max-h-[80vh] space-y-6 overflow-y-auto px-6 py-6">
            {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Supplier *</span>
                <select
                  value={supplierId}
                  onChange={(event) => setSupplierId(event.target.value)}
                  required
                  disabled={saving}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Outlet *</span>
                <select
                  value={outletId}
                  onChange={(event) => setOutletId(event.target.value)}
                  required
                  disabled={saving}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select outlet</option>
                  {outlets.map((outlet) => (
                    <option key={outlet.id} value={outlet.id}>
                      {outlet.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Status</span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as PurchaseOrderStatus)}
                  disabled={saving}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {STATUSES.map((option) => (
                    <option key={option} value={option}>
                      {option === 'SUBMITTED' ? 'Submitted' : 'Draft'}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Expected Date</span>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(event) => setExpectedDate(event.target.value)}
                  disabled={saving}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Reference #</span>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(event) => setReferenceNumber(event.target.value)}
                  disabled={saving}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Payment Terms</span>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(event) => setPaymentTerms(event.target.value)}
                  disabled={saving}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Currency</span>
                <input
                  type="text"
                  maxLength={3}
                  value={currencyCode}
                  onChange={(event) => setCurrencyCode(event.target.value.toUpperCase())}
                  disabled={saving}
                  className="h-11 rounded-lg border border-slate-200 px-3 uppercase text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Remarks</span>
                <input
                  type="text"
                  value={remarks}
                  onChange={(event) => setRemarks(event.target.value)}
                  disabled={saving}
                  className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </label>
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Line Items</p>
                  <p className="text-xs text-slate-500">{loadingCatalog ? 'Loading catalog...' : 'Prefills use supplier catalog when available.'}</p>
                </div>
                <button
                  type="button"
                  onClick={addItem}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  Add Line
                </button>
              </div>

              {items.map((item) => {
                const catalogEntry = supplierCatalog.find((entry) => entry.productId === Number(item.productId));
                return (
                  <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                        <span>Product *</span>
                        <select
                          value={item.productId}
                          onChange={(event) => handleProductChange(item.id, event.target.value)}
                          required
                          disabled={saving || !supplierId}
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
                      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                        <span>Quantity *</span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.quantity}
                          onChange={(event) => updateItem(item.id, { quantity: event.target.value })}
                          disabled={saving}
                          className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </label>
                      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                        <span>Unit Cost *</span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={item.unitCost}
                          onChange={(event) => updateItem(item.id, { unitCost: event.target.value })}
                          disabled={saving}
                          className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </label>
                    </div>
                    <div className="mt-3 flex flex-col gap-2 text-xs text-slate-500">
                      {catalogEntry ? (
                        <span>
                          Catalog cost {catalogEntry.purchaseCost ? `$${catalogEntry.purchaseCost.toFixed(2)} ${catalogEntry.currencyCode ?? ''}` : '—'} • Lead time {catalogEntry.leadTimeDays ?? '—'} days
                        </span>
                      ) : (
                        <span>No vendor defaults available.</span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-4">
                      <label className="flex flex-1 flex-col gap-2 text-sm font-medium text-slate-700">
                        <span>Notes</span>
                        <input
                          type="text"
                          value={item.note}
                          onChange={(event) => updateItem(item.id, { note: event.target.value })}
                          disabled={saving}
                          className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        disabled={items.length === 1 || saving}
                        className="mt-6 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                <span>Total Quantity</span>
                <span>{totals.quantity.toFixed(2)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                <span>Total Amount</span>
                <span>${totals.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Submitting...' : 'Create Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseOrderModal;
