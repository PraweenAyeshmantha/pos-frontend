export interface PaymentMethod {
  id: number;
  slug: string;
  name: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  createdDate?: string;
  modifiedDate?: string;
}

export interface PaymentMethodCreatePayload {
  slug: string;
  name: string;
  description?: string;
  isActive: boolean;
  isDefault?: boolean;
}

export interface PaymentMethodUpdatePayload {
  name: string;
  description?: string;
  isActive: boolean;
}
