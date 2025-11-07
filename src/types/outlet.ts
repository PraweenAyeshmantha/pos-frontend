import type { RecordStatus } from './configuration';

export type OutletMode = 'GROCERY_RETAIL' | 'RESTAURANT_CAFE';

export interface Outlet {
  id: number;
  name: string;
  code: string;
  mode: OutletMode;
  address: string;
  phone: string;
  email: string;
  recordStatus: RecordStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOutletRequest {
  name: string;
  code: string;
  mode: OutletMode;
  address: string;
  phone: string;
  email: string;
  recordStatus: RecordStatus;
}

export interface UpdateOutletRequest extends CreateOutletRequest {
  id: number;
}

export interface OutletFormValues {
  name: string;
  code: string;
  mode: OutletMode;
  inventoryType: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postcode: string;
  phone: string;
  email: string;
  payments: string[];
  invoice: string;
  tables: string;
  recordStatus: RecordStatus;
}
