import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import ToastContainer from '../../../components/common/ToastContainer';
import Alert, { type AlertType } from '../../../components/common/Alert';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import { userService } from '../../../services/userService';
import { outletService } from '../../../services/outletService';
import type { UserAccount, UserFormValues, CreateUserRequestPayload, UpdateUserRequestPayload } from '../../../types/user';
import type { UserCategory } from '../../../types/auth';
import type { Outlet } from '../../../types/outlet';
import type { RecordStatus } from '../../../types/configuration';

const emptyFormValues: UserFormValues = {
  name: '',
  username: '',
  email: '',
  phone: '',
  password: '',
  requirePasswordReset: true,
  recordStatus: 'ACTIVE' as RecordStatus,
  categoryCodes: [],
  assignedOutletIds: [],
  defaultOutletId: null,
};

const DEFAULT_BRANCH_ROLES = new Set(['CASHIER', 'MANAGER']);

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: AlertType; title: string; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<{ open: boolean; user: UserAccount | null }>({
    open: false,
    user: null,
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users', err);
      setLoadError('Unable to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) {
      return users;
    }
    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(keyword) ||
        user.username.toLowerCase().includes(keyword) ||
        (user.email ?? '').toLowerCase().includes(keyword) ||
        (user.phone ?? '').toLowerCase().includes(keyword)
      );
    });
  }, [searchTerm, users]);

  const handleCreate = useCallback(() => {
    setModalMode('create');
    setEditingUser(null);
    setShowModal(true);
  }, []);

  const handleEdit = useCallback((user: UserAccount) => {
    setModalMode('edit');
    setEditingUser(user);
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingUser(null);
  }, []);

  const handleDeactivateRequest = useCallback((user: UserAccount) => {
    setConfirmDeactivate({ open: true, user });
  }, []);

  const handleDeactivateCancel = useCallback(() => {
    setConfirmDeactivate({ open: false, user: null });
  }, []);

  const handleDeactivateConfirm = useCallback(async () => {
    if (!confirmDeactivate.user) {
      return;
    }
    try {
      await userService.deactivate(confirmDeactivate.user.id);
      setAlert({ type: 'success', title: 'Saved', message: 'User deactivated successfully.' });
      void fetchUsers();
    } catch (err) {
      console.error('Failed to deactivate user', err);
      setAlert({ type: 'error', title: 'Error', message: 'Unable to deactivate user.' });
    } finally {
      setConfirmDeactivate({ open: false, user: null });
    }
  }, [confirmDeactivate.user, fetchUsers]);

  const handleSaveSuccess = useCallback((message: string) => {
    setShowModal(false);
    setEditingUser(null);
    setAlert({ type: 'success', title: 'Success', message });
    void fetchUsers();
  }, [fetchUsers]);

  const activeUsers = useMemo(() => users.filter((user) => user.recordStatus === 'ACTIVE').length, [users]);

  const renderLoadState = () => (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        <p className="mt-4 text-sm text-slate-600">Loading users...</p>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-600">
      {loadError}
    </div>
  );

  const renderEmptyState = () => (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
      <div className="text-lg font-semibold">No users found</div>
      <p className="mt-3 text-sm text-slate-500">
        {users.length === 0 ? 'Create your first user to get started.' : 'Try a different search or clear filters.'}
      </p>
      <button
        type="button"
        onClick={handleCreate}
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        + New User
      </button>
    </div>
  );

  const renderTable = () => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Categories</th>
              <th className="px-6 py-3">Branches</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.username}</div>
                  {user.email ? <div className="text-xs text-slate-500">{user.email}</div> : null}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {user.categories.map((category) => (
                      <span
                        key={category.id}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                      >
                        {category.categoryName}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {user.assignedOutlets.length === 0 ? (
                    <span className="text-xs text-slate-400">—</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {user.assignedOutlets.map((outlet) => (
                        <span key={outlet.id} className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                          {outlet.name}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      user.recordStatus === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {user.recordStatus === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(user)}
                      className="inline-flex items-center rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeactivateRequest(user)}
                      className="inline-flex items-center rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                    >
                      Deactivate
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
        <AdminPageHeader title="Users" description="Create users, assign categories, and control branch access." />

        {(alert || loadError) && (
          <ToastContainer>
            {alert ? (
              <Alert type={alert.type} title={alert.title} message={alert.message} onClose={() => setAlert(null)} />
            ) : null}
            {loadError ? (
              <Alert type="error" title="Users" message={loadError} onClose={() => setLoadError(null)} />
            ) : null}
          </ToastContainer>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="search"
                  placeholder="Search by name, username, email, or phone"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <span className="text-sm text-slate-600 md:pl-4">
                Showing {filteredUsers.length} users • {activeUsers} active
              </span>
            </div>
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              + New User
            </button>
          </div>
        </section>

        {loading ? renderLoadState() : loadError ? renderErrorState() : filteredUsers.length === 0 ? renderEmptyState() : renderTable()}
      </div>

      {showModal && (
        <UserModal
          mode={modalMode}
          user={editingUser}
          onClose={handleCloseModal}
          onSuccess={handleSaveSuccess}
        />
      )}

      {confirmDeactivate.open && confirmDeactivate.user ? (
        <ConfirmationDialog
          open={confirmDeactivate.open}
          title="Deactivate user"
          message={`Deactivate "${confirmDeactivate.user.name}"? They will no longer be able to sign in.`}
          confirmLabel="Deactivate"
          cancelLabel="Cancel"
          onCancel={handleDeactivateCancel}
          onConfirm={handleDeactivateConfirm}
        />
      ) : null}
    </AdminLayout>
  );
};

interface UserModalProps {
  mode: 'create' | 'edit';
  user: UserAccount | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const UserModal: React.FC<UserModalProps> = ({ mode, user, onClose, onSuccess }) => {
  const [formValues, setFormValues] = useState<UserFormValues>(() =>
    user ? mapUserToForm(user) : { ...emptyFormValues },
  );
  const [categories, setCategories] = useState<UserCategory[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoryData, outletData] = await Promise.all([userService.getCategories(), outletService.getAll()]);
        setCategories(categoryData);
        setOutlets(outletData);
      } catch (err) {
        console.error('Failed to load dropdown data', err);
        setError('Unable to load lookup data. Please reopen the form.');
      }
    };
    void loadData();
  }, []);

  useEffect(() => {
    setFormValues(user ? mapUserToForm(user) : { ...emptyFormValues });
    setError(null);
  }, [user]);

  const branchSelectionEnabled = useMemo(
    () => formValues.categoryCodes.some((code) => DEFAULT_BRANCH_ROLES.has(code)),
    [formValues.categoryCodes],
  );

  const availableDefaultOutlets = useMemo(() => {
    if (!branchSelectionEnabled) {
      return [];
    }
    return outlets.filter((outlet) => formValues.assignedOutletIds.includes(outlet.id));
  }, [branchSelectionEnabled, formValues.assignedOutletIds, outlets]);

  const handleFieldChange = useCallback(<K extends keyof UserFormValues>(field: K, value: UserFormValues[K]) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleCategoryToggle = useCallback((code: string) => {
    setFormValues((prev) => {
      const normalized = code.toUpperCase();
      const exists = prev.categoryCodes.includes(normalized);
      const nextCategories = exists
        ? prev.categoryCodes.filter((item) => item !== normalized)
        : [...prev.categoryCodes, normalized];

      const shouldClearBranches =
        !nextCategories.some((item) => DEFAULT_BRANCH_ROLES.has(item)) && prev.assignedOutletIds.length > 0;

      return {
        ...prev,
        categoryCodes: nextCategories,
        assignedOutletIds: shouldClearBranches ? [] : prev.assignedOutletIds,
        defaultOutletId: shouldClearBranches ? null : prev.defaultOutletId,
      };
    });
  }, []);

  const handleOutletToggle = useCallback((id: number) => {
    setFormValues((prev) => {
      const exists = prev.assignedOutletIds.includes(id);
      const assignedOutletIds = exists
        ? prev.assignedOutletIds.filter((outletId) => outletId !== id)
        : [...prev.assignedOutletIds, id];
      const defaultOutletId =
        prev.defaultOutletId && assignedOutletIds.includes(prev.defaultOutletId)
          ? prev.defaultOutletId
          : (assignedOutletIds[0] ?? null);
      return {
        ...prev,
        assignedOutletIds,
        defaultOutletId,
      };
    });
  }, []);

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!formValues.name.trim() || !formValues.username.trim()) {
      setError('Name and username are required.');
      return;
    }

    if (mode === 'create' && !formValues.password.trim()) {
      setError('Password is required when creating a user.');
      return;
    }

    if (!formValues.categoryCodes.length) {
      setError('Select at least one user category.');
      return;
    }

    if (branchSelectionEnabled && formValues.assignedOutletIds.length === 0) {
      setError('Assign at least one outlet to cashier or manager users.');
      return;
    }

    setSaving(true);
    try {
      if (mode === 'create') {
        const payload: CreateUserRequestPayload = {
          name: formValues.name.trim(),
          username: formValues.username.trim(),
          email: formValues.email.trim() || undefined,
          phone: formValues.phone.trim() || undefined,
          password: formValues.password,
          requirePasswordReset: formValues.requirePasswordReset,
          recordStatus: formValues.recordStatus,
          categoryCodes: formValues.categoryCodes,
          assignedOutletIds: branchSelectionEnabled ? formValues.assignedOutletIds : [],
          defaultOutletId: branchSelectionEnabled ? formValues.defaultOutletId : null,
        };
        await userService.create(payload);
        onSuccess('User created successfully.');
      } else if (user) {
        const payload: UpdateUserRequestPayload = {
          id: user.id,
          name: formValues.name.trim(),
          username: formValues.username.trim(),
          email: formValues.email.trim() || undefined,
          phone: formValues.phone.trim() || undefined,
          password: formValues.password.trim() ? formValues.password : undefined,
          requirePasswordReset: formValues.requirePasswordReset,
          recordStatus: formValues.recordStatus,
          categoryCodes: formValues.categoryCodes,
          assignedOutletIds: branchSelectionEnabled ? formValues.assignedOutletIds : [],
          defaultOutletId: branchSelectionEnabled ? formValues.defaultOutletId : null,
        };
        await userService.update(payload);
        onSuccess('User updated successfully.');
      }
    } catch (err) {
      console.error('Failed to save user', err);
      setError('Unable to save user. Verify the details and try again.');
    } finally {
      setSaving(false);
    }
  }, [branchSelectionEnabled, formValues, mode, onSuccess, user]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/40 px-4 py-8">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {mode === 'create' ? 'Create User' : `Edit ${user?.name}`}
            </h2>
            <p className="text-sm text-slate-500">
              {mode === 'create' ? 'Set up a new user account.' : 'Update user details and access.'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto px-6 py-4 space-y-6">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Full Name
              <input
                type="text"
                value={formValues.name}
                onChange={(event) => handleFieldChange('name', event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Username
              <input
                type="text"
                value={formValues.username}
                onChange={(event) => handleFieldChange('username', event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                value={formValues.email}
                onChange={(event) => handleFieldChange('email', event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Phone
              <input
                type="tel"
                value={formValues.phone}
                onChange={(event) => handleFieldChange('phone', event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Password {mode === 'edit' && <span className="text-xs text-slate-400">(leave blank to keep current)</span>}
              <input
                type="password"
                value={formValues.password}
                onChange={(event) => handleFieldChange('password', event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Status
              <select
                value={formValues.recordStatus}
                onChange={(event) => handleFieldChange('recordStatus', event.target.value as RecordStatus)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>
          </div>

          <div className="border-t pt-4">
            <div className="text-sm font-semibold text-slate-700">Categories</div>
            <p className="text-xs text-slate-500">Select one or more categories for this user.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategoryToggle(category.categoryCode)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    formValues.categoryCodes.includes(category.categoryCode)
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {category.categoryName}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={formValues.requirePasswordReset}
                onChange={(event) => handleFieldChange('requirePasswordReset', event.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Require password reset at next login
            </label>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-700">Branch Access</div>
                <p className="text-xs text-slate-500">
                  {branchSelectionEnabled
                    ? 'Select the outlets this user can access.'
                    : 'Assign cashier or manager roles to enable branch selection.'}
                </p>
              </div>
            </div>

            <div className="mt-3 grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded border border-slate-200 p-3 text-sm">
              {outlets.map((outlet) => {
                const checked = formValues.assignedOutletIds.includes(outlet.id);
                return (
                  <label
                    key={outlet.id}
                    className={`flex items-center gap-2 rounded p-2 ${
                      branchSelectionEnabled
                        ? checked
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-slate-50'
                        : 'opacity-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={!branchSelectionEnabled}
                      checked={checked}
                      onChange={() => handleOutletToggle(outlet.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="truncate">{outlet.name}</span>
                  </label>
                );
              })}
            </div>

            {branchSelectionEnabled && availableDefaultOutlets.length > 0 && (
              <label className="mt-3 block text-sm font-medium text-slate-700">
                Default Outlet
                <select
                  value={formValues.defaultOutletId ?? ''}
                  onChange={(event) =>
                    handleFieldChange('defaultOutletId', event.target.value ? Number(event.target.value) : null)
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {availableDefaultOutlets.map((outlet) => (
                    <option key={outlet.id} value={outlet.id}>
                      {outlet.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : mode === 'create' ? 'Create User' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const mapUserToForm = (user: UserAccount): UserFormValues => ({
  name: user.name,
  username: user.username,
  email: user.email ?? '',
  phone: user.phone ?? '',
  password: '',
  requirePasswordReset: user.requirePasswordReset,
  recordStatus: user.recordStatus,
  categoryCodes: user.categories.map((category) => category.categoryCode.toUpperCase()),
  assignedOutletIds: user.assignedOutlets.map((outlet) => outlet.id),
  defaultOutletId: user.defaultOutlet?.id ?? null,
});

export default UsersPage;
