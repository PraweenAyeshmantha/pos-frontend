import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import Alert, { type AlertType } from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import { outletService } from '../../../services/outletService';
import type { Outlet, OutletMode } from '../../../types/outlet';
import type { RecordStatus } from '../../../types/configuration';
import AddOutletModal from '../../../components/admin/outlets/AddOutletModal';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';

const MODE_LABELS: Record<OutletMode, string> = {
  GROCERY_RETAIL: 'Grocery / Retail',
  RESTAURANT_CAFE: 'Restaurant / Cafe',
};

const formatMode = (mode: OutletMode): string => MODE_LABELS[mode] ?? mode;

const formatStatusLabel = (recordStatus: RecordStatus): string => (recordStatus === 'ACTIVE' ? 'Enabled' : 'Disabled');

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

const OutletsPage: React.FC = () => {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; outlet: Outlet | null }>({
    show: false,
    outlet: null,
  });
  const [alert, setAlert] = useState<{ type: AlertType; title: string; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchOutlets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await outletService.getAll();
      setOutlets(data);
    } catch (err) {
      setError('Failed to load outlets. Please try again.');
      console.error('Error fetching outlets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOutlets();
  }, [fetchOutlets]);

  const handleAddNew = useCallback(() => {
    setEditingOutlet(null);
    setModalMode('create');
    setShowAddModal(true);
  }, []);

  const handleEdit = useCallback((outlet: Outlet) => {
    setEditingOutlet(outlet);
    setModalMode('edit');
    setShowAddModal(true);
  }, []);

  const handleView = useCallback((outlet: Outlet) => {
    setEditingOutlet(outlet);
    setModalMode('view');
    setShowAddModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowAddModal(false);
    setEditingOutlet(null);
    setModalMode('create');
  }, []);

  const handleSaveSuccess = useCallback(
    (action: 'create' | 'update') => {
      setShowAddModal(false);
      setEditingOutlet(null);
      setModalMode('create');
      setAlert({
        type: 'success',
        title: 'Success',
        message: action === 'update' ? 'Outlet updated successfully' : 'Outlet created successfully',
      });
      fetchOutlets();
      setTimeout(() => setAlert(null), 3000);
    },
    [fetchOutlets],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm.outlet) return;

    try {
      await outletService.delete(deleteConfirm.outlet.id);
      setAlert({
        type: 'success',
        title: 'Deleted',
        message: 'Outlet deleted successfully',
      });
      fetchOutlets();
      setTimeout(() => setAlert(null), 3000);
    } catch (err) {
      setAlert({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete outlet',
      });
      console.error('Error deleting outlet:', err);
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setDeleteConfirm({ show: false, outlet: null });
    }
  }, [deleteConfirm.outlet, fetchOutlets]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirm({ show: false, outlet: null });
  }, []);

  const filteredOutlets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return outlets;
    }

    return outlets.filter((outlet) => {
      const modeLabel = formatMode(outlet.mode).toLowerCase();
      const addressMatch = outlet.address?.toLowerCase().includes(query) ?? false;
      return (
        outlet.name.toLowerCase().includes(query) ||
        outlet.email.toLowerCase().includes(query) ||
        outlet.phone.includes(query) ||
        modeLabel.includes(query) ||
        addressMatch
      );
    });
  }, [outlets, searchQuery]);

  const totalOutlets = outlets.length;
  const activeOutlets = useMemo(
    () => outlets.filter((outlet) => outlet.recordStatus === 'ACTIVE').length,
    [outlets],
  );

  const handleDeleteRequest = useCallback((outlet: Outlet) => {
    setDeleteConfirm({ show: true, outlet });
  }, []);

  const renderLoadState = () => (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        <p className="mt-4 text-slate-600">Loading outlets...</p>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
      <div className="text-lg font-semibold">No outlets yet</div>
      <p className="mt-3 text-sm text-slate-500">
        {totalOutlets === 0
          ? 'Create your first outlet to configure registers, staff assignments, and reporting locations.'
          : 'Try a different search term to find the outlet you are looking for.'}
      </p>
      <button
        type="button"
        onClick={handleAddNew}
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Add outlet
      </button>
    </div>
  );

  const renderTable = () => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Mode</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Address</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Email</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Created</th>
              <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Updated</th>
              <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredOutlets.map((outlet) => (
              <tr key={outlet.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 align-top">
                  <span className="block text-sm font-semibold text-slate-900">{outlet.name}</span>
                </td>
                <td className="px-6 py-4 align-top text-sm text-slate-600">{formatMode(outlet.mode)}</td>
                <td className="px-6 py-4 align-top text-sm text-slate-600">
                  {outlet.address ? (
                    outlet.address.split(',').map((segment, index) => (
                      <div key={`${outlet.id}-address-${index}`}>{segment.trim()}</div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 align-top text-sm text-slate-600">{outlet.email}</td>
                <td className="px-6 py-4 align-top text-sm text-slate-600">{outlet.phone}</td>
                <td className="px-6 py-4 align-top">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      outlet.recordStatus === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {formatStatusLabel(outlet.recordStatus)}
                  </span>
                </td>
                <td className="px-6 py-4 align-top text-sm text-slate-500">{formatDateTime(outlet.createdAt)}</td>
                <td className="px-6 py-4 align-top text-sm text-slate-500">{formatDateTime(outlet.updatedAt)}</td>
                <td className="px-6 py-4 align-top">
                  <div className="flex items-center justify-end gap-3 text-sm font-semibold">
                    <button
                      type="button"
                      onClick={() => handleView(outlet)}
                      className="text-slate-600 transition hover:text-slate-800"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(outlet)}
                      className="text-blue-600 transition hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRequest(outlet)}
                      className="text-rose-600 transition hover:text-rose-700"
                    >
                      Delete
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
  <div className="flex flex-col gap-8 pb-12">
        <AdminPageHeader
          title="Outlets"
          description="Manage your store locations, addresses, and outlet-specific settings."
        />

        {error ? <Alert type="error" title="Error" message={error} /> : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="whitespace-nowrap text-xs text-slate-500 sm:text-sm">
              {filteredOutlets.length === totalOutlets
                ? `Showing ${totalOutlets} outlets`
                : `Showing ${filteredOutlets.length} of ${totalOutlets} outlets`}
              {` • ${activeOutlets} active`}
            </div>
            <div className="flex w-full flex-col items-stretch gap-3 md:flex-row md:justify-end md:gap-3">
              <div className="relative w-full md:max-w-xs">
                <input
                  type="text"
                  placeholder="Search outlets..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button
                type="button"
                onClick={handleAddNew}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white md:w-auto"
              >
                Add outlet
              </button>
            </div>
          </div>
        </section>

        {loading ? renderLoadState() : filteredOutlets.length === 0 ? renderEmptyState() : renderTable()}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <AddOutletModal
          outlet={editingOutlet}
          onClose={handleCloseModal}
          onSuccess={handleSaveSuccess}
          mode={modalMode}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={deleteConfirm.show}
        title="Delete Outlet"
        message={`Are you sure you want to delete "${deleteConfirm.outlet?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />

      {/* Alert Toast */}
      {alert && (
        <ToastContainer>
          <Alert type={alert.type} title={alert.title} message={alert.message} />
        </ToastContainer>
      )}
    </AdminLayout>
  );
};

export default OutletsPage;
