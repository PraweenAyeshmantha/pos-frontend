import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import Alert, { type AlertType } from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import { outletService } from '../../../services/outletService';
import { tableService } from '../../../services/tableService';
import type { Outlet } from '../../../types/outlet';
import type { TableReservation, TableServiceSession, TableStatus, TableSessionStatus } from '../../../types/table';
import type { RecordStatus } from '../../../types/configuration';
import { useBusinessMode } from '../../../hooks/useBusinessMode';

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

interface ReservationFormState {
  tableId: string;
  guestName: string;
  partySize: string;
  reservationTime: string;
  contact: string;
}

interface TransferHistoryEntry {
  id: string;
  description: string;
  timestamp: string;
}

const statusOptions: Array<{ label: string; value: RecordStatus }> = [
  { label: 'Enabled', value: 'ACTIVE' },
  { label: 'Disabled', value: 'INACTIVE' },
];

const defaultTableStatus: TableStatus = 'AVAILABLE';
const ACTIVE_SESSION_STATUS: TableSessionStatus = 'ACTIVE';
const COMPLETED_SESSION_STATUS: TableSessionStatus = 'COMPLETED';

const formatServiceDuration = (startedAt?: string, endedAt?: string, _tick: number = 0): string => {
  if (!startedAt) {
    return '—';
  }
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  if (Number.isNaN(start) || Number.isNaN(end)) {
    return '—';
  }
  const diffMs = Math.max(0, end - start);
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m ${seconds}s`;
};
const RESERVATION_STORAGE_PREFIX = 'pos:tables:reservations';
const SESSION_STORAGE_PREFIX = 'pos:tables:sessions';
const WAITER_STORAGE_PREFIX = 'pos:tables:waiters';

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
  const [reservations, setReservations] = useState<TableReservation[]>([]);
  const [serviceSessions, setServiceSessions] = useState<TableServiceSession[]>([]);
  const [waiterAssignments, setWaiterAssignments] = useState<Map<number, string>>(new Map());
  const [reservationForm, setReservationForm] = useState<ReservationFormState>({
    tableId: '',
    guestName: '',
    partySize: '2',
    reservationTime: '',
    contact: '',
  });
  const [transferForm, setTransferForm] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [splitBillConfig, setSplitBillConfig] = useState<{ amount: string; parties: string }>({ amount: '', parties: '2' });
  const [transferHistory, setTransferHistory] = useState<TransferHistoryEntry[]>([]);
  const [timerTick, setTimerTick] = useState(0);
  const { isRestaurantMode } = useBusinessMode();
  const reservationStatusClass: Record<TableReservation['status'], string> = {
    PENDING: 'bg-slate-100 text-slate-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    SEATED: 'bg-purple-100 text-purple-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-rose-100 text-rose-700',
  };

  const totalTables = tables.length;
  const activeTables = useMemo(() => tables.filter((table) => table.recordStatus === 'ACTIVE').length, [tables]);
  const savedTables = useMemo(() => tables.filter((table) => Boolean(table.id)), [tables]);
  const splitBillShares = useMemo(() => {
    const total = Number.parseFloat(splitBillConfig.amount);
    const parties = Number.parseInt(splitBillConfig.parties, 10);
    if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(parties) || parties <= 0) {
      return null;
    }
    const share = total / parties;
    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
    return Array.from({ length: parties }, (_, index) => ({
      label: `Guest ${index + 1}`,
      amount: formatter.format(share),
    }));
  }, [splitBillConfig.amount, splitBillConfig.parties]);

  const restaurantOutlets = useMemo(
    () => outlets.filter((outlet) => outlet.mode === 'RESTAURANT_CAFE'),
    [outlets],
  );

  const reservationStorageKey = useMemo(
    () => (selectedOutletId ? `${RESERVATION_STORAGE_PREFIX}:${selectedOutletId}` : null),
    [selectedOutletId],
  );
  const sessionStorageKey = useMemo(
    () => (selectedOutletId ? `${SESSION_STORAGE_PREFIX}:${selectedOutletId}` : null),
    [selectedOutletId],
  );
  const waiterStorageKey = useMemo(
    () => (selectedOutletId ? `${WAITER_STORAGE_PREFIX}:${selectedOutletId}` : null),
    [selectedOutletId],
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

  const persistReservations = useCallback(
    (next: TableReservation[]) => {
      if (reservationStorageKey) {
        localStorage.setItem(reservationStorageKey, JSON.stringify(next));
      }
    },
    [reservationStorageKey],
  );

  const persistSessions = useCallback(
    (next: TableServiceSession[]) => {
      if (sessionStorageKey) {
        localStorage.setItem(sessionStorageKey, JSON.stringify(next));
      }
    },
    [sessionStorageKey],
  );

  const persistWaiters = useCallback(
    (next: Map<number, string>) => {
      if (waiterStorageKey) {
        localStorage.setItem(waiterStorageKey, JSON.stringify(Array.from(next.entries())));
      }
    },
    [waiterStorageKey],
  );

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
    if (!isRestaurantMode) {
      setLoading(false);
      return;
    }
    fetchOutlets();
  }, [fetchOutlets, isRestaurantMode]);

  useEffect(() => {
    if (!isRestaurantMode || !selectedOutletId) {
      return;
    }
    fetchTables();
  }, [fetchTables, isRestaurantMode, selectedOutletId]);

  useEffect(() => {
    if (!isRestaurantMode) {
      setReservations([]);
      setServiceSessions([]);
      setWaiterAssignments(new Map());
      return;
    }
    if (!reservationStorageKey) {
      setReservations([]);
    } else {
      const storedReservations = localStorage.getItem(reservationStorageKey);
      setReservations(storedReservations ? JSON.parse(storedReservations) : []);
    }
    if (!sessionStorageKey) {
      setServiceSessions([]);
    } else {
      const storedSessions = localStorage.getItem(sessionStorageKey);
      setServiceSessions(storedSessions ? JSON.parse(storedSessions) : []);
    }
    if (!waiterStorageKey) {
      setWaiterAssignments(new Map());
    } else {
      const storedWaiters = localStorage.getItem(waiterStorageKey);
      if (storedWaiters) {
        try {
          const parsed: Array<[number, string]> = JSON.parse(storedWaiters);
          setWaiterAssignments(new Map(parsed));
        } catch {
          setWaiterAssignments(new Map());
        }
      } else {
        setWaiterAssignments(new Map());
      }
    }
  }, [isRestaurantMode, reservationStorageKey, sessionStorageKey, waiterStorageKey]);

  useEffect(() => {
    const interval = window.setInterval(() => setTimerTick((tick) => tick + 1), 30000);
    return () => window.clearInterval(interval);
  }, []);

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

  const handleAssignWaiter = useCallback(
    (tableId: number, value: string) => {
      setWaiterAssignments((prev) => {
        const next = new Map(prev);
        const trimmed = value.trim();
        if (trimmed) {
          next.set(tableId, trimmed);
        } else {
          next.delete(tableId);
        }
        persistWaiters(next);
        return next;
      });
    },
    [persistWaiters],
  );

  const startService = useCallback(
    (tableId: number, tableName: string, guestCount?: number) => {
      if (!tableId) {
        showAlert('error', 'Table Required', 'Save the table before starting service.');
        return;
      }
      setServiceSessions((prev) => {
        if (prev.some((session) => session.tableId === tableId && session.status === ACTIVE_SESSION_STATUS)) {
          showAlert('error', 'Session Active', 'Complete the current session before starting a new one.');
          return prev;
        }
        const session: TableServiceSession = {
          id: `session-${Date.now()}`,
          tableId,
          tableNumber: tableName,
          startedAt: new Date().toISOString(),
          guestCount,
          waiter: waiterAssignments.get(tableId),
          status: ACTIVE_SESSION_STATUS,
        };
        const next: TableServiceSession[] = [...prev, session];
        persistSessions(next);
        return next;
      });
    },
    [persistSessions, showAlert, waiterAssignments],
  );

  const completeService = useCallback(
    (tableId: number) => {
      setServiceSessions((prev) => {
        const next = prev.map<TableServiceSession>((session) =>
          session.tableId === tableId && session.status === ACTIVE_SESSION_STATUS
            ? { ...session, status: COMPLETED_SESSION_STATUS, endedAt: new Date().toISOString() }
            : session,
        );
        persistSessions(next);
        return next;
      });
    },
    [persistSessions],
  );

  const getActiveSession = useCallback(
    (tableId: number) => serviceSessions.find((session) => session.tableId === tableId && session.status === ACTIVE_SESSION_STATUS),
    [serviceSessions],
  );

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

  const handleReservationFormChange = useCallback(
    (field: keyof ReservationFormState, value: string) => {
      setReservationForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    [],
  );

  const handleCreateReservation = useCallback(() => {
    if (!selectedOutletId) {
      showAlert('error', 'Select Outlet', 'Choose a restaurant outlet to create reservations.');
      return;
    }
    if (!reservationForm.tableId) {
      showAlert('error', 'Table Required', 'Select a table for the reservation.');
      return;
    }
    const table = tables.find((row) => row.id === Number(reservationForm.tableId));
    if (!table || !table.id) {
      showAlert('error', 'Invalid Table', 'Please choose a saved table.');
      return;
    }
    if (!reservationForm.guestName.trim()) {
      showAlert('error', 'Guest Name Required', 'Enter the guest name.');
      return;
    }
    if (!reservationForm.reservationTime) {
      showAlert('error', 'Time Required', 'Select a reservation time.');
      return;
    }
    const newReservation: TableReservation = {
      id: `reservation-${Date.now()}`,
      tableId: table.id,
      tableNumber: table.name,
      guestName: reservationForm.guestName.trim(),
      partySize: Number.parseInt(reservationForm.partySize, 10) || 2,
      reservationTime: reservationForm.reservationTime,
      status: 'CONFIRMED',
      contactPhone: reservationForm.contact.trim() || undefined,
    };
    setReservations((prev) => {
      const next = [...prev, newReservation].sort(
        (a, b) => new Date(a.reservationTime).getTime() - new Date(b.reservationTime).getTime(),
      );
      persistReservations(next);
      return next;
    });
    setReservationForm({
      tableId: '',
      guestName: '',
      partySize: '2',
      reservationTime: '',
      contact: '',
    });
    showAlert('success', 'Reservation Added', `${table.name} reserved for ${newReservation.guestName}.`);
  }, [persistReservations, reservationForm, selectedOutletId, showAlert, tables]);

  const updateReservationStatus = useCallback(
    (reservationId: string, status: TableReservation['status']) => {
      setReservations((prev) => {
        const next = prev.map((reservation) =>
          reservation.id === reservationId ? { ...reservation, status } : reservation,
        );
        persistReservations(next);
        return next;
      });
    },
    [persistReservations],
  );

  const handleSeatReservation = useCallback(
    (reservation: TableReservation) => {
      updateReservationStatus(reservation.id, 'SEATED');
      startService(reservation.tableId, reservation.tableNumber, reservation.partySize);
    },
    [startService, updateReservationStatus],
  );

  const handleCancelReservation = useCallback(
    (reservation: TableReservation) => {
      updateReservationStatus(reservation.id, 'CANCELLED');
    },
    [updateReservationStatus],
  );

  const handleCompleteReservation = useCallback(
    (reservation: TableReservation) => {
      updateReservationStatus(reservation.id, 'COMPLETED');
      completeService(reservation.tableId);
    },
    [completeService, updateReservationStatus],
  );

  const handleTransferFormChange = useCallback((field: 'from' | 'to', value: string) => {
    setTransferForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSplitBillChange = useCallback((field: 'amount' | 'parties', value: string) => {
    if (field === 'amount' && value && !/^\d*\.?\d{0,2}$/.test(value)) {
      return;
    }
    if (field === 'parties' && value && !/^\d*$/.test(value)) {
      return;
    }
    setSplitBillConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const recordHistory = useCallback((description: string) => {
    const entry: TransferHistoryEntry = {
      id: `history-${Date.now()}`,
      description,
      timestamp: new Date().toISOString(),
    };
    setTransferHistory((prev) => [entry, ...prev].slice(0, 5));
  }, []);

  const handleTransferTables = useCallback(() => {
    if (!transferForm.from || !transferForm.to || transferForm.from === transferForm.to) {
      showAlert('error', 'Select Tables', 'Choose two different tables to transfer.');
      return;
    }
    const from = tables.find((table) => table.id === Number(transferForm.from));
    const to = tables.find((table) => table.id === Number(transferForm.to));
    if (!from?.id || !to?.id) {
      showAlert('error', 'Invalid Tables', 'Only saved tables can be transferred.');
      return;
    }
    const fromId = from.id as number;
    const toId = to.id as number;
    const toName = to.name;
    const waiter = waiterAssignments.get(fromId);
    if (waiter) {
      handleAssignWaiter(toId, waiter);
      handleAssignWaiter(fromId, '');
    }
    setServiceSessions((prev) => {
      const next = prev.map<TableServiceSession>((session) =>
        session.tableId === fromId && session.status === ACTIVE_SESSION_STATUS
          ? { ...session, tableId: toId, tableNumber: toName }
          : session,
      );
      persistSessions(next);
      return next;
    });
    recordHistory(`Transferred guests from ${from.name} to ${to.name}`);
    setTransferForm({ from: '', to: '' });
    showAlert('success', 'Transfer Complete', `Guests moved to ${to.name}.`);
  }, [handleAssignWaiter, persistSessions, recordHistory, showAlert, tables, transferForm.from, transferForm.to, waiterAssignments]);

  const handleMergeTables = useCallback(() => {
    if (!transferForm.from || !transferForm.to || transferForm.from === transferForm.to) {
      showAlert('error', 'Select Tables', 'Choose two different tables to merge.');
      return;
    }
    const from = tables.find((table) => table.id === Number(transferForm.from));
    const to = tables.find((table) => table.id === Number(transferForm.to));
    if (!from?.id || !to?.id) {
      showAlert('error', 'Invalid Tables', 'Only saved tables can be merged.');
      return;
    }
    setTables((prev) =>
      prev.map((table) =>
        table.id === from.id
          ? { ...table, status: 'CLEANING' }
          : table,
      ),
    );
    recordHistory(`Merged ${from.name} into ${to.name}`);
    showAlert('success', 'Merge Complete', `${from.name} merged into ${to.name} for a larger party.`);
  }, [recordHistory, showAlert, tables, transferForm.from, transferForm.to]);

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
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Waiter</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Service</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {tables.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No tables yet. Use "Add Row" to create your first table.
                  </td>
                </tr>
              ) : (
                tables.map((table, index) => {
                  const activeSession = table.id ? getActiveSession(table.id) : undefined;
                  return (
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
                      {table.id ? (
                        <input
                          type="text"
                          value={waiterAssignments.get(table.id) ?? ''}
                          onChange={(event) => handleAssignWaiter(table.id as number, event.target.value)}
                          placeholder="Assign waiter"
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">Save to assign</span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top">
                      {table.id ? (
                        <div className="flex flex-col gap-2 text-sm">
                          <div className="font-semibold text-slate-900">
                            {activeSession ? formatServiceDuration(activeSession.startedAt, activeSession.endedAt, timerTick) : '—'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {activeSession ? `Waiter: ${activeSession.waiter ?? 'Unassigned'}` : 'Idle'}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {activeSession ? (
                              <button
                                type="button"
                                onClick={() => completeService(table.id as number)}
                                className="rounded-md border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50"
                              >
                                Complete
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  startService(
                                    table.id as number,
                                    table.name,
                                    Number.parseInt(table.capacity, 10) || undefined,
                                  )
                                }
                                className="rounded-md border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                              >
                                Start Service
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Save to track</span>
                      )}
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
                )})
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

  if (!isRestaurantMode) {
    return (
      <AdminLayout>
        <div className="flex flex-col gap-8 pb-12">
          <AdminPageHeader
            title="Tables"
            description="Table management is available when Restaurant / Cafe mode is enabled."
          />
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
            <p className="text-lg font-semibold text-slate-900">Restaurant features are disabled</p>
            <p className="mt-2 text-sm">
              Switch the business mode to <strong>Restaurant / Cafe</strong> via <em>Configuration → General</em> to
              configure tables, reservations, and kitchen workflows.
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

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

          {selectedOutletId ? (
            <>
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-6 lg:flex-row">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-slate-900">Manage Reservations</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <select
                        value={reservationForm.tableId}
                        onChange={(event) => handleReservationFormChange('tableId', event.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">Select table</option>
                        {savedTables.map((table) => (
                          <option key={table.id} value={table.id}>
                            {table.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={reservationForm.guestName}
                        onChange={(event) => handleReservationFormChange('guestName', event.target.value)}
                        placeholder="Guest name"
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                      <input
                        type="text"
                        value={reservationForm.partySize}
                        onChange={(event) => handleReservationFormChange('partySize', event.target.value)}
                        placeholder="Party size"
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                      <input
                        type="datetime-local"
                        value={reservationForm.reservationTime}
                        onChange={(event) => handleReservationFormChange('reservationTime', event.target.value)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      />
                      <input
                        type="tel"
                        value={reservationForm.contact}
                        onChange={(event) => handleReservationFormChange('contact', event.target.value)}
                        placeholder="Contact phone"
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 sm:col-span-2"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateReservation}
                      className="mt-4 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      Add Reservation
                    </button>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-900">Timeline</h4>
                    <div className="mt-3 space-y-3">
                      {reservations.length === 0 ? (
                        <p className="text-sm text-slate-500">No reservations logged for this outlet yet.</p>
                      ) : (
                        reservations.map((reservation) => (
                          <div key={reservation.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{reservation.guestName}</p>
                                <p className="text-xs text-slate-500">
                                  Table {reservation.tableNumber} • {new Date(reservation.reservationTime).toLocaleString()}
                                </p>
                              </div>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${reservationStatusClass[reservation.status]}`}>
                                {reservation.status.toLowerCase()}
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {reservation.status === 'CONFIRMED' && (
                                <button
                                  type="button"
                                  onClick={() => handleSeatReservation(reservation)}
                                  className="rounded-md border border-purple-200 px-3 py-1 text-xs font-semibold text-purple-600 hover:bg-purple-50"
                                >
                                  Seat
                                </button>
                              )}
                              {reservation.status === 'SEATED' && (
                                <button
                                  type="button"
                                  onClick={() => handleCompleteReservation(reservation)}
                                  className="rounded-md border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-50"
                                >
                                  Complete
                                </button>
                              )}
                              {reservation.status !== 'CANCELLED' && reservation.status !== 'COMPLETED' && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelReservation(reservation)}
                                  className="rounded-md border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-2">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Split Bill Calculator</h3>
                  <div className="mt-4 flex flex-col gap-3">
                    <input
                      type="text"
                      value={splitBillConfig.amount}
                      onChange={(event) => handleSplitBillChange('amount', event.target.value)}
                      placeholder="Bill amount"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    <input
                      type="text"
                      value={splitBillConfig.parties}
                      onChange={(event) => handleSplitBillChange('parties', event.target.value)}
                      placeholder="Number of guests"
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    />
                    {splitBillShares ? (
                      <ul className="space-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                        {splitBillShares.map((share, index) => (
                          <li key={index} className="flex items-center justify-between">
                            <span>{share.label}</span>
                            <span className="font-semibold">{share.amount}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">Enter a bill total and number of guests to view split amounts.</p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Transfer & Merge Tables</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <select
                      value={transferForm.from}
                      onChange={(event) => handleTransferFormChange('from', event.target.value)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">From table</option>
                      {savedTables.map((table) => (
                        <option key={`from-${table.id}`} value={table.id}>
                          {table.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={transferForm.to}
                      onChange={(event) => handleTransferFormChange('to', event.target.value)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">To table</option>
                      {savedTables.map((table) => (
                        <option key={`to-${table.id}`} value={table.id}>
                          {table.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleTransferTables}
                      className="rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50"
                    >
                      Transfer Guests
                    </button>
                    <button
                      type="button"
                      onClick={handleMergeTables}
                      className="rounded-lg border border-purple-200 px-4 py-2 text-sm font-semibold text-purple-600 hover:bg-purple-50"
                    >
                      Merge Tables
                    </button>
                  </div>
                  <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">
                    <p className="text-xs font-semibold uppercase text-slate-500">Recent actions</p>
                    {transferHistory.length === 0 ? (
                      <p className="mt-1 text-sm">No transfers recorded yet.</p>
                    ) : (
                      <ul className="mt-2 space-y-1 text-xs">
                        {transferHistory.map((entry) => (
                          <li key={entry.id} className="flex items-center justify-between">
                            <span>{entry.description}</span>
                            <span className="text-slate-400">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </section>
            </>
          ) : null}

          <p className="mt-6 text-sm text-slate-500">
            If you enjoy using our POS, please consider leaving us a 5-star review. Your feedback keeps us motivated!
          </p>
      </div>
    </AdminLayout>
  );
};

export default TablesPage;
