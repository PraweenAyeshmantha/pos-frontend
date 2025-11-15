import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import Alert, { type AlertType } from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import { outletService } from '../../../services/outletService';
import { kitchenService } from '../../../services/kitchenService';
import type { Outlet } from '../../../types/outlet';
import type { KitchenOrder } from '../../../types/kitchen';
import { useBusinessMode } from '../../../hooks/useBusinessMode';

const formatDuration = (dateString?: string): string => {
  if (!dateString) {
    return '—';
  }
  const created = new Date(dateString).getTime();
  if (Number.isNaN(created)) {
    return '—';
  }
  const diffMs = Date.now() - created;
  if (diffMs < 0) {
    return '0m';
  }
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m ${seconds}s`;
};

const OutletKitchenViewPage: React.FC = () => {
  const { outletId } = useParams<{ outletId: string }>();
  const navigate = useNavigate();
  const numericOutletId = Number(outletId);
  const { isRestaurantMode } = useBusinessMode();
  const [outlet, setOutlet] = useState<Outlet | null>(null);
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ type: AlertType; title: string; message: string } | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<'disabled' | 'connecting' | 'connected' | 'error'>(
    'disabled',
  );
  const [refreshing, setRefreshing] = useState(false);
  const kitchenWsUrl = import.meta.env.VITE_KITCHEN_WS_URL as string | undefined;

  const showToast = useCallback((type: AlertType, title: string, message: string) => {
    setToast({ type, title, message });
  }, []);

  const fetchOutletDetails = useCallback(async () => {
    if (!Number.isFinite(numericOutletId)) {
      return;
    }
    try {
      const data = await outletService.getById(numericOutletId);
      setOutlet(data);
    } catch (error) {
      console.error('Failed to load outlet', error);
      showToast('error', 'Outlet Error', 'Unable to load outlet information.');
    }
  }, [numericOutletId, showToast]);

  const fetchKitchenOrders = useCallback(
    async (showSpinner: boolean = true) => {
      if (!Number.isFinite(numericOutletId)) {
        return;
      }
      try {
        if (showSpinner) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }
        const data = await kitchenService.getOrders(numericOutletId);
        setOrders(data);
      } catch (error) {
        console.error('Failed to load kitchen orders', error);
        showToast('error', 'Kitchen Error', 'Unable to load kitchen queue.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [numericOutletId, showToast],
  );

  useEffect(() => {
    if (!isRestaurantMode) {
      setLoading(false);
      return;
    }
    void fetchOutletDetails();
  }, [fetchOutletDetails, isRestaurantMode]);

  useEffect(() => {
    if (!isRestaurantMode) {
      return;
    }
    void fetchKitchenOrders();
  }, [fetchKitchenOrders, isRestaurantMode]);

  useEffect(() => {
    if (!isRestaurantMode) {
      return;
    }
    const interval = window.setInterval(() => {
      void fetchKitchenOrders(false);
    }, 1000 * 15);
    return () => window.clearInterval(interval);
  }, [fetchKitchenOrders, isRestaurantMode]);

  useEffect(() => {
    if (!isRestaurantMode) {
      setRealtimeStatus('disabled');
      return;
    }
    if (!kitchenWsUrl || !Number.isFinite(numericOutletId)) {
      setRealtimeStatus('disabled');
      return;
    }

    let ws: WebSocket | null = null;
    let reconnectTimer: number | null = null;

    const connect = () => {
      try {
        const url = new URL(kitchenWsUrl);
        url.searchParams.set('outletId', numericOutletId.toString());
        setRealtimeStatus('connecting');
        ws = new WebSocket(url.toString());
        ws.onopen = () => {
          setRealtimeStatus('connected');
        };
        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (Array.isArray(payload)) {
              setOrders(payload);
            } else if (payload?.data && Array.isArray(payload.data)) {
              setOrders(payload.data);
            }
          } catch (error) {
            console.warn('Unable to parse kitchen ws payload', error);
          }
        };
        ws.onclose = () => {
          setRealtimeStatus('error');
          if (reconnectTimer) {
            window.clearTimeout(reconnectTimer);
          }
          reconnectTimer = window.setTimeout(connect, 5000);
        };
        ws.onerror = () => {
          setRealtimeStatus('error');
        };
      } catch (error) {
        console.error('Failed to initialize kitchen WebSocket', error);
        setRealtimeStatus('error');
      }
    };

    connect();

    return () => {
      if (reconnectTimer) {
        window.clearTimeout(reconnectTimer);
      }
      if (ws) {
        ws.close();
      }
    };
  }, [isRestaurantMode, kitchenWsUrl, numericOutletId]);

  const handleMarkReady = useCallback(
    async (order: KitchenOrder) => {
      try {
        await kitchenService.markReady(order.id);
        showToast('success', 'Marked Ready', `${order.orderNumber} sent to pickup.`);
        void fetchKitchenOrders(false);
      } catch (error) {
        console.error('Failed to mark order ready', error);
        showToast('error', 'Action Failed', 'Unable to mark order as ready.');
      }
    },
    [fetchKitchenOrders, showToast],
  );

  const realtimeLabel = useMemo(() => {
    switch (realtimeStatus) {
      case 'connected':
        return 'Live';
      case 'connecting':
        return 'Connecting…';
      case 'error':
        return 'Realtime unavailable';
      default:
        return 'Polling';
    }
  }, [realtimeStatus]);

  const renderOrders = () => {
    if (loading) {
      return (
        <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
            <p className="mt-4 text-slate-600">Loading kitchen queue…</p>
          </div>
        </div>
      );
    }

    if (orders.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
          <p className="text-lg font-semibold">Kitchen is clear</p>
          <p className="mt-2 text-sm text-slate-500">
            When new dine-in or hold orders are sent to the kitchen they will appear here automatically.
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {orders.map((order) => (
          <article key={order.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{order.orderNumber}</p>
                <p className="text-xs text-slate-500">{order.orderType ?? 'Order'}</p>
              </div>
              <div className="text-right text-xs text-amber-600 font-semibold">
                {formatDuration(order.createdDate)}
              </div>
            </div>
            {order.tableNumber && (
              <div className="mt-1 text-xs text-blue-600 font-medium">Table {order.tableNumber}</div>
            )}
            <ul className="mt-4 flex-1 space-y-2">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                  <div className="text-sm text-slate-800">{item.productName}</div>
                  <span className="text-sm font-semibold text-slate-900">×{item.quantity}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-slate-500">{order.customerEmail ?? 'In-store guest'}</div>
              <button
                type="button"
                onClick={() => handleMarkReady(order)}
                className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              >
                Mark Ready
              </button>
            </div>
          </article>
        ))}
      </div>
    );
  };

  if (!isRestaurantMode) {
    return (
      <AdminLayout>
        <div className="flex flex-col gap-6 pb-12">
          <AdminPageHeader
            title="Kitchen View"
            description="Kitchen routing is available only for Restaurant/Cafe businesses."
            actions={
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                ← Back
              </button>
            }
          />
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
            <p className="text-lg font-semibold text-slate-900">Restaurant features are disabled</p>
            <p className="mt-2 text-sm">
              Select <strong>Restaurant / Cafe</strong> mode in General Configuration to unlock kitchen routing, table
              management, and other dine-in workflows.
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 pb-12">
        <AdminPageHeader
          title={outlet ? `${outlet.name} • Kitchen` : 'Kitchen View'}
          description="Monitor active kitchen tickets and move them to ready in real time."
          actions={
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              ← Back to Outlets
            </button>
          }
        />

        {toast && (
          <ToastContainer>
            <Alert type={toast.type} title={toast.title} message={toast.message} onClose={() => setToast(null)} />
          </ToastContainer>
        )}

        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">{outlet?.name ?? '—'}</p>
            <p className="text-xs text-slate-500">{outlet?.address}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                realtimeStatus === 'connected'
                  ? 'bg-emerald-100 text-emerald-700'
                  : realtimeStatus === 'error'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-slate-100 text-slate-700'
              }`}
            >
              {realtimeLabel}
            </span>
            <button
              type="button"
              onClick={() => fetchKitchenOrders(false)}
              disabled={refreshing}
              className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </section>

        {renderOrders()}
      </div>
    </AdminLayout>
  );
};

export default OutletKitchenViewPage;
