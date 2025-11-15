import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import ToastContainer from '../../../components/common/ToastContainer';
import Alert from '../../../components/common/Alert';
import { analyticsService } from '../../../services/analyticsService';
import { orderService } from '../../../services/orderService';
import type { Order } from '../../../types/order';
import type { SalesAnalytics } from '../../../types/analytics';
import { useOutlet } from '../../../contexts/OutletContext';
import { formatCurrency, formatNumber } from '../../../utils/dashboardFormatting';

type QuickRange = 'TODAY' | 'LAST_7' | 'LAST_30' | 'CUSTOM';
type GroupingMode = 'day' | 'week';

interface FiltersState {
  quickRange: QuickRange;
  startDate: string;
  endDate: string;
  outletId: string;
  grouping: GroupingMode;
}

interface ChartSeries {
  labels: string[];
  current: number[];
  previous: number[];
}

interface BucketRecord {
  rangeLabel: string;
  start: Date;
  end: Date;
}

interface AggregatedBucket {
  totalSales: number;
  netSales: number;
  orderCount: number;
  itemsSold: number;
  returns: number;
  discountedOrders: number;
  grossDiscount: number;
  tax: number;
  orderTaxSum: number;
}

const buildDateInput = (date: Date) => date.toISOString().split('T')[0];

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const endOfDayExclusive = (date: Date) => {
  const copy = startOfDay(date);
  copy.setDate(copy.getDate() + 1);
  return copy;
};

const subtractYear = (date: Date) => {
  const copy = new Date(date);
  copy.setFullYear(copy.getFullYear() - 1);
  return copy;
};

const getQuickRangeDates = (range: QuickRange): { start: Date; end: Date } => {
  const today = startOfDay(new Date());
  switch (range) {
    case 'TODAY':
      return { start: today, end: today };
    case 'LAST_7': {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      return { start, end: today };
    }
    case 'LAST_30': {
      const start = new Date(today);
      start.setDate(today.getDate() - 29);
      return { start, end: today };
    }
    default:
      return { start: today, end: today };
  }
};

const toIsoRange = (start: Date, end: Date) => ({
  startIso: startOfDay(start).toISOString(),
  endIso: endOfDayExclusive(end).toISOString(),
});

