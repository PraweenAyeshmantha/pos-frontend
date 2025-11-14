import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Customer } from '../../../types/customer';
import type { LoyaltySummary } from '../../../types/loyalty';
import { loyaltyService } from '../../../services/loyaltyService';
import Alert from '../../common/Alert';
import type { AlertType } from '../../common/Alert';

interface CustomerLoyaltyPanelProps {
  customer: Customer;
  onClose: () => void;
  showToast: (type: AlertType, title: string, message: string) => void;
}

const CustomerLoyaltyPanel: React.FC<CustomerLoyaltyPanelProps> = ({ customer, onClose, showToast }) => {
  const [summary, setSummary] = useState<LoyaltySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redeemPoints, setRedeemPoints] = useState<string>('');
  const [selectedReward, setSelectedReward] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await loyaltyService.getSummary(customer.id);
      setSummary(data);
    } catch (err) {
      console.error('Failed to load loyalty summary', err);
      setError('Unable to load loyalty summary. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [customer.id]);

  useEffect(() => {
    void fetchSummary();
  }, [fetchSummary]);

  const availableRewards = useMemo(() => {
    return summary?.rewards ?? [];
  }, [summary]);

  const handleRedeem = useCallback(async () => {
    if (!summary) return;
    const rewardId = typeof selectedReward === 'number' ? selectedReward : undefined;
    const points = rewardId ? undefined : parseInt(redeemPoints, 10);

    if (!rewardId && (!points || Number.isNaN(points) || points <= 0)) {
      setError('Enter a positive number of points or select a reward.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await loyaltyService.redeem(customer.id, {
        rewardId,
        points,
        reason: rewardId ? `Redeemed reward #${rewardId}` : 'Manual loyalty redemption',
      });
      showToast('success', 'Loyalty Redeemed', 'Loyalty redemption applied successfully.');
      setRedeemPoints('');
      setSelectedReward('');
      await fetchSummary();
    } catch (err: unknown) {
      console.error('Failed to redeem loyalty', err);
      setError('Unable to redeem loyalty at this time.');
    } finally {
      setSubmitting(false);
    }
  }, [customer.id, fetchSummary, redeemPoints, selectedReward, showToast, summary]);

  const handleRewardSelect = (rewardId: number) => {
    if (selectedReward === rewardId) {
      setSelectedReward('');
    } else {
      setSelectedReward(rewardId);
      setRedeemPoints('');
    }
  };

  const pointsDisplay = summary?.availablePoints ?? customer.loyaltyPoints ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 px-4 py-8">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-500">Loyalty Profile</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">{customer.name}</h2>
            <p className="text-sm text-slate-500">{customer.email || customer.phone || 'No contact info'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
          >
            Close
          </button>
        </div>

        <div className="space-y-6 px-6 py-6">
          {error && (
            <Alert type="error" title="Loyalty Error" message={error} />
          )}

          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center rounded-xl border border-dashed border-slate-200">
              <div className="text-center">
                <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-b-2 border-blue-600" />
                <p className="text-sm text-slate-500">Loading loyalty summary...</p>
              </div>
            </div>
          ) : summary ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                  <p className="text-sm font-semibold uppercase tracking-widest text-blue-500">Points</p>
                  <p className="mt-2 text-3xl font-bold text-blue-700">{pointsDisplay.toLocaleString()}</p>
                  <p className="text-xs text-blue-500">Available balance</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                  <p className="text-sm font-semibold uppercase tracking-widest text-emerald-500">Tier</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-700">{summary.tierName || 'General'}</p>
                  {summary.pointsToNextTier != null && (
                    <p className="text-xs text-emerald-600">
                      {summary.pointsToNextTier} pts to next tier ({summary.nextTierAt} pts)
                    </p>
                  )}
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                  <p className="text-sm font-semibold uppercase tracking-widest text-amber-500">Expiring</p>
                  <p className="mt-2 text-3xl font-bold text-amber-700">
                    {(summary.expiringPoints ?? 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-amber-600">
                    {summary.expiringOn ? new Date(summary.expiringOn).toLocaleDateString() : 'No upcoming expirations'}
                  </p>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Redeem Points</h3>
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">BURN</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">Redeem by entering points or selecting a reward.</p>
                  <div className="mt-4">
                    <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Points</label>
                    <input
                      type="number"
                      min={1}
                      value={redeemPoints}
                      onChange={(event) => {
                        setRedeemPoints(event.target.value);
                        setSelectedReward('');
                      }}
                      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="Enter points to redeem"
                      disabled={submitting}
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      {availableRewards.length > 0 ? (
                        availableRewards.map((reward) => (
                          <button
                            key={reward.id}
                            type="button"
                            onClick={() => handleRewardSelect(reward.id)}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                              selectedReward === reward.id
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600'
                            }`}
                          >
                            {reward.name} · {reward.pointsCost} pts
                          </button>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">No rewards available for current balance.</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        void handleRedeem();
                      }}
                      disabled={submitting}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                    >
                      {submitting ? 'Processing...' : 'Redeem'}
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
                    <span className="text-xs uppercase text-slate-400">Last 20</span>
                  </div>
                  <div className="mt-4 space-y-3 max-h-64 overflow-y-auto pr-1">
                    {summary.recentTransactions.length === 0 && (
                      <p className="text-sm text-slate-400">No loyalty activity recorded yet.</p>
                    )}
                    {summary.recentTransactions.map((transaction, index) => (
                      <div key={`${transaction.type}-${index}`} className="rounded-xl border border-slate-100 p-3">
                        <div className="flex items-center justify-between text-sm font-semibold">
                          <span>{transaction.type}</span>
                          <span
                            className={
                              transaction.points >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }
                          >
                            {transaction.points >= 0 ? '+' : ''}
                            {transaction.points}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">{transaction.description || '—'}</p>
                        <p className="text-[11px] text-slate-400">
                          {transaction.createdDate ? new Date(transaction.createdDate).toLocaleString() : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
              No loyalty summary available for this customer.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerLoyaltyPanel;
