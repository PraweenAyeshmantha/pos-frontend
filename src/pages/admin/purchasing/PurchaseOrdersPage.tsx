import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import Alert from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import PurchaseOrderModal from '../../../components/admin/purchase-orders/PurchaseOrderModal';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import { supplierService } from '../../../services/supplierService';
import { outletService } from '../../../services/outletService';
import { productService } from '../../../services/productService';
import { purchaseOrderService } from '../../../services/purchaseOrderService';
import type { Supplier } from '../../../types/supplier';
import type { Outlet } from '../../../types/outlet';
import type { Product } from '../../../types/product';
import type { PurchaseOrder, PurchaseOrderStatus } from '../../../types/purchaseOrder';

const OPEN_STATUSES: PurchaseOrderStatus[] = ['DRAFT', 'SUBMITTED', 'PARTIALLY_RECEIVED'];

const formatCurrency = (value: number): string =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PurchaseOrdersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<'open' | 'all'>('open');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState<{ open: boolean; order: PurchaseOrder | null }>({ open: false, order: null });

  const showToast = useCallback((type: 'success' | 'error', title: string, message: string) => {
    setAlert({ type, title, message });
  }, []);

  const loadReferenceData = useCallback(async () => {
    try {
      const [supplierData, outletData, productData] = await Promise.all([
        supplierService.getAll(),
        outletService.getAll(),
        productService.getAll(),
      ]);
      setSuppliers(supplierData);
      setOutlets(outletData);
      setProducts(productData);
    } catch (err) {
      console.error('Failed to load reference data', err);
      showToast('error', 'Procurement', 'Unable to load suppliers/outlets.');
    }
  }, [showToast]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const statuses = statusFilter === 'open' ? OPEN_STATUSES : undefined;
      const supplierId = supplierFilter ? Number(supplierFilter) : undefined;
      const data = await purchaseOrderService.list({ statuses, supplierId, limit: 50 });
      setPurchaseOrders(data);
    } catch (err) {
      console.error('Failed to load purchase orders', err);
      setLoadError('Unable to load purchase orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [showToast, statusFilter, supplierFilter]);

  useEffect(() => {
    void loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const handleCreateSuccess = useCallback(
    (order: PurchaseOrder) => {
      setPurchaseOrders((prev) => [order, ...prev.filter((existing) => existing.id !== order.id)]);
      showToast('success', 'Purchase Orders', `PO ${order.poNumber} created.`);
    },
    [showToast]
  );

  const handleSubmitOrder = useCallback(async (order: PurchaseOrder) => {
    try {
      const updated = await purchaseOrderService.updateStatus(order.id, 'SUBMITTED');
      setPurchaseOrders((prev) => prev.map((existing) => (existing.id === updated.id ? updated : existing)));
      showToast('success', 'Purchase Orders', `${updated.poNumber} submitted.`);
    } catch (err) {
      console.error('Failed to update purchase order status', err);
      showToast('error', 'Purchase Orders', 'Unable to submit purchase order.');
    }
  }, [showToast]);

  const handleCancelOrder = useCallback(async () => {
    if (!confirmCancel.order) {
      return;
    }
    try {
      const updated = await purchaseOrderService.updateStatus(confirmCancel.order.id, 'CANCELLED');
      setPurchaseOrders((prev) => prev.map((existing) => (existing.id === updated.id ? updated : existing)));
      showToast('success', 'Purchase Orders', `${updated.poNumber} cancelled.`);
    } catch (err) {
      console.error('Failed to cancel purchase order', err);
      showToast('error', 'Purchase Orders', 'Unable to cancel purchase order.');
    } finally {
      setConfirmCancel({ open: false, order: null });
    }
  }, [confirmCancel.order, showToast]);

  const matchesQuery = useCallback(
    (order: PurchaseOrder): boolean => {
      if (!searchQuery.trim()) {
        return true;
      }
      const query = searchQuery.toLowerCase();
      return (
        order.poNumber.toLowerCase().includes(query) ||
        order.supplierName.toLowerCase().includes(query) ||
        (order.outletName ?? '').toLowerCase().includes(query)
      );
    },
    [searchQuery],
  );

  const filteredOrders = useMemo(
    () => purchaseOrders.filter((order) => matchesQuery(order)),
    [matchesQuery, purchaseOrders],
  );
  const filteredTotals = useMemo(
    () =>
      filteredOrders.reduce(
        (acc, order) => ({
          amount: acc.amount + order.totalAmount,
          quantity: acc.quantity + order.totalQuantity,
        }),
        { amount: 0, quantity: 0 },
      ),
    [filteredOrders],
  );
  const totalOrders = purchaseOrders.length;
  const openOrders = useMemo(
    () => purchaseOrders.filter((order) => OPEN_STATUSES.includes(order.status)).length,
    [purchaseOrders],
  );
  const upcomingDeliveries = useMemo(
    () => purchaseOrders.filter((order) => order.expectedDate && new Date(order.expectedDate) >= new Date()).length,
    [purchaseOrders],
  );
  const outstandingAmount = useMemo(
    () =>
      purchaseOrders
        .filter((order) => OPEN_STATUSES.includes(order.status))
        .reduce((acc, order) => acc + order.totalAmount, 0),
    [purchaseOrders],
  );

  const renderStatusBadge = (status: PurchaseOrderStatus) => {
    const styles: Record<PurchaseOrderStatus, string> = {
      DRAFT: 'bg-slate-100 text-slate-700',
      SUBMITTED: 'bg-blue-100 text-blue-700',
      PARTIALLY_RECEIVED: 'bg-amber-100 text-amber-700',
      RECEIVED: 'bg-emerald-100 text-emerald-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${styles[status]}`}>{status.replace('_', ' ')}</span>;
  };

  const renderLoadState = () => (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        <p className="mt-4 text-sm text-slate-600">Loading purchase orders...</p>
      </div>
    </div>
  );

  const renderTable = () => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-3">PO</th>
              <th className="px-6 py-3">Supplier / Outlet</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Expected</th>
              <th className="px-6 py-3">Totals</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredOrders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900">{order.poNumber}</div>
                  <p className="text-xs text-slate-500">Created {new Date(order.createdDate ?? Date.now()).toLocaleDateString()}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <div className="font-semibold text-slate-800">{order.supplierName}</div>
                  <p className="text-xs text-slate-500">{order.outletName ?? '—'}</p>
                </td>
                <td className="px-6 py-4">{renderStatusBadge(order.status)}</td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {order.expectedDate ? new Date(order.expectedDate).toLocaleDateString() : '—'}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <div>Qty: {order.totalQuantity.toFixed(2)}</div>
                  <div>{formatCurrency(order.totalAmount)}</div>
                </td>
                <td className="px-6 py-4 text-right text-sm">
                  <div className="flex justify-end gap-2">
                    {order.status === 'DRAFT' && (
                      <button
                        type="button"
                        onClick={() => handleSubmitOrder(order)}
                        className="rounded-lg border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        Submit
                      </button>
                    )}
                    {OPEN_STATUSES.includes(order.status) && (
                      <button
                        type="button"
                        onClick={() => setConfirmCancel({ open: true, order })}
                        className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
      <p className="text-lg font-semibold">No purchase orders</p>
      <p className="mt-2 text-sm text-slate-500">
        {totalOrders === 0
          ? 'Use the button below to create your first purchase order.'
          : 'Try adjusting the filters or search to find an existing purchase order.'}
      </p>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        New Purchase Order
      </button>
    </div>
  );

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8 pb-12">
        <AdminPageHeader title="Purchase Orders" description="Track ordering workflow from draft to receiving." />

        {(alert || loadError) && (
          <ToastContainer>
            {alert ? (
              <Alert type={alert.type} title={alert.title} message={alert.message} onClose={() => setAlert(null)} />
            ) : null}
            {loadError ? (
              <Alert type="error" title="Purchase Orders" message={loadError} onClose={() => setLoadError(null)} />
            ) : null}
          </ToastContainer>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Upcoming Deliveries</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{upcomingDeliveries}</p>
            <p className="text-sm text-slate-500">Expected in the coming days</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Products Ordered</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{filteredTotals.quantity.toFixed(0)}</p>
            <p className="text-sm text-slate-500">Across current filters</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Average Order Value</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">
              {filteredOrders.length ? formatCurrency(filteredTotals.amount / filteredOrders.length) : '—'}
            </p>
            <p className="text-sm text-slate-500">Based on filtered list</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
                <div className="relative w-full md:max-w-lg">
                  <svg
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by PO number, supplier or outlet"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <span className="text-sm text-slate-600 md:pl-4">
                  Showing {filteredOrders.length} orders • {openOrders} currently open
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                New Purchase Order
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status Filter</p>
                <div className="mt-3 flex gap-2">
                  {(['open', 'all'] as Array<'open' | 'all'>).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStatusFilter(value)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                        statusFilter === value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {value === 'open' ? 'Open orders' : 'All orders'}
                    </button>
                  ))}
                </div>
              </div>
              <label className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700">
                Supplier Filter
                <select
                  value={supplierFilter}
                  onChange={(event) => setSupplierFilter(event.target.value)}
                  className="mt-3 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">All suppliers</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Orders</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{totalOrders}</p>
                <p className="text-xs text-slate-500">Updated from latest filters</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Outstanding Value</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatCurrency(outstandingAmount)}</p>
                <p className="text-xs text-slate-500">{openOrders} open orders</p>
              </div>
            </div>
          </div>
        </section>

        {loading ? renderLoadState() : filteredOrders.length === 0 ? renderEmptyState() : renderTable()}
      </div>

      <PurchaseOrderModal
        open={modalOpen}
        suppliers={suppliers}
        outlets={outlets}
        products={products}
        onClose={() => setModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <ConfirmationDialog
        open={confirmCancel.open}
        title="Cancel purchase order"
        message={`Cancel ${confirmCancel.order?.poNumber ?? 'this purchase order'}?`}
        confirmLabel="Cancel PO"
        cancelLabel="Keep"
        onCancel={() => setConfirmCancel({ open: false, order: null })}
        onConfirm={handleCancelOrder}
      />
    </AdminLayout>
  );
};

export default PurchaseOrdersPage;
