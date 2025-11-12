import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import Alert from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import { analyticsService } from '../../../services/analyticsService';
import { outletService } from '../../../services/outletService';
import { statisticsService, type DailySalesReport } from '../../../services/statisticsService';
import type { SalesAnalytics } from '../../../types/analytics';
import type { Outlet } from '../../../types/outlet';

type DatePreset =
  | 'today'
  | 'yesterday'
  | 'last7Days'
  | 'last30Days'
  | 'thisMonth'
  | 'lastMonth'
  | 'custom';

type MetricFormat = 'currency' | 'count' | 'decimal';

type MetricKey = keyof SalesAnalytics;

interface MetricConfig {
  key: MetricKey;
  label: string;
  description: string;
  format: MetricFormat;
}

interface AnalyticsFiltersState {
  preset: DatePreset;
  startDate: string;
  endDate: string;
  outletId: string;
}

interface ChartDataPoint {
  dateLabel: string;
  current: number;
  previous: number;
}

const metricConfigs: MetricConfig[] = [
  {
    key: 'totalSales',
    label: 'Total Sales',
    description: 'Sum of all completed order totals.',
    format: 'currency',
  },
  {
    key: 'netSales',
    label: 'Net Sales',
    description: 'Sales minus refunds and returns.',
    format: 'currency',
  },
  {
    key: 'totalOrders',
    label: 'Orders',
    description: 'Number of completed orders.',
    format: 'count',
  },
  {
    key: 'averageOrderValue',
    label: 'Average Order Value',
    description: 'Average value per completed order.',
    format: 'currency',
  },
  {
    key: 'totalItemsSold',
    label: 'Items Sold',
    description: 'Total quantity of items sold.',
    format: 'decimal',
  },
  {
    key: 'totalReturns',
    label: 'Returns',
    description: 'Count of refunded orders.',
    format: 'count',
  },
  {
    key: 'discountedOrders',
    label: 'Discounted Orders',
    description: 'Orders with discounts applied.',
    format: 'count',
  },
  {
    key: 'grossDiscountAmount',
    label: 'Gross Discounted',
    description: 'Total discount amount applied.',
    format: 'currency',
  },
  {
    key: 'totalTax',
    label: 'Total Tax',
    description: 'Tax collected from completed orders.',
    format: 'currency',
  },
  {
    key: 'averageOrderTax',
    label: 'Order Tax',
    description: 'Average tax collected per order.',
    format: 'currency',
  },
];

const zeroAnalytics: SalesAnalytics = {
  totalSales: 0,
  netSales: 0,
  totalOrders: 0,
  averageOrderValue: 0,
  totalItemsSold: 0,
  totalReturns: 0,
  discountedOrders: 0,
  grossDiscountAmount: 0,
  totalTax: 0,
  averageOrderTax: 0,
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const countFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

const decimalFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const rangeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const shortRangeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
});

const dayInMs = 24 * 60 * 60 * 1000;

const toInputDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const calculatePresetRange = (preset: DatePreset): { start: string; end: string } => {
  const today = new Date();
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  switch (preset) {
    case 'today': {
      const start = normalizedToday;
      return { start: toInputDate(start), end: toInputDate(start) };
    }
    case 'yesterday': {
      const start = new Date(normalizedToday.getTime() - dayInMs);
      return { start: toInputDate(start), end: toInputDate(start) };
    }
    case 'last7Days': {
      const end = normalizedToday;
      const start = new Date(end.getTime() - 6 * dayInMs);
      return { start: toInputDate(start), end: toInputDate(end) };
    }
    case 'last30Days': {
      const end = normalizedToday;
      const start = new Date(end.getTime() - 29 * dayInMs);
      return { start: toInputDate(start), end: toInputDate(end) };
    }
    case 'thisMonth': {
      const start = new Date(normalizedToday.getFullYear(), normalizedToday.getMonth(), 1);
      const end = normalizedToday;
      return { start: toInputDate(start), end: toInputDate(end) };
    }
    case 'lastMonth': {
      const start = new Date(normalizedToday.getFullYear(), normalizedToday.getMonth() - 1, 1);
      const end = new Date(normalizedToday.getFullYear(), normalizedToday.getMonth(), 0);
      return { start: toInputDate(start), end: toInputDate(end) };
    }
    case 'custom':
    default:
      return { start: toInputDate(normalizedToday), end: toInputDate(normalizedToday) };
  }
};

