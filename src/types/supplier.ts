import type { RecordStatus } from './configuration';

export interface Supplier {
  id: number;
  supplierCode: string;
  name: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  taxNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  defaultLeadTimeDays?: number;
  defaultPaymentTerms?: string;
  preferredCurrency?: string;
  preferredIncoterms?: string;
  orderingNotes?: string;
  recordStatus: RecordStatus;
  createdDate?: string;
  modifiedDate?: string;
}

export interface SupplierRequest {
  supplierCode?: string;
  name: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  taxNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  notes?: string;
  defaultLeadTimeDays?: number;
  defaultPaymentTerms?: string;
  preferredCurrency?: string;
  preferredIncoterms?: string;
  orderingNotes?: string;
  recordStatus?: RecordStatus;
}

export interface SupplierFormValues {
  supplierCode: string;
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  taxNumber: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes: string;
  defaultLeadTimeDays: string;
  defaultPaymentTerms: string;
  preferredCurrency: string;
  preferredIncoterms: string;
  orderingNotes: string;
  recordStatus: RecordStatus;
}
