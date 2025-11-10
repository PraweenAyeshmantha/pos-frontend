import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import Alert from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import { analyticsService } from '../../../services/analyticsService';
import { orderService } from '../../../services/orderService';
import type { SalesAnalytics } from '../../../types/analytics';
import type { Order } from '../../../types/order';
import { formatCurrency, formatNumber, getTodayRange } from '../../../utils/dashboardFormatting';

interface OutletSales {
  outletId: number;
  outletName: string;
  totalSales: number;
  orderCount: number;
}

interface CashierSales {
  cashierId: number;
  cashierName: string;
  totalSales: number;
  orderCount: number;
}

interface HourlySalesBucket {
  hourLabel: string;
  totalSales: number;
  orders: number;
}

const DashboardPage: React.FC = () => {
  const [{ startIso, endIso, label: todayLabel }] = useState(getTodayRange);
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadDashboard = useCallback(async () => {
    if (!isMountedRef.current) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [analyticsResponse, ordersResponse] = await Promise.all([
        analyticsService.fetchSalesAnalytics({
          startDate: startIso,
          endDate: endIso,
        }),
        orderService.getAll({
          startDate: startIso,
          endDate: endIso,
        }),
      ]);

      if (!isMountedRef.current) {
        return;
      }

      setAnalytics(analyticsResponse);
      setOrders(ordersResponse);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      if (isMountedRef.current) {
        setError('Unable to load today’s sales insights. Please refresh to try again.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [endIso, startIso]);

  useEffect(() => {
    void loadDashboard();

    const interval = window.setInterval(() => {
      void loadDashboard();
    }, 60_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadDashboard]);

  const completedOrders = useMemo(
    () => orders.filter((order) => order.status === 'COMPLETED'),
    [orders],
  );

  const refundedOrders = useMemo(
    () => orders.filter((order) => order.status === 'REFUNDED'),
    [orders],
  );

  const salesByOutlet = useMemo<OutletSales[]>(() => {
    const aggregate = new Map<number, OutletSales>();

    completedOrders.forEach((order) => {
      if (order.outletId === undefined || order.outletName === undefined) {
        return;
      }

      const entry = aggregate.get(order.outletId);

      if (entry) {
        entry.totalSales += order.totalAmount ?? 0;
        entry.orderCount += 1;
      } else {
        aggregate.set(order.outletId, {
          outletId: order.outletId,
          outletName: order.outletName ?? `Outlet ${order.outletId}`,
          totalSales: order.totalAmount ?? 0,
          orderCount: 1,
        });
      }
    });

    return Array.from(aggregate.values())
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5);
  }, [completedOrders]);

  const salesByCashier = useMemo<CashierSales[]>(() => {
    const aggregate = new Map<number, CashierSales>();

    completedOrders.forEach((order) => {
      if (order.cashierId === undefined || order.cashierId === null) {
        return;
      }

      const entry = aggregate.get(order.cashierId);

      if (entry) {
        entry.totalSales += order.totalAmount ?? 0;
        entry.orderCount += 1;
      } else {
        aggregate.set(order.cashierId, {
          cashierId: order.cashierId,
          cashierName: order.cashierName ?? order.cashierUsername ?? `Cashier ${order.cashierId}`,
          totalSales: order.totalAmount ?? 0,
          orderCount: 1,
        });
      }
    });

    return Array.from(aggregate.values())
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5);
  }, [completedOrders]);

  const hourlySales = useMemo<HourlySalesBucket[]>(() => {
    const buckets: HourlySalesBucket[] = Array.from({ length: 24 }, (_value, index) => ({
      hourLabel: `${index.toString().padStart(2, '0')}:00`,
      totalSales: 0,
      orders: 0,
    }));

    completedOrders.forEach((order) => {
      const timestamp = order.completedDate ?? order.createdDate;
      if (!timestamp) {
        return;
      }
      const date = new Date(timestamp);
      const hour = date.getHours();

      if (hour >= 0 && hour < buckets.length) {
        buckets[hour].totalSales += order.totalAmount ?? 0;
        buckets[hour].orders += 1;
      }
    });

    return buckets.filter((bucket) => bucket.orders > 0);
  }, [completedOrders]);

  const totalRefundedAmount = useMemo(
    () =>
      refundedOrders.reduce((accumulator, order) => accumulator + (order.totalAmount ?? 0), 0),
    [refundedOrders],
  );

  const netSalesDerived = useMemo(() => {
    if (!analytics) {
      return completedOrders.reduce((acc, order) => acc + (order.totalAmount ?? 0), 0) - totalRefundedAmount;
    }
    return analytics.netSales;
  }, [analytics, completedOrders, totalRefundedAmount]);

  const metricSkeleton = (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-32 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="h-6 w-24 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 h-8 w-32 animate-pulse rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8 pb-12">
        <AdminPageHeader
          title="Daily Sales Overview"
          description={`Live performance across all locations for ${todayLabel}.`}
        />

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

        <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Today&apos;s Sales Pulse</p>
              <p className="text-xl font-semibold text-slate-900">All outlets, all teams</p>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-500">
              {lastUpdated ? (
                <span className="rounded-full bg-slate-100 px-3 py-1">Updated {lastUpdated.toLocaleTimeString()}</span>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  void loadDashboard();
                }}
                className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
              >
                Refresh
              </button>
            </div>
          </header>

          {isLoading && !analytics ? (
            metricSkeleton
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Sales</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{formatCurrency(analytics?.totalSales ?? netSalesDerived)}</p>
                <p className="mt-2 text-sm text-slate-500">Completed orders processed today</p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Net Sales</p>
                <p className="mt-3 text-3xl font-semibold text-emerald-600">{formatCurrency(netSalesDerived)}</p>
                <p className="mt-2 text-sm text-slate-500">After refunds and discounts</p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Orders Completed</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">{formatNumber(analytics?.totalOrders ?? completedOrders.length)}</p>
                <p className="mt-2 text-sm text-slate-500">Includes all channels</p>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Average Order Value</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900">
                  {formatCurrency(analytics?.averageOrderValue ?? (completedOrders.length ? netSalesDerived / completedOrders.length : 0))}
                </p>
                <p className="mt-2 text-sm text-slate-500">Revenue per closed ticket</p>
              </article>
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <header className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Sales by Hour</h2>
                  <p className="text-sm text-slate-500">Identify peak trading windows throughout the day.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {hourlySales.length || 0} active hours
                </span>
              </header>
              {hourlySales.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                  No completed orders recorded yet today. Once your first sale closes, hourly performance will appear here.
                </div>
              ) : (
                <ul className="space-y-4">
                  {hourlySales.map((bucket) => {
                    const maxSales = Math.max(...hourlySales.map((entry) => entry.totalSales));
                    const progress = maxSales > 0 ? Math.round((bucket.totalSales / maxSales) * 100) : 0;
                    return (
                      <li key={bucket.hourLabel}>
                        <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                          <span>{bucket.hourLabel}</span>
                          <span className="text-slate-500">{formatCurrency(bucket.totalSales)}</span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-blue-500 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-slate-400">{bucket.orders} orders</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <header className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Top Performing Outlets</h2>
                  <p className="text-sm text-slate-500">Focused on completed orders for today.</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-600">
                  {salesByOutlet.length} tracked locations
                </span>
              </header>
              {salesByOutlet.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                  No outlet performance to display yet today.
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {salesByOutlet.map((outlet) => (
                    <li key={outlet.outletId} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{outlet.outletName}</p>
                        <p className="text-xs text-slate-500">{formatNumber(outlet.orderCount)} orders</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-800">{formatCurrency(outlet.totalSales)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Refunds & Discounts</h2>
              <p className="mt-1 text-sm text-slate-500">Track exceptions that reduce revenue.</p>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-2xl bg-rose-50 px-4 py-3 text-rose-700">
                  <dt>Refunded Orders</dt>
                  <dd className="font-semibold">{formatNumber(refundedOrders.length)}</dd>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-rose-50 px-4 py-3 text-rose-700">
                  <dt>Refunded Amount</dt>
                  <dd className="font-semibold">{formatCurrency(totalRefundedAmount)}</dd>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 text-amber-700">
                  <dt>Discounted Orders</dt>
                  <dd className="font-semibold">{formatNumber(analytics?.discountedOrders ?? 0)}</dd>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3 text-amber-700">
                  <dt>Total Discounts</dt>
                  <dd className="font-semibold">{formatCurrency(analytics?.grossDiscountAmount ?? 0)}</dd>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-slate-700">
                  <dt>Tax Collected</dt>
                  <dd className="font-semibold text-slate-900">{formatCurrency(analytics?.totalTax ?? 0)}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Cashier Spotlight</h2>
              <p className="mt-1 text-sm text-slate-500">Celebrate teams contributing the most revenue today.</p>
              {salesByCashier.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  No completed orders routed to cashiers yet today.
                </div>
              ) : (
                <ul className="mt-4 space-y-4">
                  {salesByCashier.map((cashier, index) => (
                    <li key={cashier.cashierId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                          #{index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{cashier.cashierName}</p>
                          <p className="text-xs text-slate-500">{formatNumber(cashier.orderCount)} orders today</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{formatCurrency(cashier.totalSales)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </section>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;
