import React, { useCallback, useEffect, useMemo, useState } from 'react';
import CashierLayout from '../../components/layout/CashierLayout';
import Alert, { type AlertType } from '../../components/common/Alert';
import ToastContainer from '../../components/common/ToastContainer';
import { transactionService, type Transaction, type CreateTransactionRequest } from '../../services/transactionService';
import { useAuth } from '../../hooks/useAuth';

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
};

const formatDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
};

const getTransactionLabel = (type: string): string => {
  const labels: Record<string, string> = {
    OPENING_BALANCE: 'Open Cash Drawer Amount',
    CLOSING_BALANCE: 'Closing Balance',
    CASH_IN: 'Cash In',
    CASH_OUT: 'Cash Out',
    EXPENSE: 'Expense',
    REFUND: 'Refund',
    SALE: 'Sale',
  };
  return labels[type] || type;
};

const StatisticsPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedOutletId, setSelectedOutletId] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [alert, setAlert] = useState<{ type: AlertType; title: string; message: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState<CreateTransactionRequest>({
    outletId: 0,
    transactionType: 'CASH_IN',
    amount: 0,
    description: '',
    referenceNumber: '',
  });

  // Initialize outlet from session storage
  useEffect(() => {
    const storedOutletId = sessionStorage.getItem('selectedOutletId');
    if (storedOutletId) {
      setSelectedOutletId(Number(storedOutletId));
    } else {
      // Default to outlet 1 if not set
      setSelectedOutletId(1);
      sessionStorage.setItem('selectedOutletId', '1');
    }
  }, []);

  const showToast = useCallback((type: AlertType, title: string, message: string) => {
    setAlert({ type, title, message });
  }, []);

  const fetchData = useCallback(async () => {
    if (!selectedOutletId) {
      setLoadError('No outlet selected');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setLoadError(null);

      const today = new Date().toISOString().split('T')[0];
      const startOfDay = `${today}T00:00:00Z`;
      const endOfDay = `${today}T23:59:59Z`;

      console.log('Fetching transactions for outlet:', selectedOutletId);

      const transactionsData = await transactionService.getAll({
        outletId: selectedOutletId,
        startDate: startOfDay,
        endDate: endOfDay,
      });

      console.log('Transactions received:', transactionsData.length);

      setTransactions(transactionsData);
    } catch (err) {
      console.error('Error loading statistics', err);
      setLoadError('Failed to load statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedOutletId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Calculate metrics from transactions
  const openCashDrawerAmount = useMemo(() => {
    return transactions
      .filter((t) => t.transactionType === 'OPENING_BALANCE')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [transactions]);

  const todaysCashSale = useMemo(() => {
    return transactions
      .filter((t) => t.transactionType === 'SALE' && t.paymentMethod?.toLowerCase() === 'cash')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [transactions]);

  const todaysTotalSale = useMemo(() => {
    return transactions
      .filter((t) => t.transactionType === 'SALE')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [transactions]);

  const cashIn = useMemo(() => {
    return transactions
      .filter((t) => t.transactionType === 'CASH_IN')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [transactions]);

  const cashOut = useMemo(() => {
    return transactions
      .filter((t) => t.transactionType === 'CASH_OUT' || t.transactionType === 'EXPENSE')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [transactions]);

  const expectedDrawerAmount = useMemo(() => {
    return openCashDrawerAmount + todaysCashSale + cashIn - cashOut;
  }, [openCashDrawerAmount, todaysCashSale, cashIn, cashOut]);

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) {
      return transactions;
    }

    const query = searchQuery.toLowerCase();
    return transactions.filter((transaction) => {
      const idMatch = transaction.id.toString().includes(query);
      const descMatch = transaction.description?.toLowerCase().includes(query) ?? false;
      const refMatch = transaction.referenceNumber?.toLowerCase().includes(query) ?? false;
      const typeMatch = getTransactionLabel(transaction.transactionType).toLowerCase().includes(query);
      const cashierNameMatch = transaction.cashierName?.toLowerCase().includes(query) ?? false;
      const cashierUsernameMatch = transaction.cashierUsername?.toLowerCase().includes(query) ?? false;
      const orderNumberMatch = transaction.orderNumber?.toLowerCase().includes(query) ?? false;
      const paymentMethodMatch = transaction.paymentMethod?.toLowerCase().includes(query) ?? false;
      return idMatch || descMatch || refMatch || typeMatch || cashierNameMatch || cashierUsernameMatch || orderNumberMatch || paymentMethodMatch;
    });
  }, [transactions, searchQuery]);

  const handleAddTransaction = useCallback(async () => {
    if (!selectedOutletId) {
      showToast('error', 'Error', 'No outlet selected');
      return;
    }

    if (newTransaction.amount <= 0) {
      showToast('error', 'Invalid Amount', 'Please enter a valid amount greater than 0');
      return;
    }

    try {
      const request: CreateTransactionRequest = {
        ...newTransaction,
        outletId: selectedOutletId,
        cashierId: user?.cashierId ?? undefined,
      };

      await transactionService.createTransaction(request);
      showToast('success', 'Transaction Added', 'Transaction has been recorded successfully');
      setShowAddModal(false);
      setNewTransaction({
        outletId: selectedOutletId,
        transactionType: 'CASH_IN',
        amount: 0,
        description: '',
        referenceNumber: '',
      });
      void fetchData();
    } catch (err) {
      console.error('Error creating transaction', err);
      showToast('error', 'Error', 'Failed to create transaction');
    }
  }, [newTransaction, selectedOutletId, user, showToast, fetchData]);

  const renderLoading = () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <p className="text-sm text-slate-500">Loading statistics...</p>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-lg font-semibold text-red-900">Unable to Load Statistics</p>
        <p className="mt-2 text-sm text-red-700">{loadError}</p>
        <button
          type="button"
          onClick={() => void fetchData()}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    </div>
  );

  if (loading) return <CashierLayout>{renderLoading()}</CashierLayout>;
  if (loadError) return <CashierLayout>{renderError()}</CashierLayout>;

  return (
    <CashierLayout>
      <div className="flex min-h-screen flex-col gap-6 bg-slate-50 p-6">
        {/* Alert */}
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

        {/* Metric Cards */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600">Open Cash Drawer Amount</p>
            <p className="mt-3 text-3xl font-bold text-red-600">
              {formatCurrency(openCashDrawerAmount)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600">Today's Cash Sale</p>
            <p className="mt-3 text-3xl font-bold text-emerald-600">
              {formatCurrency(todaysCashSale)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600">Today's Total Sale</p>
            <p className="mt-3 text-3xl font-bold text-blue-600">
              {formatCurrency(todaysTotalSale)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600">Expected Drawer Amount</p>
            <p className="mt-3 text-3xl font-bold text-amber-600">
              {formatCurrency(expectedDrawerAmount)}
            </p>
          </div>
        </section>

        {/* Today's Transactions Section */}
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">Today's Transactions</h2>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-600 bg-white text-2xl text-blue-600 transition hover:bg-blue-50"
              title="Add Transaction"
            >
              +
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by order, transaction ID, cashier, type, or payment method"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 px-4 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <span className="whitespace-nowrap text-sm text-slate-500">
              {filteredTransactions.length} Result{filteredTransactions.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Transactions Table */}
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Transaction ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Order #
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                      In
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Cashier
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                        {searchQuery ? 'No transactions match your search' : 'No transactions recorded today'}
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((transaction) => {
                      // Use amountIn and amountOut from backend if available, otherwise fallback to old logic
                      const amountIn = transaction.amountIn ?? 
                        (['OPENING_BALANCE', 'CASH_IN', 'SALE'].includes(transaction.transactionType) ? transaction.amount : 0);
                      const amountOut = transaction.amountOut ?? 
                        (!['OPENING_BALANCE', 'CASH_IN', 'SALE'].includes(transaction.transactionType) ? transaction.amount : 0);

                      return (
                        <tr key={transaction.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm text-slate-900">
                            #{transaction.id}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {transaction.orderNumber || '—'}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-emerald-600">
                            {amountIn != null && amountIn > 0 ? `+${formatCurrency(amountIn)}` : '—'}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-red-600">
                            {amountOut != null && amountOut > 0 ? `−${formatCurrency(amountOut)}` : '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            {getTransactionLabel(transaction.transactionType)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            {transaction.paymentMethod || '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-900">
                            {transaction.cashierName || transaction.cashierUsername || '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {transaction.description || '—'}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {formatDateTime(transaction.transactionDate)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => {
              setShowAddModal(false);
              setNewTransaction({
                outletId: selectedOutletId || 0,
                transactionType: 'CASH_IN',
                amount: 0,
                description: '',
                referenceNumber: '',
              });
            }}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="text-lg font-semibold text-slate-900">Add Transaction</h2>
              <p className="mt-1 text-sm text-slate-500">Record a new cash transaction</p>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label htmlFor="transaction-type" className="block text-sm font-medium text-slate-700">
                  Transaction Type
                </label>
                <select
                  id="transaction-type"
                  value={newTransaction.transactionType}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      transactionType: e.target.value as CreateTransactionRequest['transactionType'],
                    })
                  }
                  className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="CASH_IN">Cash In</option>
                  <option value="CASH_OUT">Cash Out</option>
                  <option value="EXPENSE">Expense</option>
                  <option value="OPENING_BALANCE">Opening Balance</option>
                  <option value="CLOSING_BALANCE">Closing Balance</option>
                </select>
              </div>

              <div>
                <label htmlFor="transaction-amount" className="block text-sm font-medium text-slate-700">
                  Amount
                </label>
                <input
                  id="transaction-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newTransaction.amount}
                  onChange={(e) =>
                    setNewTransaction({ ...newTransaction, amount: parseFloat(e.target.value) || 0 })
                  }
                  className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="transaction-description" className="block text-sm font-medium text-slate-700">
                  Description
                </label>
                <input
                  id="transaction-description"
                  type="text"
                  value={newTransaction.description}
                  onChange={(e) =>
                    setNewTransaction({ ...newTransaction, description: e.target.value })
                  }
                  className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label htmlFor="transaction-reference" className="block text-sm font-medium text-slate-700">
                  Reference Number
                </label>
                <input
                  id="transaction-reference"
                  type="text"
                  value={newTransaction.referenceNumber}
                  onChange={(e) =>
                    setNewTransaction({ ...newTransaction, referenceNumber: e.target.value })
                  }
                  className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setNewTransaction({
                    outletId: selectedOutletId || 0,
                    transactionType: 'CASH_IN',
                    amount: 0,
                    description: '',
                    referenceNumber: '',
                  });
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleAddTransaction()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Add Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </CashierLayout>
  );
};

export default StatisticsPage;
