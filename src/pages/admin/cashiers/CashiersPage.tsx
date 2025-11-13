import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import Alert, { type AlertType } from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import AddCashierModal from '../../../components/admin/cashiers/AddCashierModal';
import { cashierService } from '../../../services/cashierService';
import type { Cashier } from '../../../types/cashier';

const formatDateTime = (value?: string): string => {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const CashiersPage: React.FC = () => {
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingCashier, setEditingCashier] = useState<Cashier | null>(null);
  const [modalMode, setModalMode] = useState<'edit' | 'view' | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; cashier: Cashier | null }>({
    show: false,
    cashier: null,
  });
  const [alert, setAlert] = useState<{ type: AlertType; title: string; message: string } | null>(null);

  const fetchCashiers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cashierService.getAll();
      setCashiers(data);
    } catch (err) {
      console.error('Error loading cashiers', err);
      setError('Failed to load cashiers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCashiers();
  }, [fetchCashiers]);

  const filteredCashiers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return cashiers;
    }

    return cashiers.filter((cashier) => {
      const outletMatch = cashier.assignedOutlets.some((outlet) => outlet.name.toLowerCase().includes(query));
      const categoryMatch = cashier.categories.some((category) =>
        category.categoryName.toLowerCase().includes(query) ||
        category.categoryCode.toLowerCase().includes(query),
      );
      return (
        cashier.username.toLowerCase().includes(query) ||
        cashier.name.toLowerCase().includes(query) ||
        (cashier.email ?? '').toLowerCase().includes(query) ||
        (cashier.phone ?? '').toLowerCase().includes(query) ||
        categoryMatch ||
        outletMatch
      );
    });
  }, [cashiers, searchQuery]);

  const handleAddNew = useCallback(() => {
    setEditingCashier(null);
    setModalMode(null);
    setShowAddModal(true);
  }, []);

  const handleEdit = useCallback((cashier: Cashier) => {
    setEditingCashier(cashier);
    setModalMode('edit');
    setShowAddModal(true);
  }, []);

  const handleView = useCallback((cashier: Cashier) => {
    setEditingCashier(cashier);
    setModalMode('view');
    setShowAddModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowAddModal(false);
    setEditingCashier(null);
    setModalMode(null);
  }, []);

  const handleSaveSuccess = useCallback(
    (action: 'create' | 'update') => {
      setShowAddModal(false);
      setEditingCashier(null);
      setAlert({
        type: 'success',
        title: 'Success',
        message: action === 'create' ? 'Cashier created successfully.' : 'Cashier updated successfully.',
      });
      void fetchCashiers();
    },
    [fetchCashiers],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteConfirm.cashier) {
      return;
    }
    try {
      await cashierService.delete(deleteConfirm.cashier.id);
      setAlert({
        type: 'success',
        title: 'Deleted',
        message: 'Cashier deleted successfully.',
      });
      void fetchCashiers();
    } catch (err) {
      console.error('Failed to delete cashier', err);
      setAlert({
        type: 'error',
        title: 'Error',
        message: 'Unable to delete cashier. Please try again.',
      });
    } finally {
      setDeleteConfirm({ show: false, cashier: null });
    }
  }, [deleteConfirm.cashier, fetchCashiers]);

  const handleDeleteRequest = useCallback((cashier: Cashier) => {
    setDeleteConfirm({ show: true, cashier });
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirm({ show: false, cashier: null });
  }, []);

  const totalCashiers = cashiers.length;
  const activeCashiers = useMemo(
    () => cashiers.filter((cashier) => cashier.recordStatus === 'ACTIVE').length,
    [cashiers],
  );

  const renderLoadState = () => (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        <p className="mt-4 text-slate-600">Loading cashiers...</p>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
      <div className="text-lg font-semibold">No cashiers yet</div>
      <p className="mt-3 text-sm text-slate-500">
        {totalCashiers === 0
          ? 'Add your first cashier to grant POS access and manage outlet assignments.'
          : 'Try a different search term to find the cashier you are looking for.'}
      </p>
      <button
        type="button"
        onClick={handleAddNew}
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Add cashier
      </button>
    </div>
  );

  const renderTable = () => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Cashier
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Contact
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Categories
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Branches
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Updated
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredCashiers.map((cashier) => {
              const isActive = cashier.recordStatus === 'ACTIVE';
              const statusClass = isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600';
              const statusLabel = isActive ? 'Active' : 'Inactive';

              return (
                <tr key={cashier.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 align-top">
                    <div className="space-y-1">
                      <span className="block text-sm font-semibold text-slate-900">{cashier.name || '—'}</span>
                      <div className="text-xs text-slate-500">{cashier.username}</div>
                      {cashier.defaultOutlet && (
                        <div className="text-xs text-slate-400">Default: {cashier.defaultOutlet.name}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top text-sm text-slate-600">
                    <div className="space-y-1 text-xs text-slate-500">
                      <div>{cashier.email || '—'}</div>
                      <div>{cashier.phone || '—'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top text-sm text-slate-600">
                    <div className="flex flex-wrap gap-1">
                      {cashier.categories.map((category) => (
                        <span key={category.id} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {category.categoryName}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top text-sm text-slate-600">
                    {cashier.assignedOutlets.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {cashier.assignedOutlets.map((outlet) => (
                          <span
                            key={outlet.id}
                            className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
                          >
                            {outlet.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 align-top">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-6 py-4 align-top text-sm text-slate-600">{formatDateTime(cashier.modifiedDate ?? cashier.createdDate)}</td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center justify-end gap-3 text-sm font-semibold">
                      <button
                        type="button"
                        onClick={() => handleView(cashier)}
                        className="text-slate-600 transition hover:text-slate-800"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(cashier)}
                        className="text-blue-600 transition hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRequest(cashier)}
                        className="text-rose-600 transition hover:text-rose-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8 pb-12">
        <AdminPageHeader
          title="Cashiers"
          description="Manage POS cashier accounts, access levels, and outlet assignments. Create user profiles to control register access and track activity."
        />

        {(alert || error) && (
          <ToastContainer>
            {alert ? (
              <Alert type={alert.type} title={alert.title} message={alert.message} onClose={() => setAlert(null)} />
            ) : null}
            {error ? <Alert type="error" title="Error" message={error} onClose={() => setError(null)} /> : null}
          </ToastContainer>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-xs text-slate-500 sm:text-sm whitespace-nowrap">
              {filteredCashiers.length === totalCashiers
                ? `Showing ${totalCashiers} cashier${totalCashiers === 1 ? '' : 's'}`
                : `Showing ${filteredCashiers.length} of ${totalCashiers} cashiers`}
              {` • ${activeCashiers} active`}
            </div>
            <div className="flex w-full flex-col items-stretch gap-3 md:flex-row md:justify-end md:gap-3">
              <div className="relative w-full md:max-w-xs">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search cashiers..."
                  className="h-10 w-full rounded-lg border border-slate-200 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button
                type="button"
                onClick={handleAddNew}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white md:w-auto"
              >
                Add cashier
              </button>
            </div>
          </div>
        </section>

        {loading ? renderLoadState() : filteredCashiers.length === 0 ? renderEmptyState() : renderTable()}
      </div>

      {showAddModal && (
        <AddCashierModal
          cashier={editingCashier}
          mode={modalMode ?? undefined}
          onClose={handleCloseModal}
          onSuccess={handleSaveSuccess}
        />
      )}

      <ConfirmationDialog
        open={deleteConfirm.show}
        title="Delete Cashier"
        message={`Are you sure you want to delete "${
          deleteConfirm.cashier?.name || deleteConfirm.cashier?.username || 'this cashier'
        }"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={handleDeleteCancel}
      />
    </AdminLayout>
  );
};

export default CashiersPage;
