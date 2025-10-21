import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import Alert, { type AlertType } from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import { outletService } from '../../../services/outletService';
import { tableService } from '../../../services/tableService';
import type { Outlet } from '../../../types/outlet';
import type { TableStatus } from '../../../types/table';

interface TableRow {
  id?: number;
  name: string;
  slug: string;
  capacity: string;
  isActive: boolean;
  status: TableStatus;
  outletId: number;
  slugEdited: boolean;
}

const statusOptions: Array<{ label: string; value: boolean }> = [
  { label: 'Enabled', value: true },
  { label: 'Disabled', value: false },
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
    window.setTimeout(() => setAlert(null), 3000);
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
      const firstRestaurant = data.find((outlet) => outlet.mode === 'RESTAURANT_CAFE');
      if (firstRestaurant) {
        setSelectedOutletId(firstRestaurant.id);
      }
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
        isActive: table.isActive,
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
    const isActive = value === 'true';
    setTables((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        isActive,
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
        isActive: true,
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
        original.isActive !== row.isActive
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
            isActive: table.isActive,
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
            isActive: table.isActive,
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
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading tables...</p>
          </div>
        </div>
      );
    }

    if (!restaurantOutlets.length) {
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-700">
          No restaurant or cafe outlets were found. Create a restaurant outlet before configuring tables.
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Slug</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Number of Seats
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tables.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No tables yet. Use "Add Row" to create your first table.
                  </td>
                </tr>
              ) : (
                tables.map((table, index) => (
                  <tr key={table.id ?? `new-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 align-top">
                      <input
                        type="text"
                        value={table.name}
                        onChange={(event) => handleNameChange(index, event.target.value)}
                        placeholder="Table 1"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </td>
                    <td className="px-6 py-4 align-top">
                      <input
                        type="text"
                        value={table.slug}
                        onChange={(event) => handleSlugChange(index, event.target.value)}
                        placeholder="table-1"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </td>
                    <td className="px-6 py-4 align-top">
                      <input
                        type="text"
                        value={table.capacity}
                        onChange={(event) => handleCapacityChange(index, event.target.value)}
                        placeholder="4"
                        inputMode="numeric"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                    </td>
                    <td className="px-6 py-4 align-top">
                      <select
                        value={String(table.isActive)}
                        onChange={(event) => handleStatusChange(index, event.target.value)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        {statusOptions.map((option) => (
                          <option key={option.label} value={String(option.value)}>
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
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={handleAddRow}
            className="inline-flex items-center rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-blue-500 hover:text-blue-600"
          >
            Add Row
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={saving}
            className="inline-flex items-center rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-100">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <header className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-800">Tables</h1>
            <p className="mt-2 text-gray-600 max-w-2xl">
              Configure dining tables for your restaurant outlets. Table numbers must be unique per outlet, and each table
              should reflect its seating capacity.
            </p>
          </header>

          {alert && (
            <ToastContainer>
              <Alert type={alert.type} title={alert.title} message={alert.message} />
            </ToastContainer>
          )}

          {error && (
            <div className="mb-6">
              <Alert type="error" title="Error" message={error} />
            </div>
          )}

          <div className="mb-6 flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Outlet</h2>
              <p className="mt-1 text-sm text-gray-600">Select a restaurant outlet to manage its tables.</p>
            </div>
            <select
              value={selectedOutletId}
              onChange={handleOutletChange}
              className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select outlet</option>
              {restaurantOutlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </option>
              ))}
            </select>
          </div>

          {renderContent()}

          <p className="mt-6 text-sm text-gray-500">
            If you enjoy using our POS, please consider leaving us a 5-star review. Your feedback keeps us motivated!
          </p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TablesPage;
