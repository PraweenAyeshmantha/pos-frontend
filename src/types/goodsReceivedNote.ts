export type GoodsReceivedNoteStatus = 'DRAFT' | 'POSTED';

export interface GoodsReceivedNoteItem {
  id: number;
  productId: number;
  productName: string;
  purchaseOrderItemId?: number;
  quantity: number;
  unitCost: number;
  unitPrice?: number;
  lineTotal: number;
  batchNumber?: string;
}

export interface GoodsReceivedNote {
  id: number;
  grnNumber: string;
  supplierId?: number;
  supplierName?: string;
  supplierCode?: string;
  outletId: number;
  outletName?: string;
  purchaseOrderId?: number;
  purchaseOrderNumber?: string;
  receivedDate: string;
  referenceNumber?: string;
  remarks?: string;
  status: GoodsReceivedNoteStatus;
  totalQuantity: number;
  totalAmount: number;
  items: GoodsReceivedNoteItem[];
  createdDate?: string;
}

export interface GoodsReceivedNoteItemRequest {
  productId: number;
  purchaseOrderItemId?: number;
  quantity: number;
  unitCost: number;
  unitPrice?: number;
  batchNumber?: string;
}

export interface GoodsReceivedNoteRequest {
  purchaseOrderId?: number;
  supplierId?: number;
  outletId: number;
  receivedDate?: string;
  referenceNumber?: string;
  remarks?: string;
  status?: GoodsReceivedNoteStatus;
  items: GoodsReceivedNoteItemRequest[];
}

export interface GoodsReceivedNoteFormItem {
  id: string;
  productId: string;
  purchaseOrderItemId?: string;
  quantity: string;
  unitCost: string;
  unitPrice: string;
  batchNumber: string;
  orderedQuantity?: number;
  remainingQuantity?: number;
}

export interface GoodsReceivedNoteFormState {
  supplierId: string;
  purchaseOrderId: string;
  referenceNumber: string;
  remarks: string;
  status: GoodsReceivedNoteStatus;
  items: GoodsReceivedNoteFormItem[];
}
