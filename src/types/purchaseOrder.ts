export type PurchaseOrderStatus = 'DRAFT' | 'SUBMITTED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderItem {
  id: number;
  productId: number;
  productName: string;
  supplierProductId?: number;
  orderedQuantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
  unitCost: number;
  lineTotal: number;
  note?: string;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  status: PurchaseOrderStatus;
  supplierId: number;
  supplierName: string;
  outletId: number;
  outletName?: string;
  orderedDate: string;
  expectedDate?: string;
  referenceNumber?: string;
  paymentTerms?: string;
  currencyCode?: string;
  remarks?: string;
  totalQuantity: number;
  totalAmount: number;
  receivedQuantity: number;
  lastReceivedDate?: string;
  items: PurchaseOrderItem[];
  createdDate?: string;
  modifiedDate?: string;
}

export interface PurchaseOrderItemRequest {
  productId: number;
  supplierProductId?: number;
  orderedQuantity: number;
  unitCost: number;
  note?: string;
}

export interface PurchaseOrderRequest {
  supplierId: number;
  outletId: number;
  status?: PurchaseOrderStatus;
  orderedDate?: string;
  expectedDate?: string;
  referenceNumber?: string;
  paymentTerms?: string;
  currencyCode?: string;
  remarks?: string;
  items: PurchaseOrderItemRequest[];
}
