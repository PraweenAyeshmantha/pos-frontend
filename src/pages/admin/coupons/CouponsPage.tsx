import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import Alert, { type AlertType } from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import AddCouponModal from '../../../components/admin/coupons/AddCouponModal';
import EditCouponModal from '../../../components/admin/coupons/EditCouponModal';
import { couponService } from '../../../services/couponService';
import type { Coupon } from '../../../types/coupon';

const CouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [alert, setAlert] = useState<{ type: AlertType; title: string; message: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [modalMode, setModalMode] = useState<'edit' | 'view' | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; coupon: Coupon | null }>({
    open: false,
    coupon: null,
  });

  const showToast = useCallback((type: AlertType, title: string, message: string) => {
    setAlert({ type, title, message });
  }, []);

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const data = await couponService.getAll(false); // Include active only
      setCoupons(data);
    } catch (err) {
      console.error('Error loading coupons', err);
      setLoadError('Failed to load coupons. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCoupons();
  }, [fetchCoupons]);

  const handleCouponCreated = useCallback(
    (coupon: Coupon) => {
      setCoupons((prev) => {
        const remaining = prev.filter((existing) => existing.id !== coupon.id);
        return [coupon, ...remaining];
      });
      setLoadError(null);
      setShowAddModal(false);
      showToast('success', 'Coupon Created', `Coupon ${coupon.code} added successfully`);
    },
    [showToast],
  );

  const handleEdit = useCallback((coupon: Coupon) => {
    setEditingCoupon(coupon);
    setModalMode('edit');
  }, []);

  const handleEditClose = useCallback(() => {
    setEditingCoupon(null);
    setModalMode(null);
  }, []);

  const handleView = useCallback((coupon: Coupon) => {
    setEditingCoupon(coupon);
    setModalMode('view');
  }, []);

  const handleCouponUpdated = useCallback(
    (coupon: Coupon) => {
      setCoupons((prev) =>
        prev.map((existing) => (existing.id === coupon.id ? coupon : existing)),
      );
      setEditingCoupon(null);
      setModalMode(null);
      showToast('success', 'Coupon Updated', `Coupon ${coupon.code} updated successfully`);
    },
    [showToast],
  );

  const handleDeleteRequest = useCallback((coupon: Coupon) => {
    setDeleteConfirm({ open: true, coupon });
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirm.coupon) {
      return;
    }

    try {
      await couponService.delete(deleteConfirm.coupon.id);
      setCoupons((prev) => prev.filter((c) => c.id !== deleteConfirm.coupon?.id));
      setDeleteConfirm({ open: false, coupon: null });
      showToast('success', 'Coupon Deleted', `Coupon ${deleteConfirm.coupon.code} deleted successfully`);
    } catch (err) {
      console.error('Error deleting coupon:', err);
      showToast('error', 'Delete Failed', 'Failed to delete coupon. Please try again.');
    }
  }, [deleteConfirm.coupon, showToast]);

  const matchesQuery = useCallback(
    (coupon: Coupon): boolean => {
      const query = searchQuery.toLowerCase();
      return (
        coupon.code.toLowerCase().includes(query) ||
        (coupon.description?.toLowerCase().includes(query) ?? false) ||
        coupon.discountType.toLowerCase().includes(query)
      );
    },
    [searchQuery],
  );

  const filteredCoupons = useMemo(() => {
    return coupons.filter((coupon) => matchesQuery(coupon)).sort((a, b) => {
      const aTimestamp = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
      const bTimestamp = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
      return bTimestamp - aTimestamp;
    });
  }, [coupons, matchesQuery]);

  const totalCoupons = coupons.length;
  const activeCoupons = useMemo(() => coupons.filter((c) => c.recordStatus === 'ACTIVE').length, [coupons]);

  const handleCreateClick = useCallback(() => {
    setShowAddModal(true);
  }, []);

  const renderLoadState = () => (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        <p className="mt-4 text-slate-600">Loading coupons...</p>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
      <div className="text-lg font-semibold">No coupons yet</div>
      <p className="mt-3 text-sm text-slate-500">
        {totalCoupons === 0
          ? 'Create your first coupon to offer discounts and promotions to your customers.'
          : 'Try a different search term to find the coupon you are looking for.'}
      </p>
      <button
        type="button"
        onClick={handleCreateClick}
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Add coupon
      </button>
    </div>
  );

  const formatCouponType = (type: string): string => {
    return type === 'FIXED' ? 'Fixed' : 'Percentage';
  };

  const formatDiscountValue = (type: string, value: number): string => {
    return type === 'FIXED' ? `$${value.toFixed(2)}` : `${value}%`;
  };

  const formatUsageLimit = (used: number, limit: number | null | undefined): string => {
    if (!limit) {
      return '∞';
    }
    return `${used} / ${limit}`;
  };

  const formatDate = (date: string | null | undefined): string => {
    if (!date) {
      return '—';
    }
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderTable = () => (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Code
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Amount
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Description
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Usage / Limit
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Expiry Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredCoupons.map((coupon) => (
              <tr key={coupon.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 text-sm font-medium text-slate-900">
                  <div className="font-mono text-blue-600">{coupon.code}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-700">
                  <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {formatCouponType(coupon.discountType)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                  {formatDiscountValue(coupon.discountType, coupon.discountValue)}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {coupon.description ? (
                    <span className="max-w-xs truncate" title={coupon.description}>
                      {coupon.description}
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {formatUsageLimit(coupon.timesUsed, coupon.usageLimit)}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {formatDate(coupon.validTo)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-3 text-sm font-semibold">
                    <button
                      type="button"
                      onClick={() => handleView(coupon)}
                      className="text-slate-600 transition hover:text-slate-800"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(coupon)}
                      className="text-blue-600 transition hover:text-blue-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRequest(coupon)}
                      className="text-rose-600 transition hover:text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8 pb-12">
        <AdminPageHeader
          title="Coupons"
          description="Manage discount coupons and promotional codes to drive sales and customer loyalty."
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
              {filteredCoupons.length === totalCoupons
                ? `Showing ${totalCoupons} coupons`
                : `Showing ${filteredCoupons.length} of ${totalCoupons} coupons`}
              {` • ${activeCoupons} active`}
            </div>
            <div className="flex w-full flex-col items-stretch gap-3 md:flex-row md:justify-end md:gap-3">
              <div className="relative w-full md:max-w-xs">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search coupons..."
                  className="h-10 w-full rounded-lg border border-slate-200 px-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <button
                type="button"
                onClick={handleCreateClick}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white md:w-auto"
              >
                Add coupon
              </button>
            </div>
          </div>
        </section>

        {loading ? renderLoadState() : filteredCoupons.length === 0 ? renderEmptyState() : renderTable()}

        {showAddModal && (
          <AddCouponModal
            onClose={() => setShowAddModal(false)}
            onSuccess={handleCouponCreated}
          />
        )}

        {editingCoupon && modalMode && (
          <EditCouponModal
            coupon={editingCoupon}
            mode={modalMode}
            onClose={handleEditClose}
            onSuccess={handleCouponUpdated}
          />
        )}

        <ConfirmationDialog
          open={deleteConfirm.open}
          title="Delete Coupon?"
          message={`Are you sure you want to delete coupon "${deleteConfirm.coupon?.code}"? This action cannot be undone.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirm({ open: false, coupon: null })}
        />
      </div>
    </AdminLayout>
  );
};

export default CouponsPage;
