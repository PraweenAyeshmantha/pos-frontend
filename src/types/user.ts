import type { RecordStatus } from './configuration';
import type { UserCategory, OutletSummary } from './auth';

export interface UserAccount {
  id: number;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  recordStatus: RecordStatus;
  requirePasswordReset: boolean;
  categories: UserCategory[];
  assignedOutlets: OutletSummary[];
  defaultOutlet?: OutletSummary | null;
  createdDate?: string;
  modifiedDate?: string;
}

export interface UserFormValues {
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  requirePasswordReset: boolean;
  recordStatus: RecordStatus;
  categoryCodes: string[];
  assignedOutletIds: number[];
  defaultOutletId: number | null;
}

export interface CreateUserRequestPayload {
  name: string;
  username: string;
  email?: string;
  phone?: string;
  password: string;
  requirePasswordReset: boolean;
  recordStatus: RecordStatus;
  categoryCodes: string[];
  assignedOutletIds?: number[];
  defaultOutletId?: number | null;
}

export interface UpdateUserRequestPayload {
  id: number;
  name: string;
  username: string;
  email?: string;
  phone?: string;
  password?: string;
  requirePasswordReset: boolean;
  recordStatus: RecordStatus;
  categoryCodes: string[];
  assignedOutletIds?: number[];
  defaultOutletId?: number | null;
}
