import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Alert, { type AlertType } from '../../common/Alert';
import ToastContainer from '../../common/ToastContainer';
import ConfirmationDialog from '../../common/ConfirmationDialog';
import AdminPageHeader from '../../layout/AdminPageHeader';
import TaxonomyFormModal from './TaxonomyFormModal';
import type { RecordStatus } from '../../../types/configuration';
import type { TaxonomyEntity, TaxonomyFormValues } from '../../../types/taxonomy';

interface TaxonomyManagerProps<T extends TaxonomyEntity> {
  title: string;
  entityName: string;
  description: string;
  fetchEntities: () => Promise<T[]>;
  createEntity: (payload: TaxonomyFormValues) => Promise<T>;
  updateEntity: (id: number, payload: TaxonomyFormValues) => Promise<T>;
  archiveEntity: (id: number) => Promise<void>;
}

const resolveErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    return data?.message ?? data?.error ?? fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message || fallbackMessage;
  }

  return fallbackMessage;
};

const formatStatusLabel = (recordStatus: RecordStatus): string =>
  recordStatus === 'ACTIVE' ? 'Active' : 'Inactive';

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

const TaxonomyManager = <T extends TaxonomyEntity>({
  title,
  entityName,
  description,
  fetchEntities,
  createEntity,
  updateEntity,
  archiveEntity,
}: TaxonomyManagerProps<T>) => {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [alert, setAlert] = useState<{ type: AlertType; title: string; message: string } | null>(null);
  const [archiveConfirm, setArchiveConfirm] = useState<{ open: boolean; item: T | null }>({ open: false, item: null });

  const showAlert = useCallback((nextAlert: { type: AlertType; title: string; message: string }) => {
    setAlert(nextAlert);
  }, []);

  const handleFetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEntities();
      setItems(data);
    } catch (err) {
      setLoadError(resolveErrorMessage(err, `Unable to load ${entityName.toLowerCase()}s.`));
    } finally {
      setLoading(false);
    }
  }, [entityName, fetchEntities]);

  useEffect(() => {
    void handleFetch();
  }, [handleFetch]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const sorted = [...items].sort((a, b) => a.name.localeCompare(b.name));
    if (!query) {
      return sorted;
    }
    return sorted.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(query);
      const descriptionMatch = (item.description ?? '').toLowerCase().includes(query);
      const statusMatch = formatStatusLabel(item.recordStatus).toLowerCase().includes(query);
      return nameMatch || descriptionMatch || statusMatch;
    });
  }, [items, searchQuery]);

  const totalItems = items.length;
  const activeItems = useMemo(() => items.filter((item) => item.recordStatus === 'ACTIVE').length, [items]);

  const handleAddNew = useCallback(() => {
    setEditingItem(null);
    setModalMode('create');
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((item: T) => {
    setEditingItem(item);
    setModalMode('edit');
    setModalOpen(true);
  }, []);

  const handleView = useCallback((item: T) => {
    setEditingItem(item);
    setModalMode('view');
    setModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setEditingItem(null);
    setModalMode('create');
  }, []);

  const handleModalSubmit = useCallback(
    async (values: TaxonomyFormValues) => {
      if (modalMode === 'view') return;

      if (editingItem) {
        const updated = await updateEntity(editingItem.id, values);
        setItems((prev) => prev.map((item) => (item.id === updated.id ? ({ ...item, ...updated }) as T : item)));
        showAlert({
          type: 'success',
          title: 'Saved',
          message: `${entityName} updated successfully.`,
        });
      } else {
        const created = await createEntity(values);
        setItems((prev) => [created as T, ...prev]);
        showAlert({
          type: 'success',
          title: 'Created',
          message: `${entityName} created successfully.`,
        });
      }
      setModalOpen(false);
      setEditingItem(null);
      setModalMode('create');
    },
    [createEntity, editingItem, entityName, modalMode, showAlert, updateEntity],
  );

  const handleArchiveRequest = useCallback((item: T) => {
    setArchiveConfirm({ open: true, item });
  }, []);

  const handleArchiveCancel = useCallback(() => {
    setArchiveConfirm({ open: false, item: null });
  }, []);

  const handleArchiveConfirm = useCallback(async () => {
    if (!archiveConfirm.item) {
      return;
    }

    try {
      await archiveEntity(archiveConfirm.item.id);
      setItems((prev) =>
        prev.map((item) =>
          item.id === archiveConfirm.item?.id ? ({ ...item, recordStatus: 'INACTIVE' } as T) : item,
        ),
      );
      showAlert({
        type: 'success',
        title: 'Updated',
        message: `${entityName} archived successfully.`,
      });
    } catch (err) {
      showAlert({
        type: 'error',
        title: 'Error',
        message: resolveErrorMessage(err, `Unable to archive ${entityName.toLowerCase()}.`),
      });
    } finally {
      setArchiveConfirm({ open: false, item: null });
    }
  }, [archiveConfirm.item, archiveEntity, entityName, showAlert]);

  const handleActivate = useCallback(
    async (item: T) => {
      try {
        const updated = await updateEntity(item.id, {
          name: item.name,
          description: item.description,
          recordStatus: 'ACTIVE',
        });
        setItems((prev) => prev.map((entry) => (entry.id === updated.id ? ({ ...entry, ...updated }) as T : entry)));
        showAlert({
          type: 'success',
          title: 'Activated',
          message: `${entityName} activated successfully.`,
        });
      } catch (err) {
        showAlert({
          type: 'error',
          title: 'Error',
          message: resolveErrorMessage(err, `Unable to activate ${entityName.toLowerCase()}.`),
        });
      }
    },
    [entityName, showAlert, updateEntity],
  );

  return (
    <div className="flex flex-col gap-8">
      <AdminPageHeader
        title={title}
        description={description}
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
          <div className="text-xs text-slate-500 sm:text-sm whitespace-nowrap">
            {filteredItems.length === totalItems
              ? `Showing ${totalItems} ${entityName.toLowerCase()}${totalItems === 1 ? '' : 's'}`
              : `Showing ${filteredItems.length} of ${totalItems} ${entityName.toLowerCase()}${totalItems === 1 ? '' : 's'}`}
            {` • ${activeItems} active`}
          </div>
          <div className="flex w-full flex-col items-stretch gap-3 md:flex-row md:justify-end md:gap-3">
            <div className="relative w-full md:max-w-xs">
              <input
                type="text"
                placeholder={`Search ${entityName.toLowerCase()}s...`}
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
              Add {entityName}
            </button>
          </div>
        </div>
      </section>      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
            <p className="mt-4 text-slate-600">Loading {entityName.toLowerCase()}s...</p>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
          <div className="text-lg font-semibold">No {entityName.toLowerCase()}s yet</div>
          <p className="mt-3 text-sm text-slate-500">
            {items.length === 0
              ? `Start by adding your first ${entityName.toLowerCase()} to keep your catalog organized.`
              : 'Try adjusting your search or filters to find what you need.'}
          </p>
          <button
            type="button"
            onClick={handleAddNew}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Add {entityName}
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Description
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
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.description ?? '-'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          item.recordStatus === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {formatStatusLabel(item.recordStatus)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDateTime(item.updatedAt ?? item.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-3 text-sm font-semibold">
                        <button
                          type="button"
                          onClick={() => handleView(item)}
                          className="text-slate-600 transition hover:text-slate-800"
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="text-blue-600 transition hover:text-blue-800"
                        >
                          Edit
                        </button>
                        {item.recordStatus === 'ACTIVE' ? (
                          <button
                            type="button"
                            onClick={() => handleArchiveRequest(item)}
                            className="text-rose-600 transition hover:text-rose-700"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleActivate(item)}
                            className="text-emerald-600 transition hover:text-emerald-700"
                          >
                            Activate
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
      )}

      <TaxonomyFormModal
        open={modalOpen}
        mode={modalMode}
        entityName={entityName}
        onClose={handleModalClose}
        initialValues={
          editingItem
            ? {
                name: editingItem.name,
                description: editingItem.description,
                recordStatus: editingItem.recordStatus,
              }
            : undefined
        }
        onSubmit={handleModalSubmit}
      />

      <ConfirmationDialog
        open={archiveConfirm.open}
        title={`Deactivate ${entityName}`}
        message={`This will mark the ${entityName.toLowerCase()} as inactive. Products can no longer use it until reactivated. Continue?`}
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
        onCancel={handleArchiveCancel}
        onConfirm={handleArchiveConfirm}
      />
    </div>
  );
};

export default TaxonomyManager;
