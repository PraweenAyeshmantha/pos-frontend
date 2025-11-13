export type GoodsReceivedNoteStatus = 'DRAFT' | 'POSTED';

export interface GoodsReceivedNoteItem {
  id: number;
  productId: number;
  productName: string;
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
  quantity: number;
  unitCost: number;
  unitPrice?: number;
  batchNumber?: string;
}

export interface GoodsReceivedNoteRequest {
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
  quantity: string;
  unitCost: string;
  unitPrice: string;
  batchNumber: string;
}

export interface GoodsReceivedNoteFormState {
  supplierId: string;
  referenceNumber: string;
  remarks: string;
  status: GoodsReceivedNoteStatus;
  items: GoodsReceivedNoteFormItem[];
}
