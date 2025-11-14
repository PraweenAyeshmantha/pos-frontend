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

const PurchaseOrdersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<'open' | 'all'>('open');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [loading, setLoading] = useState(true);
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
      const statuses = statusFilter === 'open' ? OPEN_STATUSES : undefined;
      const supplierId = supplierFilter ? Number(supplierFilter) : undefined;
      const data = await purchaseOrderService.list({ statuses, supplierId, limit: 50 });
      setPurchaseOrders(data);
    } catch (err) {
      console.error('Failed to load purchase orders', err);
      showToast('error', 'Purchase Orders', 'Unable to load purchase orders.');
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

  const filteredOrders = useMemo(() => purchaseOrders, [purchaseOrders]);

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
                  <div>${order.totalAmount.toFixed(2)}</div>
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
      <p className="mt-2 text-sm text-slate-500">Use the button above to create your first purchase order.</p>
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
      <AdminPageHeader
        title="Purchase Orders"
        description="Track ordering workflow from draft to receiving."
        actions={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            New Purchase Order
          </button>
        }
      />

      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span>Status Filter</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'open' | 'all')}
              className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="open">Open orders</option>
              <option value="all">All orders</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span>Supplier Filter</span>
            <select
              value={supplierFilter}
              onChange={(event) => setSupplierFilter(event.target.value)}
              className="h-11 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All suppliers</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col justify-center rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <span className="text-xs uppercase tracking-wide text-slate-500">Visible Orders</span>
            <span className="text-2xl font-semibold text-slate-900">{filteredOrders.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
            <div className="text-sm text-slate-500">Loading purchase orders...</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          renderEmptyState()
        ) : (
          renderTable()
        )}
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

      {alert && (
        <ToastContainer>
          <Alert type={alert.type} title={alert.title} message={alert.message} onClose={() => setAlert(null)} />
        </ToastContainer>
      )}
    </AdminLayout>
  );
};

export default PurchaseOrdersPage;
