import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../../components/layout/AdminLayout';
import AdminPageHeader from '../../../components/layout/AdminPageHeader';
import Alert, { type AlertType } from '../../../components/common/Alert';
import ToastContainer from '../../../components/common/ToastContainer';
import StartCashierSessionModal from '../../../components/admin/cashier-balancing/StartCashierSessionModal';
import CloseCashierSessionModal from '../../../components/admin/cashier-balancing/CloseCashierSessionModal';
import CashTransactionModal from '../../../components/admin/cashier-balancing/CashTransactionModal';
import { cashierSessionService } from '../../../services/cashierSessionService';
import { transactionService, type Transaction } from '../../../services/transactionService';
import type { CashierSession } from '../../../types/cashierSession';

const CashierBalancingPage: React.FC = () => {
  const [sessions, setSessions] = useState<CashierSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<CashierSession | null>(null);
  const [sessionTransactions, setSessionTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: AlertType; title: string; message: string } | null>(null);
  const [showStartModal, setShowStartModal] = useState<boolean>(false);
  const [showCloseModal, setShowCloseModal] = useState<{ show: boolean; session: CashierSession | null }>({
    show: false,
    session: null,
  });
  const [showCashModal, setShowCashModal] = useState<{ show: boolean; session: CashierSession | null }>({
    show: false,
    session: null,
  });

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cashierSessionService.getAll();
      setSessions(data);
    } catch (err) {
      console.error('Error loading sessions', err);
      setError('Failed to load cashier sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  const fetchSessionTransactions = useCallback(async (sessionId: number) => {
    try {
      const transactions = await transactionService.getBySession(sessionId);
      setSessionTransactions(transactions);
    } catch (err) {
      console.error('Error loading session transactions', err);
      setSessionTransactions([]);
    }
  }, []);

  const handleStartSession = useCallback(() => {
    setShowStartModal(true);
  }, []);

  const handleCloseSession = useCallback((session: CashierSession) => {
    setShowCloseModal({ show: true, session });
  }, []);

  const handleCashTransaction = useCallback((session: CashierSession) => {
    setShowCashModal({ show: true, session });
  }, []);

  const handleSessionSelect = useCallback((session: CashierSession) => {
    setSelectedSession(session);
    void fetchSessionTransactions(session.id);
  }, [fetchSessionTransactions]);

  const handleModalSuccess = useCallback(() => {
    setAlert({
      type: 'success',
      title: 'Success',
      message: 'Operation completed successfully.',
    });
    void fetchSessions();
    if (selectedSession) {
      void fetchSessionTransactions(selectedSession.id);
    }
  }, [fetchSessions, selectedSession]);

  const handleCloseStartModal = useCallback(() => {
    setShowStartModal(false);
  }, []);

  const handleCloseCloseModal = useCallback(() => {
    setShowCloseModal({ show: false, session: null });
  }, []);

  const handleCloseCashModal = useCallback(() => {
    setShowCashModal({ show: false, session: null });
  }, []);

  const activeSessions = useMemo(
    () => sessions.filter((session) => session.status === 'OPEN'),
    [sessions],
  );

  const closedSessions = useMemo(
    () => sessions.filter((session) => session.status === 'CLOSED'),
    [sessions],
  );

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDateTime = (value?: string): string => {
    if (!value) {
      return '-';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderLoadState = () => (
    <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        <p className="mt-4 text-slate-600">Loading cashier sessions...</p>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
      <div className="text-lg font-semibold">No cashier sessions yet</div>
      <p className="mt-3 text-sm text-slate-500">
        Cashier sessions will appear here once cashiers start their shifts.
      </p>
    </div>
  );

  const renderSessionCard = (session: CashierSession) => {
    const isActive = session.status === 'OPEN';
    const statusClass = isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600';
    const statusLabel = isActive ? 'Active' : 'Closed';

    return (
      <div
        key={session.id}
        className={`rounded-2xl border p-6 cursor-pointer transition hover:shadow-md ${
          selectedSession?.id === session.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'
        }`}
        onClick={() => handleSessionSelect(session)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {session.cashierName} - {session.outletName}
            </h3>
            <p className="text-sm text-slate-600">
              Started: {formatDateTime(session.openingTime)}
            </p>
            {!isActive && session.closingTime && (
              <p className="text-sm text-slate-600">
                Closed: {formatDateTime(session.closingTime)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}>
              {statusLabel}
            </span>
            {isActive && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCashTransaction(session);
                  }}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Cash ±
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseSession(session);
                  }}
                  className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Opening Balance</p>
            <p className="text-lg font-semibold text-slate-900">
              {formatCurrency(session.openingBalance)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Current Balance</p>
            <p className="text-lg font-semibold text-slate-900">
              {formatCurrency(session.currentBalance)}
            </p>
          </div>
          {!isActive && (
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Closing Balance</p>
              <p className="text-lg font-semibold text-slate-900">
                {formatCurrency(session.closingBalance || 0)}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTransactionTable = () => {
    if (!selectedSession) return null;

    return (
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Transactions for {selectedSession.cashierName} - {selectedSession.outletName}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {sessionTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 text-sm text-slate-600">{transaction.transactionType}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{transaction.description || '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {formatDateTime(transaction.transactionDate)}
                  </td>
                </tr>
              ))}
              {sessionTransactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                    No transactions found for this session
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8 pb-12">
        <AdminPageHeader
          title="Cashier Balancing"
          description="Monitor and manage cashier sessions, balances, and transactions for accurate financial tracking."
        />

        {(alert || error) && (
          <ToastContainer>
            {alert ? (
              <Alert type={alert.type} title={alert.title} message={alert.message} onClose={() => setAlert(null)} />
            ) : null}
            {error ? <Alert type="error" title="Error" message={error} onClose={() => setError(null)} /> : null}
          </ToastContainer>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="text-xs text-slate-500 sm:text-sm whitespace-nowrap">
              {sessions.length === 0
                ? 'No sessions'
                : `${sessions.length} total session${sessions.length === 1 ? '' : 's'} • ${activeSessions.length} active`}
            </div>
            <div className="flex w-full flex-col items-stretch gap-3 md:flex-row md:justify-end md:gap-3">
              <button
                type="button"
                onClick={handleStartSession}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-green-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-white"
              >
                Start Session
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          renderLoadState()
        ) : sessions.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Active Sessions</h2>
                {activeSessions.length === 0 ? (
                  <p className="text-sm text-slate-500">No active sessions</p>
                ) : (
                  <div className="space-y-4">
                    {activeSessions.map(renderSessionCard)}
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Closed Sessions</h2>
                {closedSessions.length === 0 ? (
                  <p className="text-sm text-slate-500">No closed sessions</p>
                ) : (
                  <div className="space-y-4">
                    {closedSessions.map(renderSessionCard)}
                  </div>
                )}
              </div>
            </div>

            <div>
              {renderTransactionTable()}
            </div>
          </div>
        )}
      </div>
      {showStartModal && (
        <StartCashierSessionModal
          onClose={handleCloseStartModal}
          onSuccess={handleModalSuccess}
        />
      )}

      {showCloseModal.show && showCloseModal.session && (
        <CloseCashierSessionModal
          session={showCloseModal.session}
          onClose={handleCloseCloseModal}
          onSuccess={handleModalSuccess}
        />
      )}

      {showCashModal.show && showCashModal.session && (
        <CashTransactionModal
          session={showCashModal.session}
          onClose={handleCloseCashModal}
          onSuccess={handleModalSuccess}
        />
      )}
    </AdminLayout>
  );
};

export default CashierBalancingPage;