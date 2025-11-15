import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import Alert from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import { analyticsService } from '../../../services/analyticsService';
import { orderService } from '../../../services/orderService';
import type { Order, OrderStatus } from '../../../types/order';
import type { SalesAnalytics } from '../../../types/analytics';
import { formatCurrency, formatNumber } from '../../../utils/dashboardFormatting';
import { useOutlet } from '../../../contexts/OutletContext';

type ChannelFilter = 'all' | 'online' | 'instore';

interface SalesFilterState {
  startDate: string;
  endDate: string;
  outletId: string;
  status: 'ALL' | OrderStatus;
  channel: ChannelFilter;
}

const buildDateInput = (date: Date) => date.toISOString().split('T')[0];
const startOfDayIso = (dateString: string) => {
  const date = new Date(`${dateString}T00:00:00`);
  return date.toISOString();
};
const endOfDayExclusiveIso = (dateString: string) => {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString();
};

const createDefaultFilters = (): SalesFilterState => {
  const today = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 6);
  return {
    startDate: buildDateInput(weekAgo),
    endDate: buildDateInput(today),
    outletId: 'all',
    status: 'COMPLETED',
    channel: 'all',
  };
};

const SalesInsightsPage: React.FC = () => {
  const { assignedOutlets } = useOutlet();
  const [filters, setFilters] = useState<SalesFilterState>(() => createDefaultFilters());
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInsights = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const startIso = startOfDayIso(filters.startDate);
      const endIso = endOfDayExclusiveIso(filters.endDate);
      const outletId =
        filters.outletId === 'all' ? undefined : Number.parseInt(filters.outletId, 10);
      const status = filters.status === 'ALL' ? undefined : filters.status;
      const isOnline =
        filters.channel === 'all' ? undefined : filters.channel === 'online';

      const [analyticsPayload, orderPayload] = await Promise.all([
        analyticsService.fetchSalesAnalytics({
          startDate: startIso,
          endDate: endIso,
          outletId,
        }),
        orderService.getAll({
          startDate: startIso,
          endDate: endIso,
          outletId,
          status,
          isOnline,
        }),
      ]);

      setAnalytics(analyticsPayload);
      setOrders(orderPayload);
    } catch (err) {
      console.error('Failed to load sales insights', err);
      setError('Unable to load sales insights. Please adjust filters or retry.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadInsights();
  }, [loadInsights]);

  const completedOrders = useMemo(
    () => orders.filter((order) => order.status === 'COMPLETED'),
    [orders],
  );
  const refundedOrders = useMemo(
    () => orders.filter((order) => order.status === 'REFUNDED'),
    [orders],
  );

  const fallbackTotalSales = useMemo(
    () => completedOrders.reduce((acc, order) => acc + (order.totalAmount ?? 0), 0),
    [completedOrders],
  );
  const fallbackAverageOrderValue = useMemo(() => {
    const orderCount = completedOrders.length;
    if (!orderCount) {
      return 0;
    }
    return fallbackTotalSales / orderCount;
  }, [completedOrders, fallbackTotalSales]);

  const totalDiscounts = useMemo(
    () => orders.reduce((acc, order) => acc + (order.discountAmount ?? 0), 0),
    [orders],
  );
  const totalTaxFromOrders = useMemo(
    () => orders.reduce((acc, order) => acc + (order.taxAmount ?? 0), 0),
    [orders],
  );
  const totalRefundedAmount = useMemo(
    () => refundedOrders.reduce((acc, order) => acc + (order.totalAmount ?? 0), 0),
    [refundedOrders],
  );

  const estimatedProfit = useMemo(() => {
    const netSales = analytics?.netSales ?? fallbackTotalSales;
    const tax = analytics?.totalTax ?? totalTaxFromOrders;
    const discounts = analytics?.grossDiscountAmount ?? totalDiscounts;
    const returns = analytics?.totalReturns ?? totalRefundedAmount;
    const profit = netSales - tax - discounts - returns;
    return profit < 0 ? 0 : profit;
  }, [
    analytics?.grossDiscountAmount,
    analytics?.netSales,
    analytics?.totalReturns,
    analytics?.totalTax,
    fallbackTotalSales,
    totalDiscounts,
    totalRefundedAmount,
    totalTaxFromOrders,
  ]);

  const outletPerformance = useMemo(() => {
    const grouped = new Map<
      number,
      { outletName: string; totalSales: number; orderCount: number }
    >();
    completedOrders.forEach((order) => {
      if (!order.outletId) {
        return;
      }
      const current = grouped.get(order.outletId);
      if (current) {
        current.totalSales += order.totalAmount ?? 0;
        current.orderCount += 1;
      } else {
        grouped.set(order.outletId, {
          outletName: order.outletName ?? `Outlet ${order.outletId}`,
          totalSales: order.totalAmount ?? 0,
          orderCount: 1,
        });
      }
    });
    return Array.from(grouped.entries()).map(([outletId, data]) => ({
      outletId,
      ...data,
    }));
  }, [completedOrders]);

  const channelBreakdown = useMemo(() => {
    const data = {
      online: { orders: 0, sales: 0 },
      instore: { orders: 0, sales: 0 },
    };
    completedOrders.forEach((order) => {
      const bucket = order.isOnline ? data.online : data.instore;
      bucket.orders += 1;
      bucket.sales += order.totalAmount ?? 0;
    });
    return data;
  }, [completedOrders]);

  const topOrders = useMemo(
    () =>
      [...completedOrders]
        .sort((a, b) => (b.totalAmount ?? 0) - (a.totalAmount ?? 0))
        .slice(0, 5),
    [completedOrders],
  );

  const derivedItemsSold = useMemo(
    () =>
      completedOrders.reduce((acc, order) => {
        if (!Array.isArray(order.items)) {
          return acc;
        }
        const orderItems = order.items.reduce(
          (itemAcc, item) => itemAcc + (item.quantity ?? 0),
          0,
        );
        return acc + orderItems;
      }, 0),
    [completedOrders],
  );
  const totalItemsSold = analytics?.totalItemsSold ?? derivedItemsSold;

  const handleFilterChange = (patch: Partial<SalesFilterState>) => {
    setFilters((current) => ({
      ...current,
      ...patch,
    }));
  };

  const applyQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (days - 1));
    handleFilterChange({
      startDate: buildDateInput(start),
      endDate: buildDateInput(end),
    });
  };

  return (
    <AdminLayout>
      <ToastContainer />
      <AdminPageHeader
        title="Sales Insights"
        description="Review sales summaries, profitability metrics, and detailed transactional analysis."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="px-3 py-1 text-sm font-medium rounded-full border border-slate-300 hover:bg-slate-100"
              onClick={() => applyQuickRange(7)}
            >
              Last 7 days
            </button>
            <button
              className="px-3 py-1 text-sm font-medium rounded-full border border-slate-300 hover:bg-slate-100"
              onClick={() => applyQuickRange(30)}
            >
              Last 30 days
            </button>
          </div>
        }
      />

      <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col text-sm font-medium text-slate-600">
            Start date
            <input
              type="date"
              value={filters.startDate}
              onChange={(event) => handleFilterChange({ startDate: event.target.value })}
              max={filters.endDate}
              className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-600">
            End date
            <input
              type="date"
              value={filters.endDate}
              onChange={(event) => handleFilterChange({ endDate: event.target.value })}
              min={filters.startDate}
              className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-600">
            Outlet
            <select
              value={filters.outletId}
              onChange={(event) => handleFilterChange({ outletId: event.target.value })}
              className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All outlets</option>
              {assignedOutlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-600">
            Order status
            <select
              value={filters.status}
              onChange={(event) =>
                handleFilterChange({ status: event.target.value as SalesFilterState['status'] })
              }
              className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="PREPARING">Preparing</option>
              <option value="READY">Ready</option>
              <option value="ON_HOLD">On hold</option>
              <option value="DRAFT">Draft</option>
              <option value="REFUNDED">Refunded</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-600">
            Channel
            <select
              value={filters.channel}
              onChange={(event) =>
                handleFilterChange({ channel: event.target.value as ChannelFilter })
              }
              className="mt-1 rounded-lg border border-slate-200 px-3 py-2 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All channels</option>
              <option value="online">Online only</option>
              <option value="instore">In store only</option>
            </select>
          </label>
          <div className="flex items-end gap-3">
            <button
              className="flex-1 rounded-lg bg-blue-600 text-white font-semibold py-2 hover:bg-blue-700 disabled:bg-slate-300"
              onClick={() => void loadInsights()}
              disabled={isLoading}
            >
              {isLoading ? 'Refreshing…' : 'Apply filters'}
            </button>
            <button
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => setFilters(createDefaultFilters())}
              disabled={isLoading}
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      {error && (
        <Alert
          type="error"
          message={error}
          className="mb-6"
        />
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total sales</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {formatCurrency(analytics?.totalSales ?? fallbackTotalSales)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Net sales</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {formatCurrency(analytics?.netSales ?? fallbackTotalSales)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Estimated profit</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-600">
            {formatCurrency(estimatedProfit)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Average order value</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {formatCurrency(analytics?.averageOrderValue ?? fallbackAverageOrderValue)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Total orders</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {formatNumber(analytics?.totalOrders ?? completedOrders.length)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Items sold</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {formatNumber(totalItemsSold)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Discount impact</p>
          <p className="mt-2 text-3xl font-semibold text-rose-600">
            {formatCurrency(analytics?.grossDiscountAmount ?? totalDiscounts)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Tax collected</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">
            {formatCurrency(analytics?.totalTax ?? totalTaxFromOrders)}
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Order performance</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="rounded-xl border border-slate-200 p-4">
              <dt className="text-slate-500">Completed orders</dt>
              <dd className="mt-2 text-2xl font-semibold text-slate-900">
                {formatNumber(completedOrders.length)}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <dt className="text-slate-500">Refunded orders</dt>
              <dd className="mt-2 text-2xl font-semibold text-slate-900">
                {formatNumber(refundedOrders.length)}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <dt className="text-slate-500">Average items per order</dt>
              <dd className="mt-2 text-2xl font-semibold text-slate-900">
                {completedOrders.length
                  ? formatNumber(Math.round((totalItemsSold || 0) / completedOrders.length))
                  : formatNumber(0)}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <dt className="text-slate-500">Highest order value</dt>
              <dd className="mt-2 text-2xl font-semibold text-slate-900">
                {formatCurrency(topOrders[0]?.totalAmount ?? 0)}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Revenue breakdown</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Gross sales</span>
              <span className="font-semibold">
                {formatCurrency(analytics?.totalSales ?? fallbackTotalSales)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Discounts</span>
              <span className="font-semibold text-rose-600">
                -{formatCurrency(analytics?.grossDiscountAmount ?? totalDiscounts)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Taxes</span>
              <span className="font-semibold">
                {formatCurrency(analytics?.totalTax ?? totalTaxFromOrders)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Refunds</span>
              <span className="font-semibold text-rose-600">
                -{formatCurrency(totalRefundedAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-500">Net sales</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(analytics?.netSales ?? fallbackTotalSales)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Estimated profit</span>
              <span className="font-semibold text-emerald-600">
                {formatCurrency(estimatedProfit)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Channel insights</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between border border-slate-100 rounded-xl px-4 py-3">
              <div>
                <p className="text-slate-500">Online</p>
                <p className="text-xs text-slate-400">Digital and delivery orders</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-slate-900">
                  {formatNumber(channelBreakdown.online.orders)} orders
                </p>
                <p className="text-sm text-slate-500">
                  {formatCurrency(channelBreakdown.online.sales)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between border border-slate-100 rounded-xl px-4 py-3">
              <div>
                <p className="text-slate-500">In store</p>
                <p className="text-xs text-slate-400">Counter, dine-in, or takeaway</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-slate-900">
                  {formatNumber(channelBreakdown.instore.orders)} orders
                </p>
                <p className="text-sm text-slate-500">
                  {formatCurrency(channelBreakdown.instore.sales)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Top outlets</h2>
          {outletPerformance.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No outlet activity for the selected filters.</p>
          ) : (
            <table className="mt-4 w-full text-left text-sm">
              <thead>
                <tr className="text-slate-500">
                  <th className="py-2 font-medium">Outlet</th>
                  <th className="py-2 font-medium text-right">Orders</th>
                  <th className="py-2 font-medium text-right">Sales</th>
                </tr>
              </thead>
              <tbody>
                {outletPerformance
                  .sort((a, b) => b.totalSales - a.totalSales)
                  .slice(0, 5)
                  .map((outlet) => (
                    <tr key={outlet.outletId} className="border-t border-slate-100">
                      <td className="py-2">{outlet.outletName}</td>
                      <td className="py-2 text-right">{formatNumber(outlet.orderCount)}</td>
                      <td className="py-2 text-right">{formatCurrency(outlet.totalSales)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Highest value orders</h2>
        {topOrders.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">There are no orders in this range.</p>
        ) : (
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="py-2 font-medium">Order #</th>
                <th className="py-2 font-medium">Outlet</th>
                <th className="py-2 font-medium text-right">Amount</th>
                <th className="py-2 font-medium">Cashier</th>
                <th className="py-2 font-medium">Channel</th>
              </tr>
            </thead>
            <tbody>
              {topOrders.map((order) => (
                <tr key={order.id} className="border-t border-slate-100">
                  <td className="py-2 font-medium text-slate-900">{order.orderNumber}</td>
                  <td className="py-2">{order.outletName}</td>
                  <td className="py-2 text-right">{formatCurrency(order.totalAmount ?? 0)}</td>
                  <td className="py-2">
                    {order.cashierName ?? order.cashierUsername ?? '—'}
                  </td>
                  <td className="py-2">{order.isOnline ? 'Online' : 'In store'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AdminLayout>
  );
};

export default SalesInsightsPage;
