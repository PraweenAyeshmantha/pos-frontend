import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import Alert from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import { loyaltyService } from '../../../services/loyaltyService';
import type { LoyaltyTier, LoyaltyRule, LoyaltyReward } from '../../../types/loyalty';

const defaultNewTier: LoyaltyTier = {
  name: '',
  description: '',
  minPoints: 0,
  maxPoints: undefined,
  earnMultiplier: 1,
  burnMultiplier: 1,
  priority: 0,
};

const defaultReward: LoyaltyReward = {
  name: '',
  description: '',
  pointsCost: 100,
  monetaryValue: 0,
  autoIssue: false,
};

const LoyaltyProgramPage: React.FC = () => {
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [earnRule, setEarnRule] = useState<LoyaltyRule | null>(null);
  const [burnRule, setBurnRule] = useState<LoyaltyRule | null>(null);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [tierForm, setTierForm] = useState<LoyaltyTier>(defaultNewTier);
  const [editingTierId, setEditingTierId] = useState<number | null>(null);
  const [rewardForm, setRewardForm] = useState<LoyaltyReward>(defaultReward);
  const [editingRewardId, setEditingRewardId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; title: string; message: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', title: string, message: string) => {
    setAlert({ type, title, message });
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [tierData, earn, burn, rewardData] = await Promise.all([
        loyaltyService.getTiers(),
        loyaltyService.getRule('EARN'),
        loyaltyService.getRule('BURN'),
        loyaltyService.getRewards(),
      ]);
      setTiers(tierData);
      setEarnRule(earn);
      setBurnRule(burn);
      setRewards(rewardData);
    } catch (err) {
      console.error('Failed to load loyalty settings', err);
      showToast('error', 'Load Failed', 'Could not load loyalty settings.');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleTierFieldChange = (field: keyof LoyaltyTier, value: string) => {
    setTierForm((prev) => {
      if (field === 'name' || field === 'description') {
        return { ...prev, [field]: value };
      }
      if (field === 'maxPoints' && value === '') {
        return { ...prev, maxPoints: undefined };
      }
      return { ...prev, [field]: Number(value) };
    });
  };

  const handleRewardFieldChange = (field: keyof LoyaltyReward, value: string) => {
    setRewardForm((prev) => ({
      ...prev,
      [field]: field === 'name' || field === 'description' ? value : Number(value),
    }));
  };

  const resetTierForm = () => {
    setEditingTierId(null);
    setTierForm(defaultNewTier);
  };

  const resetRewardForm = () => {
    setEditingRewardId(null);
    setRewardForm(defaultReward);
  };

  const handleSaveTier = async () => {
    if (!tierForm.name.trim()) {
      showToast('error', 'Validation', 'Tier name is required.');
      return;
    }
    try {
      if (editingTierId) {
        await loyaltyService.updateTier(editingTierId, tierForm);
        showToast('success', 'Tier Updated', 'Tier saved successfully.');
      } else {
        await loyaltyService.createTier(tierForm);
        showToast('success', 'Tier Created', 'New tier created successfully.');
      }
      await fetchData();
      resetTierForm();
    } catch (err) {
      console.error('Failed to save tier', err);
      showToast('error', 'Save Failed', 'Unable to save tier. Please try again.');
    }
  };

  const handleEditTier = (tier: LoyaltyTier) => {
    setEditingTierId(tier.id ?? null);
    setTierForm({
      name: tier.name,
      description: tier.description,
      minPoints: tier.minPoints,
      maxPoints: tier.maxPoints,
      earnMultiplier: tier.earnMultiplier,
      burnMultiplier: tier.burnMultiplier,
      priority: tier.priority,
    });
  };

  const handleDeleteTier = async (tierId: number | undefined) => {
    if (!tierId) return;
    try {
      await loyaltyService.deleteTier(tierId);
      showToast('success', 'Tier Removed', 'Tier archived successfully.');
      await fetchData();
    } catch (err) {
      console.error('Failed to delete tier', err);
      showToast('error', 'Delete Failed', 'Unable to delete tier.');
    }
  };

  const handleSaveReward = async () => {
    if (!rewardForm.name.trim()) {
      showToast('error', 'Validation', 'Reward name is required.');
      return;
    }
    try {
      if (editingRewardId) {
        await loyaltyService.updateReward(editingRewardId, rewardForm);
        showToast('success', 'Reward Updated', 'Reward saved successfully.');
      } else {
        await loyaltyService.createReward(rewardForm);
        showToast('success', 'Reward Created', 'Reward created successfully.');
      }
      await fetchData();
      resetRewardForm();
    } catch (err) {
      console.error('Failed to save reward', err);
      showToast('error', 'Save Failed', 'Unable to save reward.');
    }
  };

  const handleEditReward = (reward: LoyaltyReward) => {
    setEditingRewardId(reward.id ?? null);
    setRewardForm({
      name: reward.name,
      description: reward.description,
      pointsCost: reward.pointsCost,
      monetaryValue: reward.monetaryValue,
      autoIssue: reward.autoIssue,
      expiresAt: reward.expiresAt,
    });
  };

  const handleDeleteReward = async (rewardId: number | undefined) => {
    if (!rewardId) return;
    try {
      await loyaltyService.deleteReward(rewardId);
      showToast('success', 'Reward Removed', 'Reward archived successfully.');
      await fetchData();
    } catch (err) {
      console.error('Failed to delete reward', err);
      showToast('error', 'Delete Failed', 'Unable to delete reward.');
    }
  };

  const handleSaveRule = async (type: 'EARN' | 'BURN', payload: LoyaltyRule | null) => {
    if (!payload) return;
    try {
      await loyaltyService.updateRule(type, payload);
      showToast('success', 'Rule Updated', `${type} rule saved.`);
      await fetchData();
    } catch (err) {
      console.error('Failed to save rule', err);
      showToast('error', 'Save Failed', `Unable to save ${type.toLowerCase()} rule.`);
    }
  };

  const handleExpirePoints = async () => {
    try {
      const expired = await loyaltyService.expireNow();
      showToast('success', 'Expiration Complete', `${expired} points expired.`);
      await fetchData();
    } catch (err) {
      console.error('Failed to expire points', err);
      showToast('error', 'Expiration Failed', 'Unable to process expirations.');
    }
  };

  const sortedTiers = useMemo(() => {
    return [...tiers].sort((a, b) => a.priority - b.priority);
  }, [tiers]);

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8 pb-12">
        <AdminPageHeader
          title="Loyalty Program"
          description="Define tiers, rewards, and earn/burn rules to keep shoppers coming back."
        />

        {alert && (
          <ToastContainer>
            <Alert
              type={alert.type}
              title={alert.title}
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          </ToastContainer>
        )}

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
              <p className="text-sm text-slate-500">Loading loyalty configuration...</p>
            </div>
          </div>
        ) : (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-6 lg:flex-row">
                <div className="flex-1 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-500">Earn Rule</p>
                      <h3 className="text-xl font-semibold text-slate-900">Accrual</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSaveRule('EARN', earnRule)}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Points per Currency
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={earnRule?.pointsPerCurrency ?? 1}
                        onChange={(event) =>
                          setEarnRule((prev) => ({ ...(prev ?? { ruleType: 'EARN' }), pointsPerCurrency: Number(event.target.value) }))
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Min Order Total
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={earnRule?.minOrderTotal ?? 0}
                        onChange={(event) =>
                          setEarnRule((prev) => ({ ...(prev ?? { ruleType: 'EARN' }), minOrderTotal: Number(event.target.value) }))
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Max Points per Order
                      </label>
                      <input
                        type="number"
                        value={earnRule?.maxPointsPerOrder ?? ''}
                        onChange={(event) =>
                          setEarnRule((prev) => ({
                            ...(prev ?? { ruleType: 'EARN' }),
                            maxPointsPerOrder: event.target.value ? Number(event.target.value) : undefined,
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Expiration (days)
                      </label>
                      <input
                        type="number"
                        value={earnRule?.expirationDays ?? 365}
                        onChange={(event) =>
                          setEarnRule((prev) => ({ ...(prev ?? { ruleType: 'EARN' }), expirationDays: Number(event.target.value) }))
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-500">Burn Rule</p>
                      <h3 className="text-xl font-semibold text-slate-900">Redemption</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSaveRule('BURN', burnRule)}
                      className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                    >
                      Save
                    </button>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Min Points to Redeem
                      </label>
                      <input
                        type="number"
                        value={burnRule?.minPointsToRedeem ?? 0}
                        onChange={(event) =>
                          setBurnRule((prev) => ({
                            ...(prev ?? { ruleType: 'BURN' }),
                            minPointsToRedeem: Number(event.target.value),
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Max Points per Order
                      </label>
                      <input
                        type="number"
                        value={burnRule?.maxPointsToRedeem ?? ''}
                        onChange={(event) =>
                          setBurnRule((prev) => ({
                            ...(prev ?? { ruleType: 'BURN' }),
                            maxPointsToRedeem: event.target.value ? Number(event.target.value) : undefined,
                          }))
                        }
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="mt-5 rounded-xl border border-dashed border-amber-300 bg-white/60 p-4 text-sm text-amber-700">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">Manual Expiration</p>
                      <button
                        type="button"
                        onClick={handleExpirePoints}
                        className="rounded-lg border border-amber-300 px-3 py-1 text-xs font-semibold text-amber-600 transition hover:bg-amber-100"
                      >
                        Run Expiration
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-amber-600">
                      Trigger expirations immediately when updating policies or cleaning up older balances.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">Tiers</h3>
                  <p className="text-sm text-slate-500">
                    Define loyalty milestones and multipliers to reward your best customers.
                  </p>
                  <div className="mt-4 space-y-3">
                    {sortedTiers.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                        No tiers yet. Add your first tier using the form.
                      </div>
                    )}
                    {sortedTiers.map((tier) => (
                      <div key={tier.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{tier.name}</p>
                          <p className="text-xs text-slate-500">
                            {tier.minPoints} pts minimum • {tier.maxPoints ? `${tier.maxPoints} max` : 'No ceiling'} •
                            Earn ×{tier.earnMultiplier}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditTier(tier)}
                            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTier(tier.id)}
                            className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Archive
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                  <h4 className="text-sm font-semibold text-slate-900">
                    {editingTierId ? 'Update Tier' : 'Add Tier'}
                  </h4>
                  <div className="mt-3 space-y-3 text-sm">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Name</label>
                      <input
                        type="text"
                        value={tierForm.name}
                        onChange={(event) => handleTierFieldChange('name', event.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Min Points</label>
                      <input
                        type="number"
                        value={tierForm.minPoints}
                        onChange={(event) => handleTierFieldChange('minPoints', event.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Max Points (optional)</label>
                      <input
                        type="number"
                        value={tierForm.maxPoints ?? ''}
                        onChange={(event) => handleTierFieldChange('maxPoints', event.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Earn ×</label>
                        <input
                          type="number"
                          step="0.1"
                          value={tierForm.earnMultiplier}
                          onChange={(event) => handleTierFieldChange('earnMultiplier', event.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Priority</label>
                        <input
                          type="number"
                          value={tierForm.priority}
                          onChange={(event) => handleTierFieldChange('priority', event.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveTier}
                      className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      {editingTierId ? 'Update Tier' : 'Add Tier'}
                    </button>
                    {editingTierId && (
                      <button
                        type="button"
                        onClick={resetTierForm}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">Reward Catalog</h3>
                  <p className="text-sm text-slate-500">
                    Publish loyalty rewards that can be redeemed during checkout or from the customer profile.
                  </p>
                  <div className="mt-4 space-y-3">
                    {rewards.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                        No rewards defined yet.
                      </div>
                    )}
                    {rewards.map((reward) => (
                      <div key={reward.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{reward.name}</p>
                          <p className="text-xs text-slate-500">{reward.pointsCost} pts • ${reward.monetaryValue?.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditReward(reward)}
                            className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReward(reward.id)}
                            className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                          >
                            Archive
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-slate-50/60 p-5">
                  <h4 className="text-sm font-semibold text-slate-900">
                    {editingRewardId ? 'Update Reward' : 'Add Reward'}
                  </h4>
                  <div className="mt-3 space-y-3 text-sm">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Name</label>
                      <input
                        type="text"
                        value={rewardForm.name}
                        onChange={(event) => handleRewardFieldChange('name', event.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Points Cost</label>
                      <input
                        type="number"
                        value={rewardForm.pointsCost}
                        onChange={(event) => handleRewardFieldChange('pointsCost', event.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Monetary Value</label>
                      <input
                        type="number"
                        step="0.01"
                        value={rewardForm.monetaryValue ?? 0}
                        onChange={(event) => handleRewardFieldChange('monetaryValue', event.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveReward}
                      className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      {editingRewardId ? 'Update Reward' : 'Add Reward'}
                    </button>
                    {editingRewardId && (
                      <button
                        type="button"
                        onClick={resetRewardForm}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default LoyaltyProgramPage;
