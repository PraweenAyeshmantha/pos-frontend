import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CashierLayout from '../../components/layout/CashierLayout';
import Alert, { type AlertType } from '../../components/common/Alert';
import ToastContainer from '../../components/common/ToastContainer';
import SelectOutletReminder from '../../components/cashier/SelectOutletReminder';
import StartCashierSessionModal from '../../components/cashier/cashier-balancing/StartCashierSessionModal';
import CloseCashierSessionModal from '../../components/cashier/cashier-balancing/CloseCashierSessionModal';
import CashTransactionModal from '../../components/cashier/cashier-balancing/CashTransactionModal';
import { cashierSessionService } from '../../services/cashierSessionService';
import { transactionService, type Transaction } from '../../services/transactionService';
import { statisticsService } from '../../services/statisticsService';
import type { CashierSession } from '../../types/cashierSession';
import { useOutlet } from '../../contexts/OutletContext';

const CashierBalancingPage: React.FC = () => {
  const { currentOutlet } = useOutlet();
  const selectedOutletId = currentOutlet?.id ?? null;
  const [activeSession, setActiveSession] = useState<CashierSession | null>(null);
  const [sessionTransactions, setSessionTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: AlertType; title: string; message: string } | null>(null);
  const [showStartModal, setShowStartModal] = useState<boolean>(false);
  const [showCloseModal, setShowCloseModal] = useState<boolean>(false);
  const [showCashModal, setShowCashModal] = useState<boolean>(false);
  const [balanceData, setBalanceData] = useState<{
    openCashDrawerAmount: number;
    todaysCashSale: number;
    todaysTotalSale: number;
    expectedDrawerAmount: number;
  } | null>(null);

  const fetchSessionTransactions = useCallback(async (session: CashierSession) => {
    try {
      // Fetch transactions for this specific session only
      const transactions = await transactionService.getBySession(session.id);
      
      console.log('Transactions loaded for active session:', transactions.length);
      setSessionTransactions(transactions);
    } catch (err) {
      console.error('Error loading session transactions', err);
      setSessionTransactions([]);
    }
  }, []);

  const fetchActiveSession = useCallback(async () => {
    if (!selectedOutletId) {
      setLoading(false);
      setActiveSession(null);
      setSessionTransactions([]);
      setBalanceData(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const session = await cashierSessionService.getMyActiveSession(selectedOutletId);
      setActiveSession(session);
      if (session) {
        // Fetch session transactions
        await fetchSessionTransactions(session);
        
        // Fetch balance data from the backend API for active session
        try {
          const balance = await statisticsService.getCurrentSessionBalance(session.cashierId, session.outletId);
          setBalanceData(balance);
          console.log('Balance data loaded:', balance);
        } catch (err) {
          console.error('Error loading balance data', err);
          setBalanceData(null);
        }
      } else {
        setSessionTransactions([]);
        setBalanceData(null);
      }
    } catch (err) {
      console.error('Error loading active session', err);
      setError('Failed to load your active session. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fetchSessionTransactions, selectedOutletId]);

  const isCashSale = (transaction: Transaction): boolean => {
    return transaction.transactionType === 'SALE' && transaction.paymentMethod?.toLowerCase() === 'cash';
  };

  const CASH_IN_TRANSACTION_TYPES = ['OPENING_BALANCE', 'CASH_IN'] as const;
  const CASH_OUT_TRANSACTION_TYPES = ['CASH_OUT', 'EXPENSE', 'REFUND'] as const;

  const getCashAmountIn = (transaction: Transaction): number => {
    if (isCashSale(transaction)) {
      if (transaction.amountIn != null) {
        return transaction.amountIn;
      }
      return transaction.amount ?? 0;
    }

    if (CASH_IN_TRANSACTION_TYPES.includes(transaction.transactionType as (typeof CASH_IN_TRANSACTION_TYPES)[number])) {
      return transaction.amountIn ?? transaction.amount ?? 0;
    }

    return 0;
  };

  const getCashAmountOut = (transaction: Transaction): number => {
    if (transaction.transactionType === 'CLOSING_BALANCE') {
      return 0;
    }

    if (isCashSale(transaction)) {
      if (transaction.amountOut != null) {
        return transaction.amountOut;
      }
      return 0;
    }

    if (CASH_OUT_TRANSACTION_TYPES.includes(transaction.transactionType as (typeof CASH_OUT_TRANSACTION_TYPES)[number])) {
      return transaction.amountOut ?? transaction.amount ?? 0;
    }

    return 0;
  };

  const getCashNetAmount = (transaction: Transaction): number => {
    if (transaction.transactionType === 'CLOSING_BALANCE') {
      return transaction.amount ?? 0;
    }

    if (transaction.amountIn == null && transaction.amountOut == null) {
      if (isCashSale(transaction)) {
        return transaction.amount ?? 0;
      }

      if (
        CASH_IN_TRANSACTION_TYPES.includes(transaction.transactionType as (typeof CASH_IN_TRANSACTION_TYPES)[number]) ||
        CASH_OUT_TRANSACTION_TYPES.includes(transaction.transactionType as (typeof CASH_OUT_TRANSACTION_TYPES)[number])
      ) {
        return transaction.amount ?? 0;
      }
    }

    return getCashAmountIn(transaction) - getCashAmountOut(transaction);
  };
  // Calculate current balance based on backend data or fallback to frontend calculation
  const calculateCurrentBalance = useCallback((): number => {
    if (balanceData) {
      return balanceData.expectedDrawerAmount;
    }
    
    // Fallback calculation if backend data is not available
    if (!activeSession) return 0;

    let balance = activeSession.openingBalance;

    const netCashMovement = sessionTransactions.reduce((sum, transaction) => {
      if (transaction.transactionType === 'OPENING_BALANCE') {
        return sum;
      }
      return sum + getCashNetAmount(transaction);
    }, 0);

    balance += netCashMovement;

    return balance;
  }, [activeSession, sessionTransactions, balanceData]);

  const saleTransactions = useMemo(() => {
    return sessionTransactions.filter((transaction) => isCashSale(transaction));
  }, [sessionTransactions]);

  // Use backend data for today's cash sale or calculate from transactions
  const cashRefundAmount = useMemo(() => {
    return sessionTransactions.reduce((sum, transaction) => {
      if (transaction.transactionType === 'REFUND' && transaction.paymentMethod?.toLowerCase() === 'cash') {
        return sum + Math.abs(getCashNetAmount(transaction));
      }
      return sum;
    }, 0);
  }, [sessionTransactions]);

  const todaysCashSale = useMemo(() => {
    if (balanceData) {
      return balanceData.todaysCashSale;
    }
    
    const grossCashSales = saleTransactions.reduce((sum, transaction) => sum + getCashNetAmount(transaction), 0);
    return grossCashSales - cashRefundAmount;
  }, [saleTransactions, balanceData, cashRefundAmount]);

  const cashIn = useMemo(() => {
    return sessionTransactions.reduce((sum, transaction) => {
      if (['OPENING_BALANCE', 'CLOSING_BALANCE'].includes(transaction.transactionType)) {
        return sum;
      }

      const amountInValue = getCashAmountIn(transaction);
      if (amountInValue > 0) {
        return sum + amountInValue;
      }

      return sum;
    }, 0);
  }, [sessionTransactions]);

  const cashOut = useMemo(() => {
    return sessionTransactions.reduce((sum, transaction) => {
      if (['OPENING_BALANCE', 'CLOSING_BALANCE'].includes(transaction.transactionType)) {
        return sum;
      }

      const amountOutValue = getCashAmountOut(transaction);
      if (amountOutValue > 0) {
        return sum + amountOutValue;
      }

      return sum;
    }, 0);
  }, [sessionTransactions]);

  const netCashFlow = useMemo(() => {
    return cashIn - cashOut;
  }, [cashIn, cashOut]);

  useEffect(() => {
    void fetchActiveSession();
    
    // Auto-refresh every 30 seconds to catch new transactions from POS
    const interval = setInterval(() => {
      void fetchActiveSession();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchActiveSession]);

  const handleStartSession = useCallback(() => {
    setShowStartModal(true);
  }, []);

  const handleCloseSession = useCallback(() => {
    setShowCloseModal(true);
  }, []);

  const handleCashTransaction = useCallback(() => {
    setShowCashModal(true);
  }, []);

  const handleModalSuccess = useCallback(() => {
    setAlert({
      type: 'success',
      title: 'Success',
      message: 'Operation completed successfully.',
    });
    void fetchActiveSession();
  }, [fetchActiveSession]);

  const handleCloseStartModal = useCallback(() => {
    setShowStartModal(false);
  }, []);

  const handleCloseCloseModal = useCallback(() => {
    setShowCloseModal(false);
  }, []);

  const handleCloseCashModal = useCallback(() => {
    setShowCashModal(false);
  }, []);

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

  const getTransactionLabel = (type: string): string => {
    const labels: Record<string, string> = {
      OPENING_BALANCE: 'Opening Balance',
      CLOSING_BALANCE: 'Closing Balance',
      CASH_IN: 'Cash In',
      CASH_OUT: 'Cash Out',
      EXPENSE: 'Expense',
      REFUND: 'Refund',
      SALE: 'Sale',
    };
    return labels[type] || type;
  };

  const getTransactionColor = (type: string): string => {
    if (type === 'CASH_IN' || type === 'SALE' || type === 'OPENING_BALANCE') {
      return 'bg-emerald-100 text-emerald-700';
    }
    if (type === 'CASH_OUT' || type === 'EXPENSE' || type === 'REFUND') {
      return 'bg-red-100 text-red-700';
    }
    if (type === 'CLOSING_BALANCE') {
      return 'bg-blue-100 text-blue-700';
    }
    return 'bg-slate-100 text-slate-700';
  };
  const getTransactionTimestamp = (transaction: Transaction): number => {
    const timestamp = transaction.transactionDate ?? transaction.createdDate;
    const date = timestamp ? new Date(timestamp) : null;
    return date?.getTime() ?? 0;
  };
  // Filter transactions to show cash-related ones
  const cashRelatedTransactions = useMemo(() => {
    return sessionTransactions
      .filter((t) => {
        // Include all cash transaction types
        if (['OPENING_BALANCE', 'CLOSING_BALANCE', 'CASH_IN', 'CASH_OUT', 'EXPENSE', 'REFUND'].includes(t.transactionType)) {
          return true;
        }
        // Include SALE transactions with cash payment
        if (t.transactionType === 'SALE' && t.paymentMethod?.toLowerCase() === 'cash') {
          return true;
        }
        return false;
      })
      .sort((a, b) => getTransactionTimestamp(b) - getTransactionTimestamp(a));
  }, [sessionTransactions]);

  const renderNoSessionState = () => (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <div className="text-6xl">💰</div>
        <h2 className="mt-4 text-xl font-semibold text-slate-900">No Active Shift</h2>
        <p className="mt-2 text-slate-600">
          You need to start your shift before you can manage your cash drawer.
        </p>
        <button
          type="button"
          onClick={handleStartSession}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Start My Shift
        </button>
      </div>
    </div>
  );

  if (!selectedOutletId) {
    return (
      <CashierLayout>
        <SelectOutletReminder message="Choose a branch from the top navigation before viewing cashier balancing." />
      </CashierLayout>
    );
  }



  return (
    <CashierLayout>
      <div className="px-4 pb-12 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-2">
            <h1 className="mt-2.5 text-3xl font-semibold tracking-tight text-slate-900">
              Cash Drawer Management 💰
            </h1>
            <p className="text-sm text-slate-500">
              Track your shift balance and manage cash transactions. Keep your drawer accurate throughout your shift.
            </p>
          </header>

          {(alert || error) && (
            <ToastContainer>
              {alert ? (
                <Alert type={alert.type} title={alert.title} message={alert.message} onClose={() => setAlert(null)} />
              ) : null}
              {error ? <Alert type="error" title="Error" message={error} onClose={() => setError(null)} /> : null}
            </ToastContainer>
          )}

          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
                <p className="mt-4 text-slate-600">Loading your shift status...</p>
              </div>
            </div>
          ) : !activeSession ? (
            renderNoSessionState()
          ) : (
            <>
              {/* Current Shift Status */}
              <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shift Status</p>
                  <p className="mt-3 text-lg font-semibold text-emerald-600">Active</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Started {formatDateTime(activeSession.openingTime)}
                  </p>
                </article>

                <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Opening Balance</p>
                  <p className="mt-3 text-2xl font-semibold text-slate-900">
                    {formatCurrency(activeSession.openingBalance)}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">Cash you started with</p>
                </article>

                <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Balance</p>
                      <p className="mt-3 text-2xl font-semibold text-slate-900">
                        {formatCurrency(calculateCurrentBalance())}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">Expected cash in drawer</p>
                    </div>
                    <button
                      onClick={() => void fetchActiveSession()}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                      title="Refresh balance"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>
                </article>

                <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Session Cash Sales</p>
                  <p className="mt-3 text-2xl font-semibold text-emerald-600">
                    {formatCurrency(todaysCashSale)}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">Cash sales in this session</p>
                </article>
              </section>

              {/* Cash Flow Metrics */}
              <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cash In</p>
                  <p className="mt-3 text-2xl font-semibold text-blue-600">
                    {formatCurrency(cashIn)}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">Added to drawer this session</p>
                </article>

                <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cash Out</p>
                  <p className="mt-3 text-2xl font-semibold text-red-600">
                    {formatCurrency(cashOut)}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">Removed from drawer this session</p>
                </article>

                <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cash Drawer Change</p>
                  <p className={`mt-3 text-2xl font-semibold ${netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(netCashFlow)}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">Cash in and cash out difference for this session</p>
                </article>
              </section>

              {/* Quick Actions */}
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
                    <p className="text-sm text-slate-500">Manage your cash drawer during your shift</p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleCashTransaction}
                      className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Add/Remove Cash ±
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseSession}
                      className="inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      End My Shift
                    </button>
                  </div>
                </div>
              </section>

              {/* Active Session Transactions */}
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <header className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Active Session Cash Transactions</h2>
                    <p className="text-sm text-slate-500">
                      Track all cash movements during your current shift
                    </p>
                  </div>
                  <div className="text-xs text-slate-500 whitespace-nowrap">
                    {cashRelatedTransactions.length} transaction{cashRelatedTransactions.length === 1 ? '' : 's'} in session
                  </div>
                </header>

                {cashRelatedTransactions.length === 0 ? (
                  <div className="flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
                    <div className="text-center">
                      <div className="text-4xl">💰</div>
                      <p className="mt-2 text-sm text-slate-500">No cash transactions yet</p>
                      <p className="text-xs text-slate-400">Cash movements will appear here</p>
                    </div>
                  </div>
                ) : (
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
                            Order #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {cashRelatedTransactions.map((transaction) => {
                          const netAmount = getCashNetAmount(transaction);
                          const isNeutral = transaction.transactionType === 'CLOSING_BALANCE';
                          const isCashIn = netAmount >= 0;
                          
                          return (
                            <tr key={transaction.id} className="hover:bg-slate-50">
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getTransactionColor(transaction.transactionType)}`}>
                                  {getTransactionLabel(transaction.transactionType)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`text-sm font-semibold ${isNeutral ? 'text-blue-600' : isCashIn ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {isNeutral ? '' : isCashIn ? '+' : '-'}{formatCurrency(Math.abs(netAmount))}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">
                                {transaction.orderNumber || '—'}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">
                                {transaction.description || '—'}
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600">
                                {formatDateTime(transaction.transactionDate)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {showStartModal && (
        <StartCashierSessionModal
          onClose={handleCloseStartModal}
          onSuccess={handleModalSuccess}
        />
      )}

      {showCloseModal && activeSession && (
        <CloseCashierSessionModal
          session={activeSession}
          currentBalance={calculateCurrentBalance()}
          onClose={handleCloseCloseModal}
          onSuccess={handleModalSuccess}
        />
      )}

      {showCashModal && activeSession && (
        <CashTransactionModal
          session={activeSession}
          currentBalance={calculateCurrentBalance()}
          onClose={handleCloseCashModal}
          onSuccess={handleModalSuccess}
        />
      )}
    </CashierLayout>
  );
};

export default CashierBalancingPage;
