import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CashierLayout from '../../components/layout/CashierLayout';
import Alert from '../../components/common/Alert';
import ToastContainer from '../../components/common/ToastContainer';
import { orderService } from '../../services/orderService';
import type { Order } from '../../types/order';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatNumber, getTodayRange } from '../../utils/dashboardFormatting';

const activityIcons: Record<string, string> = {
  COMPLETED: '✅',
  REFUNDED: '↩️',
  READY: '📦',
  PREPARING: '👨‍🍳',
  PENDING: '⏳',
  ON_HOLD: '🧊',
  DRAFT: '📝',
  CANCELLED: '🛑',
};

const CashierDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [{ startIso, endIso }] = useState(getTodayRange);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await orderService.getAll({
        startDate: startIso,
        endDate: endIso,
        ...(user?.cashierId ? { cashierId: user.cashierId } : {}),
        ...(user?.cashierId ? {} : user?.username ? { cashierUsername: user.username } : {}),
      });

      if (!isMountedRef.current) {
        return;
      }

      const matchesUser = (order: Order) => {
        const idMatch = user?.cashierId !== undefined && user?.cashierId !== null
          ? order.cashierId === user?.cashierId
          : false;
        const usernameMatch = user?.username ? order.cashierUsername === user.username : false;
        return idMatch || usernameMatch;
      };

      const filtered = response.filter(matchesUser);
      setOrders(filtered);
    } catch (err) {
      console.error('Failed to load cashier dashboard data', err);
      if (isMountedRef.current) {
        setError('We could not load your activity for today. Pull to refresh or try again shortly.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [endIso, startIso, user]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const completedOrders = useMemo(() => orders.filter((order) => order.status === 'COMPLETED'), [orders]);
  const activeOrders = useMemo(
    () =>
      orders.filter((order) =>
        ['PENDING', 'PREPARING', 'READY', 'ON_HOLD', 'DRAFT'].includes(order.status),
      ),
    [orders],
  );
  const refundedOrders = useMemo(() => orders.filter((order) => order.status === 'REFUNDED'), [orders]);

  const totalSales = useMemo(
    () => completedOrders.reduce((accumulator, order) => accumulator + (order.totalAmount ?? 0), 0),
    [completedOrders],
  );

  const refundedAmount = useMemo(
    () => refundedOrders.reduce((accumulator, order) => accumulator + (order.totalAmount ?? 0), 0),
    [refundedOrders],
  );

  const netSales = totalSales - refundedAmount;

  const totalDiscounts = useMemo(
    () => completedOrders.reduce((accumulator, order) => accumulator + (order.discountAmount ?? 0), 0),
    [completedOrders],
  );

  const totalTax = useMemo(
    () => completedOrders.reduce((accumulator, order) => accumulator + (order.taxAmount ?? 0), 0),
    [completedOrders],
  );

  const averageTicket = completedOrders.length ? netSales / completedOrders.length : 0;

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
      .slice(0, 6);
  }, [orders]);

  return (
    <CashierLayout>
      <div className="px-4 pb-12 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-2">
            <h1 className="mt-2.5 text-3xl font-semibold tracking-tight text-slate-900">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
            </h1>
            <p className="text-sm text-slate-500">
              Here's how your register has performed so far today. Keep an eye on your open tickets and continue closing
              strong.
            </p>
          </header>

          {error && (
            <ToastContainer>
              <Alert
                type="error"
                title="Error"
                message={error}
                onClose={() => setError(null)}
              />
            </ToastContainer>
          )}

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">My Gross Sales</p>
              <p className="mt-3 text-3xl font-semibold text-emerald-600">
                {isLoading ? '—' : formatCurrency(totalSales)}
              </p>
              <p className="mt-2 text-sm text-slate-500">Completed tickets that you processed today.</p>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Net Sales After Refunds</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {isLoading ? '—' : formatCurrency(netSales)}
              </p>
              <p className="mt-2 text-sm text-slate-500">{formatCurrency(refundedAmount)} refunded today.</p>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Orders Closed</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {isLoading ? '—' : formatNumber(completedOrders.length)}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {activeOrders.length
                  ? `${formatNumber(activeOrders.length)} still in progress`
                  : 'No open orders right now.'}
              </p>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Average Ticket Value</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {isLoading ? '—' : formatCurrency(averageTicket || 0)}
              </p>
              <p className="mt-2 text-sm text-slate-500">Net sales divided by your completed orders.</p>
            </article>
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <header className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
                    <p className="text-sm text-slate-500">Track the last tickets you opened or closed.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void loadOrders();
                    }}
                    className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
                  >
                    Refresh
                  </button>
                </header>

                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                        <div className="mt-3 h-3 w-32 animate-pulse rounded bg-slate-200" />
                      </div>
                    ))}
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                    You haven’t processed any tickets yet today. Once you do, a log will appear here.
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {recentOrders.map((order) => {
                      const icon = activityIcons[order.status] ?? '🧾';
                      const createdAt = new Date(order.createdDate);
                      const completedAt = order.completedDate ? new Date(order.completedDate) : null;

                      return (
                        <li
                          key={order.id}
                          className="flex flex-col justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/40 sm:flex-row sm:items-center"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-xl">
                              {icon}
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">#{order.orderNumber}</p>
                              <p className="text-xs text-slate-500">
                                Opened {createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {completedAt
                                  ? ` • Closed ${completedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                  : ''}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-slate-900">
                              {formatCurrency(order.totalAmount ?? 0)}
                            </p>
                            <p className="text-xs text-slate-500 capitalize">
                              {order.status.replace('_', ' ').toLowerCase()}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Taxes & Discounts</h2>
              <p className="text-sm text-slate-500">Keep track of adjustments you’ve applied today.</p>
              <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700">
                  <dt className="text-xs font-semibold uppercase tracking-wide">Tax Collected</dt>
                  <dd className="mt-2 text-lg font-semibold text-emerald-800">
                    {isLoading ? '—' : formatCurrency(totalTax)}
                  </dd>
                  <p className="mt-1 text-xs text-emerald-600">All of your completed tickets.</p>
                </div>
                <div className="rounded-2xl bg-amber-50 p-4 text-amber-700">
                  <dt className="text-xs font-semibold uppercase tracking-wide">Discounts Applied</dt>
                  <dd className="mt-2 text-lg font-semibold text-amber-800">
                    {isLoading ? '—' : formatCurrency(totalDiscounts)}
                  </dd>
                  <p className="mt-1 text-xs text-amber-600">Manual or coupon-based reductions.</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-700">
                  <dt className="text-xs font-semibold uppercase tracking-wide">Active Queue</dt>
                  <dd className="mt-2 text-lg font-semibold text-slate-900">
                    {isLoading ? '—' : formatNumber(activeOrders.length)}
                  </dd>
                  <p className="mt-1 text-xs text-slate-500">Orders you’re still working on.</p>
                </div>
              </dl>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Performance Snapshot</h2>
              <p className="text-sm text-slate-500">Quick ratios help you understand your momentum.</p>
              <dl className="mt-6 space-y-4 text-sm">
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-slate-700">
                  <dt>Close Rate</dt>
                  <dd className="font-semibold">
                    {isLoading
                      ? '—'
                      : `${(
                          (completedOrders.length / Math.max(orders.length, 1)) *
                          100
                        ).toFixed(0)}%`}
                  </dd>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-slate-700">
                  <dt>Refund Ratio</dt>
                  <dd className="font-semibold">
                    {isLoading
                      ? '—'
                      : orders.length
                        ? `${((refundedOrders.length / orders.length) * 100).toFixed(1)}%`
                        : '0%'}
                  </dd>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-slate-700">
                  <dt>Average Prep Queue</dt>
                  <dd className="font-semibold">{isLoading ? '—' : formatNumber(activeOrders.length)}</dd>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-slate-700">
                  <dt>Highest Ticket</dt>
                  <dd className="font-semibold">
                    {isLoading
                      ? '—'
                      : formatCurrency(
                          Math.max(0, ...completedOrders.map((order) => order.totalAmount ?? 0)),
                        )}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Need a refresher?</h2>
              <p className="mt-2 text-sm text-slate-500">
                New tender types or promo flows coming up? Revisit your POS training playbook to stay sharp during peak
                hours.
              </p>
              <button
                type="button"
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Open Training Guide
              </button>
            </div>
          </aside>
        </section>
      </div>
    </div>
    </CashierLayout>
  );
};

export default CashierDashboardPage;
