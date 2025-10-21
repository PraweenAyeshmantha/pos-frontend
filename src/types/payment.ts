import type { RecordStatus } from './configuration';

export interface PaymentMethod {
  id: number;
  slug: string;
  name: string;
  description?: string;
  recordStatus: RecordStatus;
  isDefault: boolean;
  createdDate?: string;
  modifiedDate?: string;
}

export interface PaymentMethodCreatePayload {
  slug: string;
  name: string;
  description?: string;
  recordStatus: RecordStatus;
  isDefault?: boolean;
}

export interface PaymentMethodUpdatePayload {
  name: string;
  description?: string;
  recordStatus: RecordStatus;
}