const buildBuckets = (start: Date, end: Date, mode: GroupingMode): BucketRecord[] => {
  const buckets: BucketRecord[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const bucketStart = new Date(cursor);
    const bucketEnd = new Date(cursor);
    if (mode === 'week') {
      bucketEnd.setDate(bucketEnd.getDate() + 6);
    }
    const label =
      mode === 'week'
        ? `Week of ${bucketStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
        : bucketStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    buckets.push({
      rangeLabel: label,
      start: startOfDay(bucketStart),
      end: endOfDayExclusive(bucketEnd),
    });

    cursor.setDate(cursor.getDate() + (mode === 'week' ? 7 : 1));
  }
  return buckets;
};

const aggregateOrdersIntoBuckets = (
  orders: Order[],
  buckets: BucketRecord[],
): AggregatedBucket[] => {
  const template: AggregatedBucket = {
    totalSales: 0,
    netSales: 0,
    orderCount: 0,
    itemsSold: 0,
    returns: 0,
    discountedOrders: 0,
    grossDiscount: 0,
    tax: 0,
    orderTaxSum: 0,
  };

  const aggregates = buckets.map(() => ({ ...template }));
  orders.forEach((order) => {
    const timestamp = order.completedDate ?? order.createdDate;
    const orderDate = timestamp ? new Date(timestamp) : null;
    if (!orderDate) {
      return;
    }
    const bucketIndex = buckets.findIndex(
      (bucket) => orderDate >= bucket.start && orderDate < bucket.end,
    );
    if (bucketIndex === -1) {
      return;
    }
    const bucket = aggregates[bucketIndex];
    const total = order.totalAmount ?? 0;
    const discount = order.discountAmount ?? 0;
    const tax = order.taxAmount ?? 0;

    bucket.totalSales += total;
    bucket.netSales += order.status === 'REFUNDED' ? 0 : total;
    bucket.orderCount += 1;
    bucket.itemsSold += order.items?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) ?? 0;
    bucket.returns += order.status === 'REFUNDED' ? total : 0;
    bucket.discountedOrders += discount > 0 ? 1 : 0;
    bucket.grossDiscount += discount;
    bucket.tax += tax;
    bucket.orderTaxSum += tax;
  });

  return aggregates.map((bucket) => ({
    ...bucket,
    orderTaxSum: bucket.orderCount > 0 ? bucket.orderTaxSum / bucket.orderCount : 0,
  }));
};

const combineSeries = (
  currentBuckets: AggregatedBucket[],
  previousBuckets: AggregatedBucket[],
  metric: keyof AggregatedBucket,
): ChartSeries => {
  return {
    labels: currentBuckets.map((_bucket, index) => index.toString()),
    current: currentBuckets.map((bucket) => bucket[metric]),
    previous: previousBuckets.map((bucket) => bucket[metric]),
  };
};

const MiniLineChart: React.FC<ChartSeries & { currency?: boolean }> = ({
  current,
  previous,
}) => {
  const width = 260;
  const height = 80;
  const margin = 6;
  const maxValue = Math.max(...current, ...previous, 1);

  const buildPoints = (series: number[]) =>
    series
      .map((value, index) => {
        if (series.length === 1) {
          return `${width / 2},${height / 2}`;
        }
        const x = margin + (index / (series.length - 1)) * (width - margin * 2);
        const y =
          height - margin - (value / maxValue) * (height - margin * 2);
        return `${x},${Number.isFinite(y) ? y : height / 2}`;
      })
      .join(' ');

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={buildPoints(previous)}
        fill="none"
        stroke="#34a853"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.4"
      />
      <polyline
        points={buildPoints(current)}
        fill="none"
        stroke="#2563eb"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

interface ChartCardProps {
  title: string;
  currentValue: number;
  previousValue: number;
  formatter?: (value: number) => string;
  series: ChartSeries;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  currentValue,
  previousValue,
  formatter = (value) => value.toString(),
  series,
}) => {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{formatter(currentValue)}</p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <div className="flex items-center gap-2 justify-end">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Current
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Previous year
            </span>
          </div>
          <p className="mt-1">
            Prev: <span className="font-semibold">{formatter(previousValue)}</span>
          </p>
        </div>
      </div>
      <div className="mt-4">
        <MiniLineChart {...series} />
      </div>
    </article>
  );
};

const AdminStatisticsPage: React.FC = () => {
  const { assignedOutlets } = useOutlet();
  const initialRange = getQuickRangeDates('LAST_30');
  const [filters, setFilters] = useState<FiltersState>({
    quickRange: 'LAST_30',
    startDate: buildDateInput(initialRange.start),
    endDate: buildDateInput(initialRange.end),
    outletId: 'all',
    grouping: 'day',
  });
  const [analytics, setAnalytics] = useState<SalesAnalytics | null>(null);
  const [currentOrders, setCurrentOrders] = useState<Order[]>([]);
  const [previousOrders, setPreviousOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedOutletId =
    filters.outletId === 'all' ? undefined : Number.parseInt(filters.outletId, 10);

  const currentRange = useMemo(() => {
    if (filters.quickRange === 'CUSTOM') {
      const start = startOfDay(new Date(filters.startDate));
      const end = startOfDay(new Date(filters.endDate));
      return { start, end };
    }
    return getQuickRangeDates(filters.quickRange);
  }, [filters.endDate, filters.quickRange, filters.startDate]);

  const previousRange = useMemo(() => {
    return {
      start: subtractYear(currentRange.start),
      end: subtractYear(currentRange.end),
    };
  }, [currentRange.end, currentRange.start]);

  const loadStatistics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { startIso, endIso } = toIsoRange(currentRange.start, currentRange.end);
      const { startIso: prevStartIso, endIso: prevEndIso } = toIsoRange(
        previousRange.start,
        previousRange.end,
      );

      const [analyticsResponse, currentOrdersResponse, previousOrdersResponse] = await Promise.all([
        analyticsService.fetchSalesAnalytics({
          startDate: startIso,
          endDate: endIso,
          outletId: selectedOutletId,
        }),
        orderService.getAll({
          startDate: startIso,
          endDate: endIso,
          outletId: selectedOutletId,
        }),
        orderService.getAll({
          startDate: prevStartIso,
          endDate: prevEndIso,
          outletId: selectedOutletId,
        }),
      ]);

      setAnalytics(analyticsResponse);
      setCurrentOrders(currentOrdersResponse);
      setPreviousOrders(previousOrdersResponse);
    } catch (err) {
      console.error('Failed to load statistics data', err);
      setError('Unable to load statistics. Please adjust filters or try again shortly.');
    } finally {
      setIsLoading(false);
    }
  }, [currentRange.end, currentRange.start, previousRange.end, previousRange.start, selectedOutletId]);

  useEffect(() => {
    void loadStatistics();
  }, [loadStatistics]);

  const buckets = useMemo(
    () => buildBuckets(currentRange.start, currentRange.end, filters.grouping),
    [currentRange.end, currentRange.start, filters.grouping],
  );
  const previousBuckets = useMemo(
    () => buildBuckets(previousRange.start, previousRange.end, filters.grouping),
    [previousRange.end, previousRange.start, filters.grouping],
  );

  const bucketAggregates = useMemo(
    () => aggregateOrdersIntoBuckets(currentOrders, buckets),
    [buckets, currentOrders],
  );

  const previousBucketAggregates = useMemo(
    () => aggregateOrdersIntoBuckets(previousOrders, previousBuckets),
    [previousBuckets, previousOrders],
  );

  const charts = useMemo(() => {
    return [
      {
        id: 'total-sales',
        title: 'Total Sales',
        formatter: formatCurrency,
        currentValue: analytics?.totalSales ?? 0,
        previousValue: previousOrders.reduce((sum, order) => sum + (order.totalAmount ?? 0), 0),
        series: combineSeries(bucketAggregates, previousBucketAggregates, 'totalSales'),
      },
      {
        id: 'net-sales',
        title: 'Net Sales',
        formatter: formatCurrency,
        currentValue: analytics?.netSales ?? 0,
        previousValue: previousOrders
          .filter((order) => order.status !== 'REFUNDED')
          .reduce((sum, order) => sum + (order.totalAmount ?? 0), 0),
        series: combineSeries(bucketAggregates, previousBucketAggregates, 'netSales'),
      },
      {
        id: 'orders',
        title: 'Orders',
        formatter: formatNumber,
        currentValue: analytics?.totalOrders ?? currentOrders.length,
        previousValue: previousOrders.length,
        series: combineSeries(bucketAggregates, previousBucketAggregates, 'orderCount'),
      },
      {
        id: 'average-order',
        title: 'Average Order Value',
        formatter: formatCurrency,
        currentValue: analytics?.averageOrderValue ?? 0,
        previousValue:
          previousOrders.length > 0
            ? previousOrders.reduce((sum, order) => sum + (order.totalAmount ?? 0), 0) /
              previousOrders.length
            : 0,
        series: {
          labels: bucketAggregates.map((_record, index) => index.toString()),
          current: bucketAggregates.map((record) =>
            record.orderCount ? record.totalSales / record.orderCount : 0,
          ),
          previous: previousBucketAggregates.map((record) =>
            record.orderCount ? record.totalSales / record.orderCount : 0,
          ),
        },
      },
      {
        id: 'items-sold',
        title: 'Items Sold',
        formatter: formatNumber,
        currentValue: analytics?.totalItemsSold ?? 0,
        previousValue: previousBucketAggregates.reduce((sum, record) => sum + record.itemsSold, 0),
        series: combineSeries(bucketAggregates, previousBucketAggregates, 'itemsSold'),
      },
      {
        id: 'returns',
        title: 'Returns',
        formatter: formatCurrency,
        currentValue: analytics?.totalReturns ?? 0,
        previousValue: previousBucketAggregates.reduce((sum, record) => sum + record.returns, 0),
        series: combineSeries(bucketAggregates, previousBucketAggregates, 'returns'),
      },
      {
        id: 'discounted-orders',
        title: 'Discounted Orders',
        formatter: formatNumber,
        currentValue: analytics?.discountedOrders ?? 0,
        previousValue: previousBucketAggregates.reduce(
          (sum, record) => sum + record.discountedOrders,
          0,
        ),
        series: combineSeries(bucketAggregates, previousBucketAggregates, 'discountedOrders'),
      },
      {
        id: 'gross-discount',
        title: 'Gross Discounted',
        formatter: formatCurrency,
        currentValue: analytics?.grossDiscountAmount ?? 0,
        previousValue: previousBucketAggregates.reduce((sum, record) => sum + record.grossDiscount, 0),
        series: combineSeries(bucketAggregates, previousBucketAggregates, 'grossDiscount'),
      },
      {
        id: 'total-tax',
        title: 'Total Tax',
        formatter: formatCurrency,
        currentValue: analytics?.totalTax ?? 0,
        previousValue: previousBucketAggregates.reduce((sum, record) => sum + record.tax, 0),
        series: combineSeries(bucketAggregates, previousBucketAggregates, 'tax'),
      },
      {
        id: 'order-tax',
        title: 'Order Tax',
        formatter: formatCurrency,
        currentValue: analytics?.averageOrderTax ?? 0,
        previousValue:
          previousOrders.length > 0
            ? previousOrders.reduce((sum, order) => sum + (order.taxAmount ?? 0), 0) /
              previousOrders.length
            : 0,
        series: {
          labels: bucketAggregates.map((_record, index) => index.toString()),
          current: bucketAggregates.map((record) => record.orderTaxSum),
          previous: previousBucketAggregates.map((record) => record.orderTaxSum),
        },
      },
    ];
  }, [
    analytics?.averageOrderTax,
    analytics?.discountedOrders,
    analytics?.grossDiscountAmount,
    analytics?.netSales,
    analytics?.totalItemsSold,
    analytics?.totalOrders,
    analytics?.totalReturns,
    analytics?.totalSales,
    analytics?.totalTax,
    bucketAggregates,
    currentOrders.length,
    previousBucketAggregates,
    previousOrders,
  ]);

  const handleQuickRangeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextRange = event.target.value as QuickRange;
    if (nextRange === 'CUSTOM') {
      setFilters((prev) => ({ ...prev, quickRange: nextRange }));
      return;
    }
    const range = getQuickRangeDates(nextRange);
    setFilters((prev) => ({
      ...prev,
      quickRange: nextRange,
      startDate: buildDateInput(range.start),
      endDate: buildDateInput(range.end),
    }));
  };

  const handleDateChange = (patch: Partial<Pick<FiltersState, 'startDate' | 'endDate'>>) => {
    setFilters((prev) => ({
      ...prev,
      ...patch,
    }));
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8 pb-12">
        <AdminPageHeader
          title="Statistics"
          description="Visualize sales performance by period, outlet, and compare against last year."
        />

        {error && (
          <ToastContainer>
            <Alert
              type="error"
              title="Unable to load statistics"
              message={error}
              onClose={() => setError(null)}
            />
          </ToastContainer>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:flex-wrap">
              <label className="flex flex-col text-sm font-medium text-slate-600">
                Date range
                <select
                  value={filters.quickRange}
                  onChange={handleQuickRangeChange}
                  className="mt-1 w-full min-w-[14rem] rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="TODAY">Today</option>
                  <option value="LAST_7">Last 7 days</option>
                  <option value="LAST_30">Last 30 days</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </label>

              {filters.quickRange === 'CUSTOM' && (
                <div className="flex flex-col gap-4 sm:flex-row">
                  <label className="flex flex-col text-sm font-medium text-slate-600">
                    Start date
                    <input
                      type="date"
                      value={filters.startDate}
                      max={filters.endDate}
                      onChange={(event) => handleDateChange({ startDate: event.target.value })}
                      className="mt-1 w-full min-w-[14rem] rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex flex-col text-sm font-medium text-slate-600">
                    End date
                    <input
                      type="date"
                      value={filters.endDate}
                      min={filters.startDate}
                      onChange={(event) => handleDateChange({ endDate: event.target.value })}
                      className="mt-1 w-full min-w-[14rem] rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:flex-wrap">
              <label className="flex flex-col text-sm font-medium text-slate-600">
                Filter by outlet
                <select
                  value={filters.outletId}
                  onChange={(event) => setFilters((prev) => ({ ...prev, outletId: event.target.value }))}
                  className="mt-1 w-full min-w-[14rem] rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                Grouping
                <select
                  value={filters.grouping}
                  onChange={(event) =>
                    setFilters((prev) => ({ ...prev, grouping: event.target.value as GroupingMode }))
                  }
                  className="mt-1 w-full min-w-[14rem] rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="day">By day</option>
                  <option value="week">By week</option>
                </select>
              </label>
              <button
                className="inline-flex min-w-[10rem] items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-300"
                onClick={() => void loadStatistics()}
                disabled={isLoading}
              >
                {isLoading ? 'Refreshing…' : 'Apply filters'}
              </button>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Comparing {currentRange.start.toLocaleDateString()} – {currentRange.end.toLocaleDateString()} to last year.
          </p>
        </section>

        <section className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Charts</p>
              <p className="text-base text-slate-600">
                Visual comparison between current period and last year.
              </p>
            </div>
            <div className="flex gap-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-blue-500" />
                Current
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                Previous year
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_value, index) => (
                <div key={index} className="h-48 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                  <div className="mt-4 h-8 w-36 animate-pulse rounded bg-slate-200" />
                  <div className="mt-6 h-24 animate-pulse rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : charts.length > 0 && (currentOrders.length > 0 || previousOrders.length > 0 || (analytics?.totalSales ?? 0) > 0) ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {charts.map((chart) => (
                <ChartCard key={chart.id} {...chart} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
              <p className="text-base font-semibold text-slate-900">No statistics available</p>
              <p className="mt-2 text-sm text-slate-500">
                Try expanding the date range or selecting a different outlet to populate these charts.
              </p>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminStatisticsPage;
