import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import Alert, { type AlertType } from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import OrderDetailsModal from '../../../components/admin/orders/OrderDetailsModal';
import RefundModal from '../../../components/cashier/payment/RefundModal';
import { orderService } from '../../../services/orderService';
import { outletService } from '../../../services/outletService';
import type { Order, OrderStatus, OrderType } from '../../../types/order';
import type { Outlet } from '../../../types/outlet';
import { useAuth } from '../../../hooks/useAuth';
import { getUserRoleCodes } from '../../../utils/authRoles';

const ORDER_STATUS_OPTIONS: Array<{ label: string; value: OrderStatus }> = [
  { label: 'All Statuses', value: '' as OrderStatus },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Preparing', value: 'PREPARING' },
  { label: 'Ready', value: 'READY' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Refunded', value: 'REFUNDED' },
  { label: 'On Hold', value: 'ON_HOLD' },
];

const ORDER_TYPE_OPTIONS: Array<{ label: string; value: OrderType | '' }> = [
  { label: 'All Types', value: '' },
  { label: 'Counter', value: 'COUNTER' },
  { label: 'Dine In', value: 'DINE_IN' },
  { label: 'Takeaway', value: 'TAKEAWAY' },
  { label: 'Delivery', value: 'DELIVERY' },
];

const formatCurrency = (value?: number): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
};

const formatDate = (dateString?: string): string => {
  if (!dateString) {
    return '—';
  }
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return '—';
  }
};

const getOrderTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    COUNTER: 'Counter',
    DINE_IN: 'Dine In',
    TAKEAWAY: 'Takeaway',
    DELIVERY: 'Delivery',
  };
  return labels[type] ?? type;
};

const getStatusBadgeClass = (status: string): string => {
  const classes: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-700',
    PENDING: 'bg-blue-100 text-blue-700',
    PREPARING: 'bg-amber-100 text-amber-700',
    READY: 'bg-purple-100 text-purple-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700',
    CANCELLED: 'bg-red-100 text-red-700',
    REFUNDED: 'bg-orange-100 text-orange-700',
    ON_HOLD: 'bg-yellow-100 text-yellow-700',
  };
  return classes[status] ?? 'bg-slate-100 text-slate-700';
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    PENDING: 'Pending',
    PREPARING: 'Preparing',
    READY: 'Ready',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    REFUNDED: 'Refunded',
    ON_HOLD: 'On Hold',
  };
  return labels[status] ?? status;
};

