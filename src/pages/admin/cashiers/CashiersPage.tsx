import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import Alert, { type AlertType } from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import AddCashierModal from '../../../components/admin/cashiers/AddCashierModal';
import { cashierService } from '../../../services/cashierService';
import type { Cashier } from '../../../types/cashier';
import type { RecordStatus } from '../../../types/configuration';

const ROLE_LABELS: Record<string, string> = {
  POS_CASHIER: 'POS Cashier',
  ADMINISTRATOR: 'Administrator',
};

const formatRoleLabel = (role: Cashier['role']): string => ROLE_LABELS[role] ?? role;

const formatStatusLabel = (recordStatus: RecordStatus): string => (recordStatus === 'ACTIVE' ? 'Active' : 'Inactive');

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
      const roleMatch = formatRoleLabel(cashier.role).toLowerCase().includes(query);
      const outletMatch = cashier.assignedOutlets.some((outlet) => outlet.name.toLowerCase().includes(query));
      return (
        cashier.username.toLowerCase().includes(query) ||
        cashier.name.toLowerCase().includes(query) ||
        (cashier.email ?? '').toLowerCase().includes(query) ||
        (cashier.phone ?? '').toLowerCase().includes(query) ||
        roleMatch ||
        outletMatch
      );
    });
  }, [cashiers, searchQuery]);

  const handleAddNew = useCallback(() => {
    setEditingCashier(null);
    setShowAddModal(true);
  }, []);

  const handleEdit = useCallback((cashier: Cashier) => {
    setEditingCashier(cashier);
    setShowAddModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowAddModal(false);
    setEditingCashier(null);
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
      setTimeout(() => setAlert(null), 3000);
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
      setTimeout(() => setAlert(null), 3000);
    }
  }, [deleteConfirm.cashier, fetchCashiers]);

  const handleDeleteRequest = useCallback((cashier: Cashier) => {
    setDeleteConfirm({ show: true, cashier });
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirm({ show: false, cashier: null });
  }, []);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-100">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <header className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-gray-800">Cashiers</h1>
                <p className="mt-2 max-w-2xl text-gray-600">
                  Manage POS cashier accounts, access levels, and outlet assignments.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddNew}
                className="self-start rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Add Cashier
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-600">
                {filteredCashiers.length === cashiers.length
                  ? `Showing ${cashiers.length} cashier${cashiers.length === 1 ? '' : 's'}`
                  : `Showing ${filteredCashiers.length} of ${cashiers.length} cashiers`}
              </div>
              <input
                type="text"
                placeholder="Search by name, username, email, phone, role, or outlet..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-10 w-full max-w-md rounded-lg border border-gray-200 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </header>

          {error && (
            <div className="mb-6">
              <Alert type="error" title="Error" message={error} />
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
                <p className="mt-4 text-gray-600">Loading cashiers...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">ID</th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Username</th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Name</th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Email</th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Phone</th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Role</th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Assigned Outlets</th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Created</th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Updated</th>
                      <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredCashiers.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="px-6 py-12 text-center text-sm text-gray-500">
                          No cashiers found. Click "Add Cashier" to create one.
                        </td>
                      </tr>
                    ) : (
                      filteredCashiers.map((cashier) => (
                        <tr key={cashier.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{cashier.id}</td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{cashier.username}</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{cashier.name || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{cashier.email || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{cashier.phone || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{formatRoleLabel(cashier.role)}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div className="flex flex-wrap gap-2">
                              {cashier.assignedOutlets.length === 0 ? (
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">
                                  No outlets
                                </span>
                              ) : (
                                cashier.assignedOutlets.map((outlet) => (
                                  <span
                                    key={outlet.id}
                                    className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                                  >
                                    {outlet.name}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                cashier.recordStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {formatStatusLabel(cashier.recordStatus)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(cashier.createdAt)}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(cashier.updatedAt)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleEdit(cashier)}
                                className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRequest(cashier)}
                                className="text-sm font-semibold text-red-600 transition hover:text-red-700"
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

      {showAddModal && (
        <AddCashierModal cashier={editingCashier} onClose={handleCloseModal} onSuccess={handleSaveSuccess} />
      )}

      <ConfirmationDialog
        open={deleteConfirm.show}
        title="Delete Cashier"
        message={`Are you sure you want to delete "${
          deleteConfirm.cashier?.name || deleteConfirm.cashier?.username || 'this cashier'
        }"?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={handleDeleteCancel}
      />

      {alert && (
        <ToastContainer>
          <Alert type={alert.type} title={alert.title} message={alert.message} />
        </ToastContainer>
      )}
    </AdminLayout>
  );
};

export default CashiersPage;
