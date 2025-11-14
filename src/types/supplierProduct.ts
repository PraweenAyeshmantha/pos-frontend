import type { RecordStatus } from './configuration';

export interface SupplierProduct {
  id: number;
  supplierId: number;
  productId: number;
  productName: string;
  supplierSku?: string;
  supplierProductName?: string;
  leadTimeDays?: number;
  minimumOrderQuantity?: number;
  purchaseCost?: number;
  currencyCode?: string;
  preferredSupplier?: boolean;
  lastPurchasedAt?: string;
  notes?: string;
  recordStatus: RecordStatus;
  createdDate?: string;
  modifiedDate?: string;
}

export interface SupplierProductRequest {
  productId: number;
  supplierSku?: string;
  supplierProductName?: string;
  leadTimeDays?: number;
  minimumOrderQuantity?: number;
  purchaseCost?: number;
  currencyCode?: string;
  preferredSupplier?: boolean;
  notes?: string;
}