const parseDate = (value: string): Date => {
  if (!value) {
    return new Date(NaN);
  }
  return new Date(`${value}T00:00:00`);
};

const toIsoUtc = (date: Date, endOfDay = false): string => {
  return new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      endOfDay ? 23 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 59 : 0,
      endOfDay ? 999 : 0,
    ),
  ).toISOString();
};

const getDayCount = (start: Date, end: Date): number => {
  const diff = end.getTime() - start.getTime();
  if (Number.isNaN(diff)) {
    return 0;
  }
  return Math.max(1, Math.floor(diff / dayInMs) + 1);
};

const getPreviousRange = (start: Date, end: Date): { start: Date; end: Date } => {
  const dayCount = getDayCount(start, end);
  const prevEnd = new Date(start.getTime() - dayInMs);
  const prevStart = new Date(prevEnd.getTime() - (dayCount - 1) * dayInMs);
  return { start: prevStart, end: prevEnd };
};

const formatRange = (start: Date, end: Date): string => {
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return '—';
  }
  if (start.toDateString() === end.toDateString()) {
    return rangeFormatter.format(start);
  }
  return `${rangeFormatter.format(start)} - ${rangeFormatter.format(end)}`;
};

const formatRangeShort = (start: Date, end: Date): string => {
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'previous period';
  }
  if (start.toDateString() === end.toDateString()) {
    return shortRangeFormatter.format(start);
  }
  return `${shortRangeFormatter.format(start)} - ${shortRangeFormatter.format(end)}`;
};

const formatMetricValue = (value: number, format: MetricFormat): string => {
  switch (format) {
    case 'currency':
      return currencyFormatter.format(value);
    case 'count':
      return countFormatter.format(value);
    case 'decimal':
    default:
      return decimalFormatter.format(value);
  }
};

const generateTrendData = (
  currentTotal: number,
  previousTotal: number,
  startDate: Date,
  dayCount: number,
): ChartDataPoint[] => {
  if (dayCount <= 0 || Number.isNaN(startDate.getTime())) {
    return [];
  }

  if (dayCount === 1) {
    return [
      {
        dateLabel: shortRangeFormatter.format(startDate),
        current: currentTotal,
        previous: previousTotal,
      },
    ];
  }

  const weights = Array.from({ length: dayCount }, (_, index) => {
    const progress = index / (dayCount - 1);
    return 0.6 + Math.sin(Math.PI * progress) + progress * 0.4;
  });

  const weightSum = weights.reduce((acc, weight) => acc + weight, 0) || 1;
  const currentScale = currentTotal / weightSum;
  const previousScale = previousTotal / weightSum;

  return weights.map((weight, index) => {
    const day = new Date(startDate.getTime() + index * dayInMs);
    return {
      dateLabel: shortRangeFormatter.format(day),
      current: currentScale * weight,
      previous: previousScale * weight,
    };
  });
};

const MiniLineChart: React.FC<{ data: ChartDataPoint[] }> = ({ data }) => {
  const width = 300;
  const height = 120;
  const paddingX = 16;
  const paddingY = 14;

  if (!data.length) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg bg-slate-50 text-xs text-slate-400">
        No trend data
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.map((point) => Math.max(point.current, point.previous)),
    1,
  );
  const minValue = 0;
  const range = Math.max(maxValue - minValue, maxValue);

  const xForIndex = (index: number): number => {
    if (data.length === 1) {
      return width / 2;
    }
    return paddingX + ((width - paddingX * 2) * index) / (data.length - 1);
  };

  const yForValue = (value: number): number => {
    const safeValue = Number.isFinite(value) ? value : 0;
    const ratio = (safeValue - minValue) / range;
    return height - paddingY - ratio * (height - paddingY * 2);
  };

  const buildPath = (key: 'current' | 'previous'): string => {
    return data
      .map((point, index) => {
        const command = index === 0 ? 'M' : 'L';
        const x = xForIndex(index).toFixed(2);
        const y = yForValue(point[key]).toFixed(2);
        return `${command}${x} ${y}`;
      })
      .join(' ');
  };

  const previousPath = buildPath('previous');
  const currentPath = buildPath('current');
  const lastPoint = data[data.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-28 w-full" role="img" aria-hidden>
      <line
        x1={paddingX}
        y1={height - paddingY}
        x2={width - paddingX}
        y2={height - paddingY}
        stroke="#E5E7EB"
        strokeDasharray="6 6"
      />
      <path d={previousPath} fill="none" stroke="#A5B4FC" strokeWidth={2} strokeDasharray="4 4" strokeLinecap="round" />
      <path d={currentPath} fill="none" stroke="#2563EB" strokeWidth={2.5} strokeLinecap="round" />
      <circle
        cx={xForIndex(data.length - 1)}
        cy={yForValue(lastPoint.current)}
        r={4}
        fill="#1D4ED8"
        stroke="#FFFFFF"
        strokeWidth={1.5}
      />
    </svg>
  );
};

