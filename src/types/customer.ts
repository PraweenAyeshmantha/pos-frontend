import type { RecordStatus } from './configuration';

export interface Customer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  loyaltyNumber?: string;
  loyaltyPoints: number;
  recordStatus: RecordStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCustomerRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  loyaltyNumber?: string;
  loyaltyPoints?: number;
  recordStatus: RecordStatus;
}

export interface UpdateCustomerRequest extends CreateCustomerRequest {
  id: number;
}

export interface CustomerFormValues {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  country: string;
  postcode: string;
  taxNumber: string;
  loyaltyPoints: string;
  recordStatus: RecordStatus;
}
