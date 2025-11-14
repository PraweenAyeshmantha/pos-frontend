export type StockAdjustmentReason =
  | 'SHRINKAGE'
  | 'DAMAGE'
  | 'EXPIRED'
  | 'CYCLE_COUNT'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'MANUAL';

export interface StockAdjustment {
  id: number;
  stockId: number;
  productId: number;
  productName: string;
  outletId: number;
  outletName: string;
  quantityChange: number;
  countedQuantity?: number;
  resultingQuantity?: number;
  reason: StockAdjustmentReason;
  note?: string;
  referenceType?: string;
  referenceId?: string;
  createdBy?: string;
  createdAt: string;
}

export interface StockAdjustmentRequest {
  productId: number;
  outletId: number;
  quantityChange?: number;
  countedQuantity?: number;
  reason?: StockAdjustmentReason;
  note?: string;
  referenceType?: string;
  referenceId?: string;
}

export type CycleCountStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface CycleCountItemRequest {
  productId: number;
  countedQuantity: number;
  reason?: StockAdjustmentReason;
  note?: string;
}

export interface CycleCountRequest {
  outletId: number;
  reference: string;
  notes?: string;
  items: CycleCountItemRequest[];
}

export interface CycleCountItem {
  id: number;
  productId: number;
  productName: string;
  expectedQuantity: number;
  countedQuantity: number;
  variance: number;
  reason?: StockAdjustmentReason;
  note?: string;
}

export interface CycleCountTask {
  id: number;
  taskNumber: string;
  outletId: number;
  outletName: string;
  status: CycleCountStatus;
  scheduledDate?: string;
  countedDate?: string;
  notes?: string;
  items: CycleCountItem[];
}

export type StockTransferStatus = 'REQUESTED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';

export interface StockTransferItemRequest {
  productId: number;
  quantity: number;
  note?: string;
}

export interface StockTransferRequest {
  sourceOutletId: number;
  targetOutletId: number;
  notes?: string;
  items: StockTransferItemRequest[];
}

export interface StockTransferItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  note?: string;
}

export interface StockTransfer {
  id: number;
  transferNumber: string;
  status: StockTransferStatus;
  sourceOutletId: number;
  sourceOutletName: string;
  targetOutletId: number;
  targetOutletName: string;
  notes?: string;
  requestedDate?: string;
  shippedDate?: string;
  receivedDate?: string;
  items: StockTransferItem[];
}