const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const roleCodes = useMemo(() => getUserRoleCodes(user), [user]);
  const isCashier = roleCodes.has('CASHIER');
  const isAdmin = roleCodes.has('ADMIN');

  const [orders, setOrders] = useState<Order[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOutlet, setSelectedOutlet] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [alert, setAlert] = useState<{ type: AlertType; title: string; message: string } | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Refund modal state
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const matchesCurrentCashier = useCallback((order: Order) => {
    const idMatch = user?.cashierId !== undefined && user?.cashierId !== null
      ? order.cashierId === user?.cashierId
      : false;
    const usernameMatch = user?.username ? order.cashierUsername === user.username : false;
    return idMatch || usernameMatch;
  }, [user]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const filters = (!isAdmin && isCashier)
        ? {
            ...(user?.cashierId ? { cashierId: user.cashierId } : {}),
            ...(user?.cashierId ? {} : user?.username ? { cashierUsername: user.username } : {}),
          }
        : undefined;

      const data = await orderService.getAll(filters);
      const scoped = (!isAdmin && isCashier) ? data.filter(matchesCurrentCashier) : data;
      setOrders(scoped);
    } catch (err) {
      console.error('Error loading orders', err);
      setLoadError('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isCashier, matchesCurrentCashier, user]);

  const fetchOutlets = useCallback(async () => {
    try {
      const data = await outletService.getAll();
      setOutlets(data);
    } catch (err) {
      console.error('Error loading outlets', err);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchOutlets();
  }, [fetchOrders, fetchOutlets]);

  const matchesQuery = (order: Order): boolean => {
    if (!searchQuery.trim()) {
      return true;
    }
    const query = searchQuery.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(query) ||
      order.customerName?.toLowerCase().includes(query) ||
      order.customerEmail?.toLowerCase().includes(query) ||
      order.outletName.toLowerCase().includes(query)
    );
  };

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        if (!matchesQuery(order)) {
          return false;
        }
        if (selectedOutlet && order.outletId.toString() !== selectedOutlet) {
          return false;
        }
        if (selectedStatus && order.status !== selectedStatus) {
          return false;
        }
        if (selectedType && order.orderType !== selectedType) {
          return false;
        }
        if (selectedSource === 'online' && !order.isOnline) {
          return false;
        }
        if (selectedSource === 'instore' && order.isOnline) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const bDate = new Date(b.createdDate).getTime();
        const aDate = new Date(a.createdDate).getTime();
        return bDate - aDate;
      });
  }, [orders, searchQuery, selectedOutlet, selectedStatus, selectedType, selectedSource]);

  const totalOrders = orders.length;
  const completedOrders = useMemo(
    () => orders.filter((order) => order.status === 'COMPLETED').length,
    [orders]
  );

  const handleViewOrder = useCallback((order: Order) => {
    setViewingOrder(order);
  }, []);

  const handleCloseView = useCallback(() => {
    setViewingOrder(null);
  }, []);

  const handlePrintReceipt = useCallback(async (order: Order) => {
    try {
      setAlert({ type: 'info', title: 'Opening Receipt', message: 'Preparing receipt for printing...' });

      const receiptHtml = await orderService.printReceipt(order.id);

      // Open receipt in a new window which will auto-trigger print dialog
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(receiptHtml);
        printWindow.document.close();
      } else {
        setAlert({ type: 'error', title: 'Print Failed', message: 'Please allow pop-ups to print receipts.' });
      }
    } catch (error) {
      console.error('Failed to print receipt:', error);
      setAlert({ type: 'error', title: 'Print Failed', message: 'Failed to print receipt. Please try again.' });
    }
  }, []);

  const handleRefundOrder = useCallback((order: Order) => {
    setSelectedOrder(order);
    setRefundModalOpen(true);
  }, []);

  const handleRefundSuccess = useCallback((refundResponse: any) => {
    setAlert({
      type: 'success',
      title: 'Refund Completed',
      message: `Refund processed successfully. Amount: ${formatCurrency(refundResponse.refundedAmount)}`
    });
    // Refresh orders to show updated status
    void fetchOrders();
  }, [fetchOrders]);

  const renderLoadState = () => (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        <p className="mt-4 text-slate-600">Loading orders...</p>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
      <div className="text-lg font-semibold">No orders found</div>
      <p className="mt-3 text-sm text-slate-500">
        {totalOrders === 0
          ? 'Orders will appear here once customers start making purchases through your POS system.'
          : 'Try adjusting your filters to find the orders you are looking for.'}
      </p>
    </div>
  );

  const renderTable = () => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Order
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Customer
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Outlet
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredOrders.map((order) => {
              return (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 align-top">
                    <div className="space-y-1">
                      <span className="block text-sm font-semibold text-slate-900">{order.orderNumber}</span>
                      {order.isOnline && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                          Online
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top text-sm text-slate-600">
                    {order.customerName || order.customerEmail || '—'}
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm text-slate-900">{order.outletName}</span>
                      <span className="text-xs text-slate-500">{order.outletCode}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 align-top text-sm text-slate-600">
                    {getOrderTypeLabel(order.orderType)}
                  </td>
                  <td className="px-6 py-4 align-top">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 align-top text-sm font-semibold text-slate-900">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-6 py-4 align-top text-sm text-slate-600">
                    {formatDate(order.createdDate)}
                  </td>
                  <td className="px-6 py-4 align-top text-right">
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleViewOrder(order)}
                        className="inline-flex items-center justify-center rounded-lg border border-blue-600 px-3 py-1.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        View
                      </button>
                      {order.status === 'COMPLETED' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handlePrintReceipt(order)}
                            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                            title="Print Receipt"
                          >
                            🖨️ Print
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRefundOrder(order)}
                            className="inline-flex items-center justify-center rounded-lg border border-amber-600 px-3 py-1.5 text-sm font-semibold text-amber-600 transition hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                            title="Process Refund"
                          >
                            ↩️ Refund
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8 pb-12">
        <AdminPageHeader
          title="Orders"
          description="Review, fulfill, and reconcile POS orders across channels in real time."
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
              {filteredOrders.length === totalOrders
                ? `Showing ${totalOrders} orders`
                : `Showing ${filteredOrders.length} of ${totalOrders} orders`}
              {` • ${completedOrders} completed`}
            </div>
            <div className="flex w-full flex-col items-stretch gap-3 md:flex-row md:justify-end md:gap-3">
              <div className="relative w-full md:max-w-xs">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search orders..."
                  className="h-10 w-full rounded-lg border border-slate-200 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select
              value={selectedOutlet}
              onChange={(event) => setSelectedOutlet(event.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Outlets</option>
              {outlets.map((outlet) => (
                <option key={outlet.id} value={outlet.id.toString()}>
                  {outlet.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {ORDER_STATUS_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(event) => setSelectedType(event.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              {ORDER_TYPE_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={selectedSource}
              onChange={(event) => setSelectedSource(event.target.value)}
              className="h-10 rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Sources</option>
              <option value="online">Online Orders</option>
              <option value="instore">In-Store Orders</option>
            </select>
          </div>
        </section>

        {loading ? renderLoadState() : filteredOrders.length === 0 ? renderEmptyState() : renderTable()}

        {viewingOrder ? (
          <OrderDetailsModal
            order={viewingOrder}
            onClose={handleCloseView}
          />
        ) : null}

        <RefundModal
          open={refundModalOpen}
          onClose={() => setRefundModalOpen(false)}
          onSuccess={handleRefundSuccess}
          order={selectedOrder}
        />
      </div>
    </AdminLayout>
  );
};

export default OrdersPage;
