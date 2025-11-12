import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import Alert, { type AlertType } from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import SupplierModal from '../../../components/admin/suppliers/SupplierModal';
import { supplierService } from '../../../services/supplierService';
import type { Supplier } from '../../../types/supplier';

const formatDateTime = (value?: string): string => {
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

const resolveTimestamp = (value?: string): number => {
  if (!value) {
    return 0;
  }
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [alert, setAlert] = useState<{ type: AlertType; title: string; message: string } | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; supplier: Supplier | null }>({ open: false, supplier: null });

  const showToast = useCallback((type: AlertType, title: string, message: string) => {
    setAlert({ type, title, message });
  }, []);

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await supplierService.getAll();
      setSuppliers(data);
    } catch (err) {
      console.error('Failed to load suppliers', err);
      setLoadError('Unable to load suppliers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSuppliers();
  }, [fetchSuppliers]);

  const handleCreate = useCallback(() => {
    setSelectedSupplier(null);
    setModalMode('create');
  }, []);

  const handleView = useCallback((supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setModalMode('view');
  }, []);

  const handleEdit = useCallback((supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setModalMode('edit');
  }, []);

  const handleModalClose = useCallback(() => {
    setSelectedSupplier(null);
    setModalMode(null);
  }, []);

  const upsertSupplier = useCallback((supplier: Supplier) => {
    setSuppliers((prev) => [supplier, ...prev.filter((existing) => existing.id !== supplier.id)]);
    setLoadError(null);
    handleModalClose();
  }, [handleModalClose]);

  const handleCreateSuccess = useCallback((supplier: Supplier) => {
    upsertSupplier(supplier);
    showToast('success', 'Supplier Added', `${supplier.name} has been added.`);
  }, [showToast, upsertSupplier]);

  const handleUpdateSuccess = useCallback((supplier: Supplier) => {
    upsertSupplier(supplier);
    showToast('success', 'Supplier Updated', `${supplier.name} has been updated.`);
  }, [showToast, upsertSupplier]);

  const handleDeleteRequest = useCallback((supplier: Supplier) => {
    setConfirmDelete({ open: true, supplier });
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setConfirmDelete({ open: false, supplier: null });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!confirmDelete.supplier) {
      return;
    }
    try {
      await supplierService.remove(confirmDelete.supplier.id);
      setSuppliers((prev) => prev.filter((supplier) => supplier.id !== confirmDelete.supplier?.id));
      showToast('success', 'Supplier Archived', `${confirmDelete.supplier.name} moved to inactive.`);
    } catch (err) {
      console.error('Failed to delete supplier', err);
      showToast('error', 'Delete Failed', 'Unable to archive supplier. Please try again.');
    } finally {
      setConfirmDelete({ open: false, supplier: null });
    }
  }, [confirmDelete.supplier, showToast]);

  const matchesQuery = useCallback((supplier: Supplier): boolean => {
    if (!searchQuery.trim()) {
      return true;
    }
    const query = searchQuery.toLowerCase();
    return (
      supplier.name.toLowerCase().includes(query) ||
      supplier.supplierCode?.toLowerCase().includes(query) ||
      supplier.contactName?.toLowerCase().includes(query) ||
      supplier.contactEmail?.toLowerCase().includes(query) ||
      supplier.contactPhone?.toLowerCase().includes(query) ||
      false
    );
  }, [searchQuery]);

  const filteredSuppliers = useMemo(() => {
    return suppliers
      .filter(matchesQuery)
      .sort((a, b) => resolveTimestamp(b.modifiedDate ?? b.createdDate) - resolveTimestamp(a.modifiedDate ?? a.createdDate));
  }, [matchesQuery, suppliers]);

  const activeCount = useMemo(() => suppliers.filter((supplier) => supplier.recordStatus === 'ACTIVE').length, [suppliers]);
  const inactiveCount = suppliers.length - activeCount;

  const renderLoadState = () => (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        <p className="mt-4 text-slate-600">Loading suppliers...</p>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
      <div className="text-lg font-semibold">No suppliers yet</div>
      <p className="mt-3 text-sm text-slate-500">
        {suppliers.length === 0
          ? 'Add your first supplier to keep procurement and inventory audits organized.'
          : 'Try adjusting your search to find a specific supplier.'}
      </p>
      <button
        type="button"
        onClick={handleCreate}
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Add supplier
      </button>
    </div>
  );

  const renderTable = () => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-3">Supplier</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3">Location</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredSuppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="font-semibold text-slate-900">{supplier.name}</div>
                  <p className="text-xs text-slate-500">{supplier.supplierCode ?? 'Auto'}</p>
                  <p className="text-xs text-slate-400">Updated {formatDateTime(supplier.modifiedDate ?? supplier.createdDate)}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="text-slate-800">{supplier.contactName ?? '—'}</div>
                  <div className="text-xs text-slate-500">{supplier.contactEmail ?? '—'}</div>
                </td>
                <td className="px-6 py-4 text-slate-700">{supplier.contactPhone ?? '—'}</td>
                <td className="px-6 py-4 text-slate-700">
                  {[supplier.city, supplier.state, supplier.country].filter(Boolean).join(', ') || '—'}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      supplier.recordStatus === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {supplier.recordStatus === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleView(supplier)}
                      className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100"
                      aria-label="View supplier"
                    >
                      👁️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(supplier)}
                      className="rounded-full border border-slate-200 p-2 text-blue-600 transition hover:bg-blue-50"
                      aria-label="Edit supplier"
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRequest(supplier)}
                      className="rounded-full border border-slate-200 p-2 text-red-600 transition hover:bg-red-50"
                      aria-label="Archive supplier"
                    >
                      🗑️
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

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8">
        <AdminPageHeader
          title="Suppliers"
          description="Maintain vendor records, contacts, and locations so procurement and stock receiving stay coordinated."
        />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Suppliers</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{suppliers.length}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active</p>
            <p className="mt-3 text-3xl font-semibold text-emerald-600">{activeCount}</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Inactive</p>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{inactiveCount}</p>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <div className="relative flex-1 md:w-96">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by code, contact, or name..."
                  className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <span className="whitespace-nowrap text-sm text-slate-600">
                Showing {filteredSuppliers.length} suppliers • {activeCount} active
              </span>
            </div>
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white"
            >
              Add supplier
            </button>
          </div>
        </section>

        {(alert || loadError) && (
          <ToastContainer>
            {alert && (
              <Alert
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onClose={() => setAlert(null)}
              />
            )}
            {loadError && (
              <Alert
                type="error"
                title="Error"
                message={loadError}
                onClose={() => setLoadError(null)}
                autoHideDuration={6000}
              />
            )}
          </ToastContainer>
        )}

        {loading ? renderLoadState() : filteredSuppliers.length === 0 ? renderEmptyState() : renderTable()}
      </div>

      {modalMode && (
        <SupplierModal
          mode={modalMode}
          supplier={selectedSupplier}
          onClose={handleModalClose}
          onSuccess={modalMode === 'edit' ? handleUpdateSuccess : modalMode === 'create' ? handleCreateSuccess : undefined}
        />
      )}

      <ConfirmationDialog
        open={confirmDelete.open}
        title="Archive supplier"
        message={`Are you sure you want to archive ${confirmDelete.supplier?.name ?? 'this supplier'}?`}
        confirmLabel="Archive"
        cancelLabel="Cancel"
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </AdminLayout>
  );
};

export default SuppliersPage;