const StatisticsPage: React.FC = () => {
  const defaultRange = calculatePresetRange('today');
  const [filters, setFilters] = useState<AnalyticsFiltersState>({
    preset: 'today',
    startDate: defaultRange.start,
    endDate: defaultRange.end,
    outletId: 'all',
  });

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [outletError, setOutletError] = useState<string | null>(null);

  const [currentAnalytics, setCurrentAnalytics] = useState<SalesAnalytics | null>(null);
  const [previousAnalytics, setPreviousAnalytics] = useState<SalesAnalytics | null>(null);
  const [dailySalesReport, setDailySalesReport] = useState<DailySalesReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const startDateObj = useMemo(() => parseDate(filters.startDate), [filters.startDate]);
  const endDateObj = useMemo(() => parseDate(filters.endDate), [filters.endDate]);

  const startTimestamp = startDateObj.getTime();
  const endTimestamp = endDateObj.getTime();

  const validationMessage = useMemo(() => {
    if (Number.isNaN(startTimestamp) || Number.isNaN(endTimestamp)) {
      return 'Select a valid start and end date.';
    }
    if (startTimestamp > endTimestamp) {
      return 'Start date cannot be after end date.';
    }
    return null;
  }, [startTimestamp, endTimestamp]);

  const dayCount = useMemo(() => {
    if (validationMessage) {
      return 0;
    }
    return getDayCount(startDateObj, endDateObj);
  }, [validationMessage, startTimestamp, endTimestamp]);

  const previousRange = useMemo(() => {
    if (validationMessage) {
      const fallback = new Date();
      return { start: fallback, end: fallback };
    }
    return getPreviousRange(startDateObj, endDateObj);
  }, [validationMessage, startTimestamp, endTimestamp]);

  const previousStartTimestamp = previousRange.start.getTime();
  const previousEndTimestamp = previousRange.end.getTime();

  const rangeLabel = useMemo(() => formatRange(startDateObj, endDateObj), [startTimestamp, endTimestamp]);
  const previousRangeLabel = useMemo(
    () => formatRangeShort(previousRange.start, previousRange.end),
    [previousStartTimestamp, previousEndTimestamp],
  );

  const netOpenCashDrawerAmount = useMemo(() => {
    if (!dailySalesReport) {
      return 0;
    }
    return dailySalesReport.openCashDrawerAmount - dailySalesReport.actualClosingBalance;
  }, [dailySalesReport]);

  useEffect(() => {
    let active = true;
    outletService
      .getAll()
      .then((response) => {
        if (active) {
          setOutlets(response);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          const message = error instanceof Error ? error.message : 'Unable to load outlets.';
          setOutletError(message);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Fetch today's daily sales report for cash drawer metrics
  useEffect(() => {
    let active = true;
    
    // Only fetch if a specific outlet is selected
    if (filters.outletId !== 'all') {
      const outletId = Number(filters.outletId);
      
      // Don't pass date parameter - let server use its today to avoid timezone issues
      statisticsService.getDailySalesReport(outletId)
        .then((report) => {
          if (active) {
            setDailySalesReport(report);
          }
        })
        .catch((error: unknown) => {
          console.error('Failed to load daily sales report', error);
          // Don't show error as this is optional data
          if (active) {
            setDailySalesReport(null);
          }
        });
    } else {
      setDailySalesReport(null);
    }

    return () => {
      active = false;
    };
  }, [filters.outletId, reloadKey]);

  useEffect(() => {
    if (validationMessage) {
      setFetchError(validationMessage);
      setCurrentAnalytics(null);
      setPreviousAnalytics(null);
      setLoading(false);
      return;
    }

    let active = true;
    const outletIdParam = filters.outletId === 'all' ? undefined : Number(filters.outletId);

    setLoading(true);
    setFetchError(null);

    Promise.all([
      analyticsService.fetchSalesAnalytics({
        outletId: outletIdParam,
        startDate: toIsoUtc(startDateObj),
        endDate: toIsoUtc(endDateObj, true),
      }),
      analyticsService.fetchSalesAnalytics({
        outletId: outletIdParam,
        startDate: toIsoUtc(previousRange.start),
        endDate: toIsoUtc(previousRange.end, true),
      }),
    ])
      .then(([currentResponse, previousResponse]) => {
        if (!active) {
          return;
        }
        setCurrentAnalytics(currentResponse);
        setPreviousAnalytics(previousResponse);
        setLastUpdated(new Date());
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        const message = error instanceof Error ? error.message : 'Failed to load analytics data.';
        setFetchError(message);
        setCurrentAnalytics(null);
        setPreviousAnalytics(null);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [
    filters.outletId,
    startTimestamp,
    endTimestamp,
    previousStartTimestamp,
    previousEndTimestamp,
    validationMessage,
    reloadKey,
  ]);

  const chartDataMap = useMemo(() => {
    if (!currentAnalytics) {
      return {} as Record<MetricKey, ChartDataPoint[]>;
    }

    const previous = previousAnalytics ?? zeroAnalytics;
    return metricConfigs.reduce<Record<MetricKey, ChartDataPoint[]>>((acc, metric) => {
      acc[metric.key] = generateTrendData(
        currentAnalytics[metric.key],
        previous[metric.key],
        startDateObj,
        dayCount,
      );
      return acc;
    }, {} as Record<MetricKey, ChartDataPoint[]>);
  }, [currentAnalytics, previousAnalytics, dayCount, startTimestamp, endTimestamp]);

  const handlePresetChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = event.target.value as DatePreset;
    setFilters((prev) => {
      if (selected === 'custom') {
        return { ...prev, preset: selected };
      }
      const range = calculatePresetRange(selected);
      return {
        ...prev,
        preset: selected,
        startDate: range.start,
        endDate: range.end,
      };
    });
  }, []);

  const handleStartDateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFilters((prev) => ({ ...prev, preset: 'custom', startDate: value }));
  }, []);

  const handleEndDateChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFilters((prev) => ({ ...prev, preset: 'custom', endDate: value }));
  }, []);

  const handleOutletChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setFilters((prev) => ({ ...prev, outletId: value }));
  }, []);

  const triggerRefresh = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  const effectiveError = fetchError;

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8">
        <AdminPageHeader
          title="Analytics"
          description="Visualize Point of Sale performance by outlet, time period, and key revenue drivers."
          meta={
            <span className="whitespace-nowrap text-sm text-slate-500">
              Showing {rangeLabel}. Comparing against {previousRangeLabel}.
            </span>
          }
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
              <span className="whitespace-nowrap">
                Range {rangeLabel} • vs {previousRangeLabel}
              </span>
              {lastUpdated && (
                <span className="whitespace-nowrap text-xs text-slate-400">
                  Updated {timeFormatter.format(lastUpdated)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="analytics-date-range" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date Range
                </label>
                <select
                  id="analytics-date-range"
                  value={filters.preset}
                  onChange={handlePresetChange}
                  className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="last7Days">Last 7 days</option>
                  <option value="last30Days">Last 30 days</option>
                  <option value="thisMonth">This month</option>
                  <option value="lastMonth">Last month</option>
                  <option value="custom">Custom range</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="analytics-start-date" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Start Date
                </label>
                <input
                  id="analytics-start-date"
                  type="date"
                  value={filters.startDate}
                  onChange={handleStartDateChange}
                  className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="analytics-end-date" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  End Date
                </label>
                <input
                  id="analytics-end-date"
                  type="date"
                  value={filters.endDate}
                  onChange={handleEndDateChange}
                  className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="analytics-outlet" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Outlet
                </label>
                <select
                  id="analytics-outlet"
                  value={filters.outletId}
                  onChange={handleOutletChange}
                  className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">All outlets</option>
                  {outlets.map((outlet) => (
                    <option key={outlet.id} value={String(outlet.id)}>
                      {outlet.name}
                    </option>
                  ))}
                </select>
                {outletError && <span className="text-xs text-red-500">{outletError}</span>}
              </div>

              <div className="flex flex-col justify-end gap-3">
                <button
                  type="button"
                  onClick={triggerRefresh}
                  disabled={loading}
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {loading ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Today's Cash Drawer Metrics - Only shown for specific outlet */}
        {dailySalesReport && filters.outletId !== 'all' && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Today's Cash Drawer</h3>
              <p className="text-sm text-slate-500">Real-time cash flow metrics for the selected outlet</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Open Drawer Amount</p>
                <p className="mt-2 text-2xl font-bold text-red-700">
                  {currencyFormatter.format(netOpenCashDrawerAmount)}
                </p>
                <p className="mt-1 text-xs text-red-600">Opening sum minus closing sum</p>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Today's Cash Sale</p>
                <p className="mt-2 text-2xl font-bold text-emerald-700">
                  {currencyFormatter.format(dailySalesReport.todaysCashSale)}
                </p>
                <p className="mt-1 text-xs text-emerald-600">Cash payments only</p>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Today's Total Sale</p>
                <p className="mt-2 text-2xl font-bold text-blue-700">
                  {currencyFormatter.format(dailySalesReport.todaysTotalSale)}
                </p>
                <p className="mt-1 text-xs text-blue-600">All payment methods</p>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Expected Drawer</p>
                <p className="mt-2 text-2xl font-bold text-amber-700">
                  {currencyFormatter.format(dailySalesReport.expectedDrawerAmount)}
                </p>
                <p className="mt-1 text-xs text-amber-600">Calculated total</p>
              </div>
            </div>
          </section>
        )}

        {effectiveError ? (
          <ToastContainer>
            <Alert
              type="error"
              title="Analytics unavailable"
              message={effectiveError}
              onClose={() => setFetchError(null)}
            />
          </ToastContainer>
        ) : (
          <>
            {loading && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {metricConfigs.map((metric) => (
                  <div
                    key={metric.key}
                    className="h-56 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="h-full animate-pulse rounded-lg bg-slate-100" />
                  </div>
                ))}
              </div>
            )}

            {!loading && currentAnalytics && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {metricConfigs.map((metric) => {
              const currentValue = currentAnalytics[metric.key];
              const previousValue = (previousAnalytics ?? zeroAnalytics)[metric.key];
              const delta = currentValue - previousValue;
              const change = previousValue === 0
                ? currentValue === 0
                  ? { label: '0%', tone: 'neutral' as const }
                  : { label: 'New', tone: 'positive' as const }
                : {
                    label: `${delta >= 0 ? '+' : ''}${percentFormatter.format(
                      (delta / previousValue) * 100,
                    )}%`,
                    tone: delta >= 0 ? ('positive' as const) : ('negative' as const),
                  };

              const changeClasses = change.tone === 'positive'
                ? 'bg-emerald-100 text-emerald-700'
                : change.tone === 'negative'
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-slate-100 text-slate-600';

              return (
                <div
                  key={metric.key}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">{metric.label}</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900">
                        {formatMetricValue(currentValue, metric.format)}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${changeClasses}`}>
                      {change.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{metric.description}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Prev: {formatMetricValue(previousValue, metric.format)}
                    </span>
                    <span>
                      vs {previousRangeLabel}
                    </span>
                  </div>
                  <MiniLineChart data={chartDataMap[metric.key] ?? []} />
                </div>
              );
                })}
              </div>
            )}

            {!loading && !currentAnalytics && (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                No analytics data available for the selected filters.
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default StatisticsPage;
