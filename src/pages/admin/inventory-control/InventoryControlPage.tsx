import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import ToastContainer from '../../../components/common/ToastContainer';
import Alert, { type AlertType } from '../../../components/common/Alert';
import { useOutlet } from '../../../contexts/OutletContext';
import { stockService } from '../../../services/stockService';
import { productService } from '../../../services/productService';
import { outletService } from '../../../services/outletService';
import type { Product } from '../../../types/product';
import type { Outlet } from '../../../types/outlet';
import type {
  StockAdjustment,
  StockAdjustmentReason,
  StockAdjustmentRequest,
  CycleCountTask,
  CycleCountRequest,
  CycleCountItemRequest,
  StockTransfer,
  StockTransferItemRequest,
} from '../../../types/inventory';

type InventoryTab = 'adjustments' | 'cycle-counts' | 'transfers';

const ADJUSTMENT_REASONS: { label: string; value: StockAdjustmentReason }[] = [
  { label: 'Manual Correction', value: 'MANUAL' },
  { label: 'Shrinkage', value: 'SHRINKAGE' },
  { label: 'Damaged', value: 'DAMAGE' },
  { label: 'Expired', value: 'EXPIRED' },
  { label: 'Cycle Count', value: 'CYCLE_COUNT' },
  { label: 'Transfer Out', value: 'TRANSFER_OUT' },
  { label: 'Transfer In', value: 'TRANSFER_IN' },
];

