import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import Alert, { type AlertType } from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import AddCustomerModal from '../../../components/admin/customers/AddCustomerModal';
import EditCustomerModal from '../../../components/admin/customers/EditCustomerModal';
import { customerService } from '../../../services/customerService';
import type { Customer } from '../../../types/customer';

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

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [alert, setAlert] = useState<{ type: AlertType; title: string; message: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [modalMode, setModalMode] = useState<'edit' | 'view' | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; customer: Customer | null }>({
    open: false,
    customer: null,
  });

  const showToast = useCallback((type: AlertType, title: string, message: string) => {
    setAlert({ type, title, message });
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
      setLoadError('Failed to load customers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  const handleCustomerCreated = useCallback(
    (customer: Customer) => {
      setCustomers((prev) => {
        const remaining = prev.filter((existing) => existing.id !== customer.id);
        return [customer, ...remaining];
      });
      setLoadError(null);
      setShowAddModal(false);
      showToast('success', 'Customer Created', `${customer.name} added successfully`);
    },
    [showToast],
  );

  const handleEdit = useCallback((customer: Customer) => {
    setEditingCustomer(customer);
    setModalMode('edit');
  }, []);

  const handleEditClose = useCallback(() => {
    setEditingCustomer(null);
    setModalMode(null);
  }, []);

  const handleView = useCallback((customer: Customer) => {
    setEditingCustomer(customer);
    setModalMode('view');
  }, []);

  const handleViewClose = useCallback(() => {
    setEditingCustomer(null);
    setModalMode(null);
  }, []);

  const handleCustomerUpdated = useCallback(
    (customer: Customer) => {
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? customer : c))
      );
      setEditingCustomer(null);
      setModalMode(null);
      showToast('success', 'Customer Updated', `${customer.name} updated successfully`);
    },
    [showToast],
  );

  const handleDeleteRequest = useCallback((customer: Customer) => {
    setDeleteConfirm({ open: true, customer });
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirm({ open: false, customer: null });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm.customer) return;

    try {
      await customerService.delete(deleteConfirm.customer.id);
      setCustomers((prev) => prev.filter((c) => c.id !== deleteConfirm.customer?.id));
      showToast('success', 'Customer Deleted', `${deleteConfirm.customer.name} has been removed`);
      setDeleteConfirm({ open: false, customer: null });
    } catch (err) {
      console.error('Failed to delete customer:', err);
      showToast('error', 'Delete Failed', 'Unable to delete customer. Please try again.');
    }
  }, [deleteConfirm.customer, showToast]);

  const handleCreateClick = useCallback(() => {
    setShowAddModal(true);
  }, []);

  const matchesQuery = useCallback(
    (customer: Customer): boolean => {
      if (!searchQuery.trim()) {
        return true;
      }
      const query = searchQuery.toLowerCase();
      return (
        customer.name.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query) ||
        false
      );
    },
    [searchQuery],
  );

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((customer) => matchesQuery(customer))
      .sort((a, b) => {
        const bTimestamp = resolveTimestamp(b.updatedAt ?? b.createdAt);
        const aTimestamp = resolveTimestamp(a.updatedAt ?? a.createdAt);
        return bTimestamp - aTimestamp;
      });
  }, [customers, matchesQuery]);

  const totalCustomers = customers.length;
  const activeCustomers = useMemo(() => customers.filter((customer) => customer.recordStatus === 'ACTIVE').length, [customers]);

  const renderLoadState = () => (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        <p className="mt-4 text-slate-600">Loading customers...</p>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
      <div className="text-lg font-semibold">No customers yet</div>
      <p className="mt-3 text-sm text-slate-500">
        {totalCustomers === 0
          ? 'Add your first customer to start building lasting relationships with your shoppers.'
          : 'Try a different search term to find the customer you are looking for.'}
      </p>
      <button
        type="button"
        onClick={handleCreateClick}
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Add customer
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
                Customer
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Phone
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Loyalty Points
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
            {filteredCustomers.map((customer) => {
              const statusBadgeClass = customer.recordStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700';
              const statusLabel = customer.recordStatus === 'ACTIVE' ? 'Active' : 'Inactive';
              
              return (
                <tr key={customer.id} className="transition hover:bg-slate-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{customer.name}</div>
                        <div className="text-xs text-slate-500">ID: {customer.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                    {customer.email || '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                    {customer.phone || '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-700">
                    {customer.loyaltyPoints || 0}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass}`}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                    {formatDateTime(customer.updatedAt ?? customer.createdAt)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleView(customer)}
                        className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(customer)}
                        className="inline-flex items-center rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRequest(customer)}
                        className="inline-flex items-center rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
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
          title="Customers"
          description="Build lasting relationships with a unified view of your shoppers and their visits."
        />

        {(alert || loadError) && (
          <ToastContainer>
            {alert ? (
              <Alert
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onClose={() => setAlert(null)}
              />
            ) : null}
            {loadError ? (
              <Alert
                type="error"
                title="Error"
                message={loadError}
                onClose={() => setLoadError(null)}
              />
            ) : null}
          </ToastContainer>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
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
                  type="text"
                  placeholder="Search Customer by name, email or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <span className="whitespace-nowrap text-sm text-slate-600">
                Showing {filteredCustomers.length} customers • {activeCustomers} active
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCreateClick}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white md:w-auto"
              >
                Add customer
              </button>
            </div>
          </div>
        </section>

        {loading ? renderLoadState() : filteredCustomers.length === 0 ? renderEmptyState() : renderTable()}

        {showAddModal ? (
          <AddCustomerModal
            onClose={() => setShowAddModal(false)}
            onSuccess={handleCustomerCreated}
          />
        ) : null}

        {editingCustomer && modalMode ? (
          <EditCustomerModal
            customer={editingCustomer}
            onClose={modalMode === 'view' ? handleViewClose : handleEditClose}
            onSuccess={modalMode === 'view' ? () => undefined : handleCustomerUpdated}
            mode={modalMode}
          />
        ) : null}

        {deleteConfirm.open && deleteConfirm.customer ? (
          <ConfirmationDialog
            open={deleteConfirm.open}
            title="Delete Customer"
            message={`Are you sure you want to delete "${deleteConfirm.customer.name}"? This action cannot be undone.`}
            confirmLabel="Delete"
            cancelLabel="Cancel"
            onConfirm={handleDeleteConfirm}
            onCancel={handleDeleteCancel}
          />
        ) : null}
      </div>
    </AdminLayout>
  );
};

export default CustomersPage;
