import type { RecordStatus } from './configuration';
import type { OutletSummary } from './auth';
import type { UserCategory } from './auth';

export interface Cashier {
  id: number;
  userId?: number | null;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  recordStatus: RecordStatus;
  requirePasswordReset: boolean;
  otpEnabled: boolean;
  otpPhoneNumber?: string;
  categories: UserCategory[];
  assignedOutlets: OutletSummary[];
  defaultOutlet?: OutletSummary | null;
  createdDate?: string;
  modifiedDate?: string;
}

export interface CashierCandidate {
  userId: number;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  categories: UserCategory[];
  assignedOutlets: OutletSummary[];
}

export interface CashierFormValues {
  userId: number | null;
  otpPhoneNumber: string;
  otpEnabled: boolean;
  recordStatus: RecordStatus;
  requirePasswordReset: boolean;
  defaultOutletId: number | null;
}

export interface CreateCashierRequest {
  userId: number;
  otpPhoneNumber?: string;
  otpEnabled?: boolean;
  recordStatus: RecordStatus;
  requirePasswordReset?: boolean;
  defaultOutletId?: number | null;
}

export interface UpdateCashierRequest {
  id: number;
  otpPhoneNumber?: string;
  otpEnabled?: boolean;
  recordStatus?: RecordStatus;
  requirePasswordReset?: boolean;
  defaultOutletId?: number | null;
}