const InventoryControlPage: React.FC = () => {
  const { currentOutlet } = useOutlet();
  const [activeTab, setActiveTab] = useState<InventoryTab>('adjustments');
  const [products, setProducts] = useState<Product[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([]);
  const [cycleCounts, setCycleCounts] = useState<CycleCountTask[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: AlertType; title: string; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [adjustmentForm, setAdjustmentForm] = useState({
    productId: '',
    outletId: '',
    quantityChange: '',
    countedQuantity: '',
    reason: 'MANUAL' as StockAdjustmentReason,
    note: '',
  });

  const [countForm, setCountForm] = useState({
    outletId: '',
    reference: '',
    notes: '',
  });
  const [countItemDraft, setCountItemDraft] = useState<CycleCountItemRequest>({
    productId: 0,
    countedQuantity: 0,
    reason: 'CYCLE_COUNT',
    note: '',
  });
  const [countItems, setCountItems] = useState<CycleCountItemRequest[]>([]);

  const [transferForm, setTransferForm] = useState({
    sourceOutletId: '',
    targetOutletId: '',
    notes: '',
  });
  const [transferItemDraft, setTransferItemDraft] = useState<StockTransferItemRequest>({
    productId: 0,
    quantity: 0,
    note: '',
  });
  const [transferItems, setTransferItems] = useState<StockTransferItemRequest[]>([]);

  useEffect(() => {
    setAdjustmentForm((prev) => ({ ...prev, outletId: currentOutlet?.id ? String(currentOutlet.id) : '' }));
    setCountForm((prev) => ({ ...prev, outletId: currentOutlet?.id ? String(currentOutlet.id) : '' }));
    setTransferForm((prev) => ({ ...prev, sourceOutletId: currentOutlet?.id ? String(currentOutlet.id) : prev.sourceOutletId }));
  }, [currentOutlet?.id]);

  const loadReferenceData = useCallback(async () => {
    const [productList, outletList] = await Promise.all([productService.getAll(), outletService.getAll()]);
    setProducts(productList);
    setOutlets(outletList);
  }, []);

  const loadAdjustments = useCallback(async () => {
    const outletId = currentOutlet?.id;
    const items = await stockService.getAdjustments({ outletId, limit: 25 });
    setAdjustments(
      items.map((item) => ({
        ...item,
        quantityChange: Number(item.quantityChange ?? 0),
        countedQuantity: item.countedQuantity != null ? Number(item.countedQuantity) : undefined,
        resultingQuantity: item.resultingQuantity != null ? Number(item.resultingQuantity) : undefined,
      }))
    );
  }, [currentOutlet?.id]);

  const loadCycleCounts = useCallback(async () => {
    const outletId = currentOutlet?.id;
    const items = await stockService.getCycleCounts({ outletId, limit: 10 });
    setCycleCounts(items);
  }, [currentOutlet?.id]);

  const loadTransfers = useCallback(async () => {
    const outletId = currentOutlet?.id;
    if (!outletId) {
      setTransfers([]);
      return;
    }
    const [sourceTransfers, targetTransfers] = await Promise.all([
      stockService.getTransfers({ sourceOutletId: outletId, limit: 15 }),
      stockService.getTransfers({ targetOutletId: outletId, limit: 15 }),
    ]);
    const deduped = new Map<number, StockTransfer>();
    [...sourceTransfers, ...targetTransfers].forEach((transfer) => {
      deduped.set(transfer.id, transfer);
    });
    setTransfers(Array.from(deduped.values()));
  }, [currentOutlet?.id]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([loadReferenceData(), loadAdjustments(), loadCycleCounts(), loadTransfers()])
      .catch((err) => {
        console.error('Failed to load inventory control data', err);
        setError('Failed to load inventory control data');
      })
      .finally(() => setLoading(false));
  }, [loadReferenceData, loadAdjustments, loadCycleCounts, loadTransfers]);

  const handleAdjustmentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!adjustmentForm.productId || !adjustmentForm.outletId) {
      setToast({ type: 'error', title: 'Missing Fields', message: 'Select a product and outlet' });
      return;
    }
    if (!adjustmentForm.quantityChange && !adjustmentForm.countedQuantity) {
      setToast({ type: 'error', title: 'Missing Input', message: 'Enter quantity change or counted quantity' });
      return;
    }

    const payload: StockAdjustmentRequest = {
      productId: Number(adjustmentForm.productId),
      outletId: Number(adjustmentForm.outletId),
      reason: adjustmentForm.reason,
      note: adjustmentForm.note || undefined,
    };
    if (adjustmentForm.countedQuantity) {
      payload.countedQuantity = Number(adjustmentForm.countedQuantity);
    } else if (adjustmentForm.quantityChange) {
      payload.quantityChange = Number(adjustmentForm.quantityChange);
    }
    try {
      await stockService.recordAdjustment(payload);
      setToast({ type: 'success', title: 'Adjustment Recorded', message: 'Stock updated successfully' });
      setAdjustmentForm((prev) => ({ ...prev, quantityChange: '', countedQuantity: '', note: '' }));
      await loadAdjustments();
    } catch (err) {
      console.error('Failed to record adjustment', err);
      setToast({ type: 'error', title: 'Adjustment Failed', message: 'Unable to record stock adjustment' });
    }
  };

  const handleAddCountItem = () => {
    if (!countItemDraft.productId || !countItemDraft.countedQuantity) {
      setToast({ type: 'error', title: 'Missing Item', message: 'Select a product and counted quantity' });
      return;
    }
    setCountItems((prev) => [...prev, { ...countItemDraft }]);
    setCountItemDraft({ productId: 0, countedQuantity: 0, reason: 'CYCLE_COUNT', note: '' });
  };

  const handleCycleCountSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!countForm.outletId || !countForm.reference) {
      setToast({ type: 'error', title: 'Missing Fields', message: 'Provide outlet and reference' });
      return;
    }
    if (countItems.length === 0) {
      setToast({ type: 'error', title: 'No Items', message: 'Add at least one product to count' });
      return;
    }
    const payload: CycleCountRequest = {
      outletId: Number(countForm.outletId),
      reference: countForm.reference,
      notes: countForm.notes || undefined,
      items: countItems.map((item) => ({
        productId: Number(item.productId),
        countedQuantity: Number(item.countedQuantity),
        reason: item.reason,
        note: item.note,
      })),
    };
    try {
      await stockService.recordCycleCount(payload);
      setToast({ type: 'success', title: 'Cycle Count Recorded', message: 'Stock reconciled to counted values' });
      setCountForm((prev) => ({ ...prev, reference: '', notes: '' }));
      setCountItems([]);
      await Promise.all([loadCycleCounts(), loadAdjustments()]);
    } catch (err) {
      console.error('Failed to record cycle count', err);
      setToast({ type: 'error', title: 'Cycle Count Failed', message: 'Unable to record cycle count' });
    }
  };

  const handleAddTransferItem = () => {
    if (!transferItemDraft.productId || !transferItemDraft.quantity) {
      setToast({ type: 'error', title: 'Missing Item', message: 'Select a product and quantity' });
      return;
    }
    setTransferItems((prev) => [...prev, { ...transferItemDraft }]);
    setTransferItemDraft({ productId: 0, quantity: 0, note: '' });
  };

  const handleTransferSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!transferForm.sourceOutletId || !transferForm.targetOutletId) {
      setToast({ type: 'error', title: 'Missing Outlets', message: 'Select source and destination outlets' });
      return;
    }
    if (transferForm.sourceOutletId === transferForm.targetOutletId) {
      setToast({ type: 'error', title: 'Invalid Outlets', message: 'Source and destination must differ' });
      return;
    }
    if (transferItems.length === 0) {
      setToast({ type: 'error', title: 'No Items', message: 'Add at least one product to transfer' });
      return;
    }
    const payload = {
      sourceOutletId: Number(transferForm.sourceOutletId),
      targetOutletId: Number(transferForm.targetOutletId),
      notes: transferForm.notes || undefined,
      items: transferItems.map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        note: item.note,
      })),
    };
    try {
      await stockService.createTransfer(payload);
      setToast({ type: 'success', title: 'Transfer Created', message: 'Transfer order created successfully' });
      setTransferForm((prev) => ({ ...prev, notes: '' }));
      setTransferItems([]);
      await loadTransfers();
    } catch (err) {
      console.error('Failed to create transfer', err);
      setToast({ type: 'error', title: 'Transfer Failed', message: 'Unable to create stock transfer' });
    }
  };

  const handleTransferAction = async (transfer: StockTransfer, status: 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED') => {
    if (!window.confirm(`Update transfer ${transfer.transferNumber} to ${status.replace('_', ' ')}?`)) {
      return;
    }
    try {
      await stockService.updateTransferStatus(transfer.id, status);
      setToast({ type: 'success', title: 'Transfer Updated', message: 'Transfer status updated' });
      await Promise.all([loadTransfers(), loadAdjustments()]);
    } catch (err) {
      console.error('Failed to update transfer status', err);
      setToast({ type: 'error', title: 'Update Failed', message: 'Unable to update transfer status' });
    }
  };

  const activeAdjustments = useMemo(
    () =>
      adjustments.map((adj) => ({
        ...adj,
        changeLabel: adj.quantityChange >= 0 ? `+${adj.quantityChange}` : adj.quantityChange,
      })),
    [adjustments]
  );

  const renderTabButton = (tab: InventoryTab, label: string) => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 rounded-full text-sm font-medium ${
        activeTab === tab ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      }`}
    >
      {label}
    </button>
  );

  const outletOptions = outlets.map((outlet) => (
    <option key={outlet.id} value={outlet.id}>
      {outlet.name}
    </option>
  ));

  const productOptions = products.map((product) => (
    <option key={product.id} value={product.id}>
      {product.name}
    </option>
  ));

  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Inventory Control"
          description="Record adjustments, cycle counts, and move inventory across outlets to keep stock accurate."
        />

        {toast && (
          <ToastContainer>
            <Alert type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />
          </ToastContainer>
        )}

        {error && <Alert type="error" title="Error" message={error} onClose={() => setError(null)} />}

        <div className="flex flex-wrap gap-3">{renderTabButton('adjustments', 'Adjustments')}{renderTabButton('cycle-counts', 'Cycle Counts')}{renderTabButton('transfers', 'Transfers')}</div>

        {loading ? (
          <div className="rounded-2xl bg-white p-8 shadow-sm text-center text-slate-500">Loading inventory workspace...</div>
        ) : (
          <>
            {activeTab === 'adjustments' && (
              <section className="space-y-6">
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Record Adjustment</h3>
                  <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleAdjustmentSubmit}>
                    <label className="text-sm font-medium text-slate-700">
                      Product
                      <select
                        value={adjustmentForm.productId}
                        onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, productId: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                        required
                      >
                        <option value="">Select product</option>
                        {productOptions}
                      </select>
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Outlet
                      <select
                        value={adjustmentForm.outletId}
                        onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, outletId: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                        required
                      >
                        <option value="">Select outlet</option>
                        {outletOptions}
                      </select>
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Quantity Change
                      <input
                        type="number"
                        step="0.01"
                        value={adjustmentForm.quantityChange}
                        onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, quantityChange: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                        placeholder="+/- amount"
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Counted Quantity
                      <input
                        type="number"
                        step="0.01"
                        value={adjustmentForm.countedQuantity}
                        onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, countedQuantity: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                        placeholder="Actual on hand"
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Reason
                      <select
                        value={adjustmentForm.reason}
                        onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, reason: e.target.value as StockAdjustmentReason }))}
                        className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                      >
                        {ADJUSTMENT_REASONS.map((reason) => (
                          <option key={reason.value} value={reason.value}>
                            {reason.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm font-medium text-slate-700 md:col-span-2">
                      Notes
                      <textarea
                        value={adjustmentForm.note}
                        onChange={(e) => setAdjustmentForm((prev) => ({ ...prev, note: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                        rows={2}
                        placeholder="Optional reasoning"
                      />
                    </label>
                    <div className="md:col-span-2 flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700"
                      >
                        Record Adjustment
                      </button>
                    </div>
                  </form>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Recent Adjustments</h3>
                    <span className="text-sm text-slate-500">Latest 25 entries</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Outlet</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Change</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Counted</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reason</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {activeAdjustments.map((adjustment) => (
                          <tr key={adjustment.id}>
                            <td className="px-4 py-2 text-sm text-slate-600">{new Date(adjustment.createdAt).toLocaleString()}</td>
                            <td className="px-4 py-2 text-sm text-slate-900">{adjustment.productName}</td>
                            <td className="px-4 py-2 text-sm text-slate-600">{adjustment.outletName}</td>
                            <td className={`px-4 py-2 text-sm font-semibold ${adjustment.quantityChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {adjustment.changeLabel}
                            </td>
                            <td className="px-4 py-2 text-sm text-slate-600">{adjustment.countedQuantity ?? '—'}</td>
                            <td className="px-4 py-2 text-sm text-slate-600">{adjustment.reason.replace('_', ' ')}</td>
                            <td className="px-4 py-2 text-sm text-slate-600">{adjustment.note ?? '—'}</td>
                          </tr>
                        ))}
                        {activeAdjustments.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                              No adjustments recorded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'cycle-counts' && (
              <section className="space-y-6">
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Record Cycle Count</h3>
                  <form className="space-y-4" onSubmit={handleCycleCountSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <label className="text-sm font-medium text-slate-700">
                        Outlet
                        <select
                          value={countForm.outletId}
                          onChange={(e) => setCountForm((prev) => ({ ...prev, outletId: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                          required
                        >
                          <option value="">Select outlet</option>
                          {outletOptions}
                        </select>
                      </label>
                      <label className="text-sm font-medium text-slate-700">
                        Reference
                        <input
                          value={countForm.reference}
                          onChange={(e) => setCountForm((prev) => ({ ...prev, reference: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                          placeholder="Cycle count name"
                          required
                        />
                      </label>
                      <label className="text-sm font-medium text-slate-700">
                        Notes
                        <input
                          value={countForm.notes}
                          onChange={(e) => setCountForm((prev) => ({ ...prev, notes: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                          placeholder="Optional"
                        />
                      </label>
                    </div>

                    <div className="rounded-xl border border-dashed border-slate-300 p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <select
                          value={countItemDraft.productId || ''}
                          onChange={(e) =>
                            setCountItemDraft((prev) => ({ ...prev, productId: Number(e.target.value || 0) }))
                          }
                          className="rounded-lg border border-slate-300 p-2"
                        >
                          <option value="">Product</option>
                          {productOptions}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          value={countItemDraft.countedQuantity || ''}
                          onChange={(e) =>
                            setCountItemDraft((prev) => ({ ...prev, countedQuantity: Number(e.target.value || 0) }))
                          }
                          className="rounded-lg border border-slate-300 p-2"
                          placeholder="Counted qty"
                        />
                        <select
                          value={countItemDraft.reason || 'CYCLE_COUNT'}
                          onChange={(e) =>
                            setCountItemDraft((prev) => ({ ...prev, reason: e.target.value as StockAdjustmentReason }))
                          }
                          className="rounded-lg border border-slate-300 p-2"
                        >
                          {ADJUSTMENT_REASONS.map((reason) => (
                            <option key={reason.value} value={reason.value}>
                              {reason.label}
                            </option>
                          ))}
                        </select>
                        <input
                          value={countItemDraft.note || ''}
                          onChange={(e) => setCountItemDraft((prev) => ({ ...prev, note: e.target.value }))}
                          className="rounded-lg border border-slate-300 p-2"
                          placeholder="Note"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleAddCountItem}
                          className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Add Product
                        </button>
                      </div>
                      {countItems.length > 0 && (
                        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
                          {countItems.map((item, index) => {
                            const product = products.find((p) => p.id === item.productId);
                            return (
                              <li key={`${item.productId}-${index}`} className="flex items-center justify-between px-3 py-2 text-sm">
                                <span className="text-slate-800">
                                  {product?.name ?? 'Product'} — counted {item.countedQuantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setCountItems((prev) => prev.filter((_, idx) => idx !== index))}
                                  className="text-rose-500 hover:text-rose-600"
                                >
                                  Remove
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
                        Close Cycle Count
                      </button>
                    </div>
                  </form>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Recent Cycle Counts</h3>
                    <span className="text-sm text-slate-500">Latest 10 counts</span>
                  </div>
                  <div className="space-y-4">
                    {cycleCounts.map((count) => (
                      <div key={count.id} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-900">{count.taskNumber}</p>
                            <p className="text-sm text-slate-600">{count.outletName}</p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {count.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="mt-3 text-sm text-slate-600">
                          Counted {count.countedDate ? new Date(count.countedDate).toLocaleString() : count.scheduledDate ? new Date(count.scheduledDate).toLocaleString() : '—'}
                        </div>
                        <div className="mt-3 overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-left text-slate-500">
                                <th className="py-1 pr-4 font-semibold">Product</th>
                                <th className="py-1 pr-4 font-semibold">Expected</th>
                                <th className="py-1 pr-4 font-semibold">Counted</th>
                                <th className="py-1 pr-4 font-semibold">Variance</th>
                              </tr>
                            </thead>
                            <tbody>
                              {count.items.map((item) => (
                                <tr key={item.id}>
                                  <td className="py-1 pr-4 text-slate-800">{item.productName}</td>
                                  <td className="py-1 pr-4 text-slate-600">{item.expectedQuantity ?? '—'}</td>
                                  <td className="py-1 pr-4 text-slate-600">{item.countedQuantity}</td>
                                  <td className={`py-1 pr-4 font-semibold ${item.variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {item.variance ?? 0}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                    {cycleCounts.length === 0 && (
                      <div className="text-center text-sm text-slate-500">No cycle counts recorded yet.</div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'transfers' && (
              <section className="space-y-6">
                <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Create Transfer</h3>
                  <form className="space-y-4" onSubmit={handleTransferSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <label className="text-sm font-medium text-slate-700">
                        Source Outlet
                        <select
                          value={transferForm.sourceOutletId}
                          onChange={(e) => setTransferForm((prev) => ({ ...prev, sourceOutletId: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                          required
                        >
                          <option value="">Select outlet</option>
                          {outletOptions}
                        </select>
                      </label>
                      <label className="text-sm font-medium text-slate-700">
                        Destination Outlet
                        <select
                          value={transferForm.targetOutletId}
                          onChange={(e) => setTransferForm((prev) => ({ ...prev, targetOutletId: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                          required
                        >
                          <option value="">Select outlet</option>
                          {outletOptions}
                        </select>
                      </label>
                      <label className="text-sm font-medium text-slate-700">
                        Notes
                        <input
                          value={transferForm.notes}
                          onChange={(e) => setTransferForm((prev) => ({ ...prev, notes: e.target.value }))}
                          className="mt-1 w-full rounded-lg border border-slate-300 p-2"
                          placeholder="Optional instructions"
                        />
                      </label>
                    </div>

                    <div className="rounded-xl border border-dashed border-slate-300 p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select
                          value={transferItemDraft.productId || ''}
                          onChange={(e) =>
                            setTransferItemDraft((prev) => ({ ...prev, productId: Number(e.target.value || 0) }))
                          }
                          className="rounded-lg border border-slate-300 p-2"
                        >
                          <option value="">Product</option>
                          {productOptions}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          value={transferItemDraft.quantity || ''}
                          onChange={(e) =>
                            setTransferItemDraft((prev) => ({ ...prev, quantity: Number(e.target.value || 0) }))
                          }
                          className="rounded-lg border border-slate-300 p-2"
                          placeholder="Quantity"
                        />
                        <input
                          value={transferItemDraft.note || ''}
                          onChange={(e) => setTransferItemDraft((prev) => ({ ...prev, note: e.target.value }))}
                          className="rounded-lg border border-slate-300 p-2"
                          placeholder="Note"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleAddTransferItem}
                          className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-1 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Add Item
                        </button>
                      </div>
                      {transferItems.length > 0 && (
                        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
                          {transferItems.map((item, index) => {
                            const product = products.find((p) => p.id === item.productId);
                            return (
                              <li key={`${item.productId}-${index}`} className="flex items-center justify-between px-3 py-2 text-sm">
                                <span className="text-slate-800">
                                  {product?.name ?? 'Product'} — qty {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setTransferItems((prev) => prev.filter((_, idx) => idx !== index))}
                                  className="text-rose-500 hover:text-rose-600"
                                >
                                  Remove
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
                        Create Transfer
                      </button>
                    </div>
                  </form>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Open Transfers</h3>
                    <span className="text-sm text-slate-500">Latest 15 transfers</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Transfer #</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">From</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">To</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Items</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {transfers.map((transfer) => (
                          <tr key={transfer.id}>
                            <td className="px-4 py-2 text-sm font-semibold text-slate-800">{transfer.transferNumber}</td>
                            <td className="px-4 py-2 text-sm text-slate-600">{transfer.sourceOutletName}</td>
                            <td className="px-4 py-2 text-sm text-slate-600">{transfer.targetOutletName}</td>
                            <td className="px-4 py-2 text-sm">
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                {transfer.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-slate-600">
                              {transfer.items.map((item) => (
                                <div key={item.id}>
                                  {item.productName} — {item.quantity}
                                </div>
                              ))}
                            </td>
                            <td className="px-4 py-2 text-sm text-slate-600 space-x-2">
                              {transfer.status === 'REQUESTED' && (
                                <>
                                  <button
                                    className="text-blue-600 hover:underline"
                                    onClick={() => handleTransferAction(transfer, 'IN_TRANSIT')}
                                  >
                                    Mark In Transit
                                  </button>
                                  <button
                                    className="text-emerald-600 hover:underline"
                                    onClick={() => handleTransferAction(transfer, 'COMPLETED')}
                                  >
                                    Complete
                                  </button>
                                  <button
                                    className="text-rose-600 hover:underline"
                                    onClick={() => handleTransferAction(transfer, 'CANCELLED')}
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              {transfer.status === 'IN_TRANSIT' && (
                                <button
                                  className="text-emerald-600 hover:underline"
                                  onClick={() => handleTransferAction(transfer, 'COMPLETED')}
                                >
                                  Receive Transfer
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {transfers.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">
                              No transfers created yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default InventoryControlPage;
