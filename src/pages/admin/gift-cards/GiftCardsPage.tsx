import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import { giftCardService } from '../../../services/giftCardService';
import type {
  GiftCardListItem,
  GiftCardDetail,
  GiftCardBreakageSummary,
  GiftCardIssuePayload,
} from '../../../types/giftCard';

const GiftCardsPage: React.FC = () => {
  const [giftCards, setGiftCards] = useState<GiftCardListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<GiftCardDetail | null>(null);
  const [pageMessage, setPageMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [issueForm, setIssueForm] = useState({
    amount: '',
    activateNow: true,
    expirationDate: '',
    notes: '',
  });
  const [storeCreditForm, setStoreCreditForm] = useState({
    orderNumber: '',
    amount: '',
    notes: '',
  });
  const [breakageSummary, setBreakageSummary] = useState<GiftCardBreakageSummary | null>(null);
  const [breakageDays, setBreakageDays] = useState(730);
  const [loadingBreakage, setLoadingBreakage] = useState(false);

  const loadGiftCards = useCallback(async () => {
    try {
      setLoading(true);
      const cards = await giftCardService.list();
      setGiftCards(cards);
    } catch (error) {
      console.error('Failed to load gift cards', error);
      setPageMessage({ type: 'error', text: 'Unable to load gift cards. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelectCard = useCallback(async (cardId: number) => {
    try {
      const details = await giftCardService.get(cardId);
      setSelectedCard(details);
    } catch (error) {
      console.error('Failed to load card', error);
      setPageMessage({ type: 'error', text: 'Unable to load gift card details.' });
    }
  }, []);

  useEffect(() => {
    loadGiftCards();
  }, [loadGiftCards]);

  const outstandingLiability = useMemo(
    () => giftCards.reduce((sum, card) => sum + Number(card.currentBalance ?? 0), 0),
    [giftCards]
  );

  const activeGiftCards = useMemo(
    () => giftCards.filter((card) => card.status === 'ACTIVE' || card.status === 'PARTIALLY_REDEEMED').length,
    [giftCards]
  );

  const handleChangeIssueForm = (field: keyof typeof issueForm, value: string | boolean) => {
    setIssueForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleChangeStoreCreditForm = (field: keyof typeof storeCreditForm, value: string) => {
    setStoreCreditForm((prev) => ({ ...prev, [field]: value }));
  };

  const parseAmount = (value: string) => {
    const numeric = parseFloat(value);
    if (Number.isNaN(numeric) || numeric <= 0) {
      throw new Error('Enter a valid amount greater than zero.');
    }
    return Number(numeric.toFixed(2));
  };

  const handleSubmitIssue = async (event: React.FormEvent) => {
    event.preventDefault();
    let amountValue: number;
    try {
      amountValue = parseAmount(issueForm.amount);
    } catch (validationError) {
      setPageMessage({ type: 'error', text: (validationError as Error).message });
      return;
    }
    try {
      const payload: GiftCardIssuePayload = {
        amount: amountValue,
        activateNow: issueForm.activateNow,
        expirationDate: issueForm.expirationDate ? new Date(issueForm.expirationDate).toISOString() : undefined,
        notes: issueForm.notes || undefined,
        cardType: 'GIFT_CARD',
      };
      await giftCardService.issue(payload);
      setPageMessage({ type: 'success', text: 'Gift card issued successfully.' });
      setIssueForm({ amount: '', activateNow: true, expirationDate: '', notes: '' });
      loadGiftCards();
    } catch (error) {
      console.error('Failed to issue gift card', error);
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Unable to issue gift card.';
      setPageMessage({ type: 'error', text: message });
    }
  };

  const handleSubmitStoreCredit = async (event: React.FormEvent) => {
    event.preventDefault();
    let amountValue: number;
    try {
      amountValue = parseAmount(storeCreditForm.amount);
    } catch (validationError) {
      setPageMessage({ type: 'error', text: (validationError as Error).message });
      return;
    }
    try {
      const payload: GiftCardIssuePayload = {
        amount: amountValue,
        activateNow: true,
        orderNumber: storeCreditForm.orderNumber || undefined,
        notes: storeCreditForm.notes || 'Refund to store credit',
        cardType: 'STORE_CREDIT',
      };
      await giftCardService.issue(payload);
      setPageMessage({ type: 'success', text: 'Store credit issued successfully.' });
      setStoreCreditForm({ orderNumber: '', amount: '', notes: '' });
      loadGiftCards();
    } catch (error) {
      console.error('Failed to issue store credit', error);
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Unable to issue store credit.';
      setPageMessage({ type: 'error', text: message });
    }
  };

  const handleFetchBreakage = async () => {
    try {
      setLoadingBreakage(true);
      const summary = await giftCardService.getBreakageSummary({ inactivityDays: breakageDays });
      setBreakageSummary(summary);
    } catch (error) {
      console.error('Failed to load breakage report', error);
      setPageMessage({ type: 'error', text: 'Unable to load breakage report.' });
    } finally {
      setLoadingBreakage(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gift Cards & Store Credit</h1>
            <p className="text-sm text-slate-600">Issue, redeem, and reconcile stored value balances.</p>
          </div>
        </div>

        {pageMessage && (
          <div
            className={`rounded-lg px-4 py-3 text-sm ${
              pageMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {pageMessage.text}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Outstanding Liability</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              ${outstandingLiability.toFixed(2)}
            </p>
            <p className="text-xs text-slate-500">Sum of all active balances</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Active Cards</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{activeGiftCards}</p>
            <p className="text-xs text-slate-500">Ready for redemption</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-slate-500">Total Cards</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{giftCards.length}</p>
            <p className="text-xs text-slate-500">Issued in this tenant</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <form onSubmit={handleSubmitIssue} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Issue Gift Card</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={issueForm.amount}
                  onChange={(event) => handleChangeIssueForm('amount', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Expires On</label>
                <input
                  type="date"
                  value={issueForm.expirationDate}
                  onChange={(event) => handleChangeIssueForm('expirationDate', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={issueForm.activateNow}
                  onChange={(event) => handleChangeIssueForm('activateNow', event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Activate immediately
              </label>
              <div>
                <label className="text-xs font-medium text-slate-600">Notes</label>
                <textarea
                  value={issueForm.notes}
                  rows={2}
                  onChange={(event) => handleChangeIssueForm('notes', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Issue Gift Card
            </button>
          </form>

          <form onSubmit={handleSubmitStoreCredit} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Issue Store Credit</h2>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Order Number</label>
                <input
                  type="text"
                  value={storeCreditForm.orderNumber}
                  onChange={(event) => handleChangeStoreCreditForm('orderNumber', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Amount</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={storeCreditForm.amount}
                  onChange={(event) => handleChangeStoreCreditForm('amount', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Notes</label>
                <textarea
                  rows={2}
                  value={storeCreditForm.notes}
                  onChange={(event) => handleChangeStoreCreditForm('notes', event.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Convert to Store Credit
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div>
              <p className="text-base font-semibold text-slate-900">Issued Cards</p>
              <p className="text-xs text-slate-500">Track balances and statuses.</p>
            </div>
          </div>
          {loading ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">Loading gift cards…</div>
          ) : giftCards.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">No gift cards have been issued yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Code</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Type</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-slate-500">Balance</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500">Expires</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {giftCards.map((card) => (
                    <tr key={card.id}>
                      <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-slate-900">{card.code}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-slate-600">{card.cardType.replace('_', ' ')}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-right font-semibold text-slate-900">
                        ${Number(card.currentBalance ?? 0).toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-slate-600">{card.status}</td>
                      <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                        {card.expirationDate ? new Date(card.expirationDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleSelectCard(card.id)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {selectedCard && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Gift Card {selectedCard.code}</p>
                <p className="text-xs text-slate-500">
                  Balance ${Number(selectedCard.currentBalance ?? 0).toFixed(2)} • Status {selectedCard.status}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCard(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Close
              </button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead>
                  <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-right">Balance</th>
                    <th className="px-3 py-2">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedCard.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-3 text-center text-slate-500">
                        No transactions recorded.
                      </td>
                    </tr>
                  ) : (
                    selectedCard.transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="px-3 py-2">{new Date(tx.transactionDate).toLocaleString()}</td>
                        <td className="px-3 py-2">{tx.transactionType}</td>
                        <td className="px-3 py-2 text-right font-semibold">${Number(tx.amount ?? 0).toFixed(2)}</td>
                        <td className="px-3 py-2 text-right">${Number(tx.balanceAfter ?? 0).toFixed(2)}</td>
                        <td className="px-3 py-2">{tx.orderNumber || tx.referenceNumber || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-base font-semibold text-slate-900">Breakage Report</p>
              <p className="text-xs text-slate-500">Identify dormant balances eligible for revenue recognition.</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={30}
                step={30}
                value={breakageDays}
                onChange={(event) => setBreakageDays(parseInt(event.target.value, 10) || 30)}
                className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={handleFetchBreakage}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                disabled={loadingBreakage}
              >
                {loadingBreakage ? 'Loading…' : 'Run Report'}
              </button>
            </div>
          </div>
          {breakageSummary ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
                <p className="font-semibold text-slate-900">
                  ${Number(breakageSummary.totalBreakage ?? 0).toFixed(2)} eligible as of{' '}
                  {new Date(breakageSummary.asOfDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-slate-500">
                  {breakageSummary.cards.length} cards inactive for at least {breakageSummary.inactivityDays} days.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-500">Code</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-500">Status</th>
                      <th className="px-3 py-2 text-right font-semibold text-slate-500">Balance</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-500">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {breakageSummary.cards.map((card) => (
                      <tr key={card.giftCardId}>
                        <td className="px-3 py-2 font-mono text-slate-900">{card.code}</td>
                        <td className="px-3 py-2 text-slate-600">{card.status}</td>
                        <td className="px-3 py-2 text-right font-semibold">${Number(card.outstandingBalance ?? 0).toFixed(2)}</td>
                        <td className="px-3 py-2 text-slate-600">
                          {card.lastTransactionDate ? new Date(card.lastTransactionDate).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="px-2 py-6 text-center text-xs text-slate-500">Run the report to view dormant balances.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default GiftCardsPage;
