export type CashierSessionStatus = 'OPEN' | 'CLOSED';

export interface CashierSession {
  id: number;
  status: CashierSessionStatus;
  openingBalance: number;
  currentBalance: number;
  closingBalance?: number;
  openingTime: string;
  closingTime?: string;
  notes?: string;
  createdDate: string;
  updatedDate: string;

  // Cashier details
  cashierId: number;
  cashierName: string;
  cashierUsername: string;

  // Outlet details
  outletId: number;
  outletName: string;
  outletCode?: string;
}

export interface StartCashierSessionRequest {
  cashierId: number;
  outletId: number;
  openingBalance: number;
}

export interface CloseCashierSessionRequest {
  sessionId: number;
  closingBalance: number;
  notes?: string;
}