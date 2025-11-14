import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import Alert from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import SupplierProductModal from '../../../components/admin/procurement/SupplierProductModal';
import { supplierService } from '../../../services/supplierService';
import { supplierProductService } from '../../../services/supplierProductService';
import { productService } from '../../../services/productService';
import type { Supplier } from '../../../types/supplier';
import type { SupplierProduct } from '../../../types/supplierProduct';
import type { Product } from '../../../types/product';

const SupplierCatalogPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [catalog, setCatalog] = useState<SupplierProduct[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);
  const [modalState, setModalState] = useState<{ open: boolean; mode: 'create' | 'edit'; record: SupplierProduct | null }>({
    open: false,
    mode: 'create',
    record: null,
  });
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; record: SupplierProduct | null }>({
    open: false,
    record: null,
  });

  const selectedSupplier = useMemo(() => {
    if (!selectedSupplierId) {
      return null;
    }
    return suppliers.find((supplier) => supplier.id === Number(selectedSupplierId)) ?? null;
  }, [selectedSupplierId, suppliers]);

  const showToast = useCallback((type: 'success' | 'error', title: string, message: string) => {
    setAlert({ type, title, message });
  }, []);

  const loadSuppliers = useCallback(async () => {
    try {
      const data = await supplierService.getAll({ active: true });
      setSuppliers(data);
      if (!selectedSupplierId && data.length) {
        setSelectedSupplierId(data[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load suppliers', err);
      setLoadError('Unable to load suppliers.');
    }
  }, [selectedSupplierId]);

  const loadProducts = useCallback(async () => {
    try {
      const data = await productService.getAll();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products', err);
    }
  }, []);

  const loadCatalog = useCallback(async () => {
    if (!selectedSupplierId) {
      setCatalog([]);
      return;
    }
    try {
      setLoadingCatalog(true);
      setLoadError(null);
      const data = await supplierProductService.list(Number(selectedSupplierId));
      setCatalog(data);
    } catch (err) {
      console.error('Failed to load supplier catalog', err);
      setLoadError('Unable to load vendor catalog for the selected supplier.');
    } finally {
      setLoadingCatalog(false);
    }
  }, [selectedSupplierId]);

  useEffect(() => {
    void loadSuppliers();
    void loadProducts();
  }, [loadSuppliers, loadProducts]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const handleCreate = useCallback(() => {
    if (!selectedSupplierId) {
      return;
    }
    setModalState({ open: true, mode: 'create', record: null });
  }, [selectedSupplierId]);

  const handleEdit = useCallback((record: SupplierProduct) => {
    setModalState({ open: true, mode: 'edit', record });
  }, []);

  const handleModalClose = useCallback(() => {
    setModalState((prev) => ({ ...prev, open: false }));
  }, []);

  const handleModalSuccess = useCallback(
    (record: SupplierProduct) => {
      setCatalog((prev) => {
        const existing = prev.find((entry) => entry.id === record.id);
        if (existing) {
          return prev.map((entry) => (entry.id === record.id ? record : entry));
        }
        return [record, ...prev];
      });
      showToast('success', 'Vendor Catalog', `${record.productName} saved for ${selectedSupplier?.name ?? 'supplier'}.`);
    },
    [selectedSupplier?.name, showToast]
  );

  const requestDelete = useCallback((record: SupplierProduct) => {
    setConfirmDelete({ open: true, record });
  }, []);

  const handleDelete = useCallback(async () => {
    if (!confirmDelete.record || !selectedSupplierId) {
      return;
    }
    try {
      await supplierProductService.remove(Number(selectedSupplierId), confirmDelete.record.id);
      setCatalog((prev) => prev.filter((entry) => entry.id !== confirmDelete.record?.id));
      showToast('success', 'Vendor Catalog', `${confirmDelete.record.productName} removed.`);
    } catch (err) {
      console.error('Failed to delete supplier product', err);
      showToast('error', 'Vendor Catalog', 'Unable to remove entry.');
    } finally {
      setConfirmDelete({ open: false, record: null });
    }
  }, [confirmDelete.record, selectedSupplierId, showToast]);

  const renderTable = () => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-3">Product</th>
              <th className="px-6 py-3">Vendor Details</th>
              <th className="px-6 py-3">Costs & MOQ</th>
              <th className="px-6 py-3">Lead Time</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {catalog.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900">{entry.productName}</div>
                  <p className="text-xs text-slate-500">#{entry.productId}</p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <div>{entry.supplierProductName || '—'}</div>
                  <div className="text-xs text-slate-500">SKU: {entry.supplierSku || '—'}</div>
                  {entry.preferredSupplier && <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-2 text-xs font-semibold text-emerald-700">Preferred</span>}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <div>
                    {entry.purchaseCost !== undefined ? `$${entry.purchaseCost.toFixed(2)} ${entry.currencyCode ?? 'USD'}` : '—'}
                  </div>
                  <div className="text-xs text-slate-500">
                    MOQ: {entry.minimumOrderQuantity !== undefined ? entry.minimumOrderQuantity : '—'}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{entry.leadTimeDays ?? '—'} days</td>
                <td className="px-6 py-4 text-right text-sm">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(entry)}
                      className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => requestDelete(entry)}
                      className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Remove
                    </button>
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
      <p className="text-lg font-semibold">No vendor catalog entries yet</p>
      <p className="mt-2 text-sm text-slate-500">Use the "Link Product" button to add supplier-specific purchase data.</p>
      <button
        type="button"
        onClick={handleCreate}
        disabled={!selectedSupplierId}
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
      >
        Link Product
      </button>
    </div>
  );

  return (
    <AdminLayout>
      <AdminPageHeader
        title="Vendor Catalog"
        description="Store supplier-specific SKUs, pricing, and lead times to speed up purchasing."
        actions={
          <button
            type="button"
            onClick={handleCreate}
            disabled={!selectedSupplierId}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            Link Product
          </button>
        }
      />

      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <span>Supplier</span>
            <select
              value={selectedSupplierId}
              onChange={(event) => setSelectedSupplierId(event.target.value)}
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
        </div>

        {!selectedSupplierId ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
            <p className="text-sm">Select a supplier to manage their vendor catalog.</p>
          </div>
        ) : loadingCatalog ? (
          <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
            <div className="text-center text-slate-500">Loading vendor catalog...</div>
          </div>
        ) : catalog.length === 0 ? (
          renderEmptyState()
        ) : (
          renderTable()
        )}
      </div>

      <SupplierProductModal
        open={modalState.open}
        mode={modalState.mode}
        supplierId={Number(selectedSupplierId)}
        products={products}
        record={modalState.record}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      <ConfirmationDialog
        open={confirmDelete.open}
        title="Remove Vendor Product"
        message="This will remove the supplier-specific pricing reference. Continue?"
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onCancel={() => setConfirmDelete({ open: false, record: null })}
        onConfirm={handleDelete}
      />

      {(alert || loadError) && (
        <ToastContainer>
          {alert && (
            <Alert type={alert.type} title={alert.title} message={alert.message} onClose={() => setAlert(null)} />
          )}
          {loadError && (
            <Alert type="error" title="Vendor Catalog" message={loadError} onClose={() => setLoadError(null)} />
          )}
        </ToastContainer>
      )}
    </AdminLayout>
  );
};

export default SupplierCatalogPage;
