import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import Alert, { type AlertType } from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import { outletService } from '../../../services/outletService';
import { tableService } from '../../../services/tableService';
import type { Outlet } from '../../../types/outlet';
import type { TableStatus } from '../../../types/table';
import type { RecordStatus } from '../../../types/configuration';

interface TableRow {
  id?: number;
  name: string;
  slug: string;
  capacity: string;
  recordStatus: RecordStatus;
  status: TableStatus;
  outletId: number;
  slugEdited: boolean;
}

const statusOptions: Array<{ label: string; value: RecordStatus }> = [
  { label: 'Enabled', value: 'ACTIVE' },
  { label: 'Disabled', value: 'INACTIVE' },
];

const defaultTableStatus: TableStatus = 'AVAILABLE';

const TablesPage: React.FC = () => {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<number | ''>('');
  const [tables, setTables] = useState<TableRow[]>([]);
  const [initialTables, setInitialTables] = useState<Map<number, TableRow>>(new Map());
  const [deletedTableIds, setDeletedTableIds] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: AlertType; title: string; message: string } | null>(null);

  const totalTables = tables.length;
  const activeTables = useMemo(() => tables.filter((table) => table.recordStatus === 'ACTIVE').length, [tables]);

  const restaurantOutlets = useMemo(
    () => outlets.filter((outlet) => outlet.mode === 'RESTAURANT_CAFE'),
    [outlets],
  );

  const slugify = useCallback((value: string): string => {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }, []);

  const showAlert = useCallback((type: AlertType, title: string, message: string) => {
    setAlert({ type, title, message });
  }, []);

  const handleOutletChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedOutletId(value ? Number(value) : '');
    setTables([]);
    setInitialTables(new Map());
    setDeletedTableIds([]);
    setError(null);
  }, []);

  const fetchOutlets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await outletService.getAll();
      setOutlets(data);
    } catch (err) {
      console.error('Failed to load outlets', err);
      setError('Failed to load outlets. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTables = useCallback(async () => {
    if (!selectedOutletId) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await tableService.getAll(selectedOutletId);
      const rows = data.map((table) => ({
        id: table.id,
        name: table.tableNumber,
        slug: table.tableNumber,
        capacity: String(table.capacity ?? ''),
        recordStatus: table.recordStatus,
        status: table.status ?? defaultTableStatus,
        outletId: table.outlet?.id ?? selectedOutletId,
        slugEdited: false,
      }));
      setTables(rows);
      const initialMap = new Map<number, TableRow>();
      rows.forEach((row) => {
        if (row.id) {
          initialMap.set(row.id, { ...row });
        }
      });
      setInitialTables(initialMap);
    } catch (err) {
      console.error('Failed to load tables', err);
      setError('Failed to load tables. Please try again.');
      setTables([]);
      setInitialTables(new Map());
    } finally {
      setLoading(false);
    }
  }, [selectedOutletId]);

  useEffect(() => {
    fetchOutlets();
  }, [fetchOutlets]);

  useEffect(() => {
    if (selectedOutletId) {
      fetchTables();
    }
  }, [selectedOutletId, fetchTables]);

  const handleNameChange = useCallback(
    (index: number, value: string) => {
      setTables((prev) => {
        const updated = [...prev];
        const current = { ...updated[index] };
        const previousSlug = current.slug;
        const autoSlug = slugify(current.name);
        const newAutoSlug = slugify(value);
        current.name = value;
        if (!current.slugEdited && previousSlug === autoSlug) {
          current.slug = newAutoSlug;
        }
        updated[index] = current;
        return updated;
      });
    },
    [slugify],
  );

  const handleSlugChange = useCallback((index: number, value: string) => {
    setTables((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        slug: value,
        slugEdited: true,
      };
      return updated;
    });
  }, []);

  const handleCapacityChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) {
      return;
    }
    setTables((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        capacity: value,
      };
      return updated;
    });
  }, []);

  const handleStatusChange = useCallback((index: number, value: string) => {
    const recordStatus: RecordStatus = value === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
    setTables((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        recordStatus,
      };
      return updated;
    });
  }, []);

  const handleDeleteRow = useCallback(
    (index: number) => {
      setTables((prev) => {
        const updated = [...prev];
        const [removed] = updated.splice(index, 1);
        if (removed?.id) {
          setDeletedTableIds((ids) => Array.from(new Set([...ids, removed.id as number])));
        }
        return updated;
      });
    },
    [],
  );

  const handleAddRow = useCallback(() => {
    if (!selectedOutletId) {
      showAlert('warning', 'Select Outlet', 'Choose a restaurant outlet before adding tables.');
      return;
    }

    setTables((prev) => [
      ...prev,
      {
        name: '',
        slug: '',
        capacity: '',
        recordStatus: 'ACTIVE',
        status: defaultTableStatus,
        outletId: Number(selectedOutletId),
        slugEdited: false,
      },
    ]);
  }, [selectedOutletId, showAlert]);

  const validateRows = useCallback(() => {
    if (!selectedOutletId) {
      showAlert('warning', 'Select Outlet', 'Choose a restaurant outlet before saving changes.');
      return false;
    }

    for (const table of tables) {
      if (!table.name.trim()) {
        showAlert('error', 'Validation Error', 'Each table must have a name.');
        return false;
      }
      if (!table.slug.trim()) {
        showAlert('error', 'Validation Error', 'Each table must have a slug.');
        return false;
      }
      if (!table.capacity.trim() || Number(table.capacity) <= 0) {
        showAlert('error', 'Validation Error', 'Number of seats must be a positive value.');
        return false;
      }
    }

    return true;
  }, [selectedOutletId, tables, showAlert]);

  const getChangedRows = useCallback(() => {
    const changed: TableRow[] = [];
    tables.forEach((row) => {
      if (!row.id) {
        return;
      }
      const original = initialTables.get(row.id);
      if (!original) {
        changed.push(row);
        return;
      }
      if (
        original.name !== row.name ||
        original.slug !== row.slug ||
        original.capacity !== row.capacity ||
        original.recordStatus !== row.recordStatus
      ) {
        changed.push(row);
      }
    });
    return changed;
  }, [initialTables, tables]);

  const handleSaveChanges = useCallback(async () => {
    if (!validateRows()) {
      return;
    }

    const newRows = tables.filter((table) => !table.id);
    const updatedRows = getChangedRows();

    if (!newRows.length && !updatedRows.length && !deletedTableIds.length) {
      showAlert('info', 'No Changes', 'There are no new updates to save.');
      return;
    }

    try {
      setSaving(true);
      await Promise.all(
        deletedTableIds.map(async (id) => {
          await tableService.delete(id);
        }),
      );

      await Promise.all(
        newRows.map(async (table) => {
          await tableService.create({
            outletId: table.outletId,
            tableNumber: table.slug.trim() || slugify(table.name),
            capacity: Number(table.capacity),
            status: table.status,
            recordStatus: table.recordStatus,
          });
        }),
      );

      await Promise.all(
        updatedRows.map(async (table) => {
          if (!table.id) {
            return;
          }
          await tableService.update({
            id: table.id,
            tableNumber: table.slug.trim() || slugify(table.name),
            capacity: Number(table.capacity),
            status: table.status,
            recordStatus: table.recordStatus,
          });
        }),
      );

      showAlert('success', 'Changes Saved', 'Dining tables updated successfully.');
      setDeletedTableIds([]);
      fetchTables();
    } catch (err) {
      console.error('Failed to save tables', err);
      showAlert('error', 'Save Failed', 'Unable to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [deletedTableIds, fetchTables, getChangedRows, showAlert, slugify, tables, validateRows]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
            <p className="mt-4 text-slate-600">Loading tables...</p>
          </div>
        </div>
      );
    }

    if (!restaurantOutlets.length) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
          <div className="text-lg font-semibold">No restaurant outlets found</div>
          <p className="mt-3 text-sm text-slate-500">
            Create a restaurant outlet before configuring tables.
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Number of Seats
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {tables.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No tables yet. Use "Add Row" to create your first table.
                  </td>
                </tr>
              ) : (
                tables.map((table, index) => (
                  <tr key={table.id ?? `new-${index}`} className="hover:bg-slate-50">
                    <td className="px-6 py-4 align-top">
                      <input
                        type="text"
                        value={table.name}
                        onChange={(event) => handleNameChange(index, event.target.value)}
                        placeholder="Table 1"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </td>
                    <td className="px-6 py-4 align-top">
                      <input
                        type="text"
                        value={table.slug}
                        onChange={(event) => handleSlugChange(index, event.target.value)}
                        placeholder="table-1"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </td>
                    <td className="px-6 py-4 align-top">
                      <input
                        type="text"
                        value={table.capacity}
                        onChange={(event) => handleCapacityChange(index, event.target.value)}
                        placeholder="4"
                        inputMode="numeric"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </td>
                    <td className="px-6 py-4 align-top">
                      <select
                        value={table.recordStatus}
                        onChange={(event) => handleStatusChange(index, event.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.label} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right align-top">
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(index)}
                        className="inline-flex items-center rounded-md border border-transparent bg-red-100 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-600"
          >
            Add Row
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={saving}
            className="inline-flex items-center rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8 pb-12">
        <AdminPageHeader
          title="Tables"
          description="Configure dining tables for your restaurant outlets. Table numbers must be unique per outlet, and each table should reflect its seating capacity."
        />

          {(alert || error) && (
            <ToastContainer>
              {alert ? (
                <Alert
                  type={alert.type}
                  title={alert.title}
                  message={alert.message}
                  onClose={() => setAlert(null)}
                />
              ) : null}
              {error ? (
                <Alert
                  type="error"
                  title="Error"
                  message={error}
                  onClose={() => setError(null)}
                />
              ) : null}
            </ToastContainer>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="text-xs text-slate-500 sm:text-sm whitespace-nowrap">
                {selectedOutletId && totalTables > 0
                  ? `Showing ${totalTables} table${totalTables === 1 ? '' : 's'} • ${activeTables} active`
                  : selectedOutletId
                  ? 'No tables yet'
                  : 'Select an outlet to view tables'}
              </div>
              <div className="flex w-full flex-col items-stretch gap-3 md:flex-row md:justify-end md:gap-3">
                <select
                  value={selectedOutletId}
                  onChange={handleOutletChange}
                  className="h-10 w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select Outlet</option>
                  {restaurantOutlets.map((outlet) => (
                    <option key={outlet.id} value={outlet.id}>
                      {outlet.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {renderContent()}

          <p className="mt-6 text-sm text-slate-500">
            If you enjoy using our POS, please consider leaving us a 5-star review. Your feedback keeps us motivated!
          </p>
      </div>
    </AdminLayout>
  );
};

export default TablesPage;
