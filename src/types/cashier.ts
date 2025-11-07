import type { OutletMode } from './outlet';
import type { RecordStatus } from './configuration';

export type CashierRole = 'POS_CASHIER' | 'ADMINISTRATOR';

export interface CashierOutlet {
  id: number;
  name: string;
  code?: string;
  mode?: OutletMode;
}

export interface Cashier {
  id: number;
  name: string;
  username: string;
  email: string;
  phone?: string;
  role: CashierRole;
  recordStatus: RecordStatus;
  requirePasswordReset: boolean;
  assignedOutlets: CashierOutlet[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CashierFormValues {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: CashierRole;
  password: string;
  recordStatus: RecordStatus;
  requirePasswordReset: boolean;
  sendCredentials: boolean;
  assignedOutletIds: number[];
}

export interface CreateCashierRequest {
  name: string;
  username: string;
  email: string;
  phone?: string;
  password: string;
  role: CashierRole;
  recordStatus: RecordStatus;
  requirePasswordReset: boolean;
  assignedOutletIds: number[];
  sendCredentials?: boolean;
}

export interface UpdateCashierRequest {
  id: number;
  name: string;
  username: string;
  email: string;
  phone?: string;
  password?: string;
  role: CashierRole;
  recordStatus: RecordStatus;
  requirePasswordReset: boolean;
  assignedOutletIds: number[];
  sendCredentials?: boolean;
}
