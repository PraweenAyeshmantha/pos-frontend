import React, { useCallback, useEffect, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import Alert, { type AlertType } from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import { outletService } from '../../../services/outletService';
import type { Outlet, OutletMode } from '../../../types/outlet';
import AddOutletModal from '../../../components/admin/outlets/AddOutletModal';

const MODE_LABELS: Record<OutletMode, string> = {
  GROCERY_RETAIL: 'Grocery / Retail',
  RESTAURANT_CAFE: 'Restaurant / Cafe',
};

const formatMode = (mode: OutletMode): string => MODE_LABELS[mode] ?? mode;

const formatStatusLabel = (isActive: boolean): string => (isActive ? 'Enabled' : 'Disabled');

const OutletsPage: React.FC = () => {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
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
    setShowAddModal(true);
  }, []);

  const handleEdit = useCallback((outlet: Outlet) => {
    setEditingOutlet(outlet);
    setShowAddModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowAddModal(false);
    setEditingOutlet(null);
  }, []);

  const handleSaveSuccess = useCallback(
    (action: 'create' | 'update') => {
      setShowAddModal(false);
      setEditingOutlet(null);
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

  const filteredOutlets = outlets.filter((outlet) => {
    if (!searchQuery) {
      return true;
    }
    const query = searchQuery.toLowerCase();
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

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-100">
        <div className="mx-auto max-w-7xl px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-gray-800">Outlets</h1>
                <p className="mt-2 text-gray-600">
                  Manage your store locations, addresses, and outlet-specific settings.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddNew}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add New Outlet
              </button>
            </div>

            {/* Search Bar */}
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {filteredOutlets.length === outlets.length
                  ? `Showing ${outlets.length} outlet${outlets.length !== 1 ? 's' : ''}`
                  : `Showing ${filteredOutlets.length} of ${outlets.length} outlet${outlets.length !== 1 ? 's' : ''}`}
              </div>
              <input
                type="text"
                placeholder="Search by name, email, phone, mode, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-96 rounded-lg border border-gray-200 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6">
              <Alert type="error" title="Error" message={error} />
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading outlets...</p>
              </div>
            </div>
          )}

          {/* Outlets Table */}
          {!loading && (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Mode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Created At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Updated At
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredOutlets.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                          No outlets found. Click "Add New" to create your first outlet.
                        </td>
                      </tr>
                    ) : (
                      filteredOutlets.map((outlet) => (
                        <tr key={outlet.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{outlet.id}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{outlet.name}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{formatMode(outlet.mode)}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">
                              {outlet.address
                                ? outlet.address.split(',').map((segment, index) => (
                                    <div key={index}>{segment.trim()}</div>
                                  ))
                                : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{outlet.email}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{outlet.phone}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                outlet.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {formatStatusLabel(outlet.isActive)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {outlet.createdAt
                              ? new Date(outlet.createdAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {outlet.updatedAt
                              ? new Date(outlet.updatedAt).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(outlet)}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                                title="Edit outlet"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirm({ show: true, outlet })}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                                title="Delete outlet"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <AddOutletModal
          outlet={editingOutlet}
          onClose={handleCloseModal}
          onSuccess={handleSaveSuccess}
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
