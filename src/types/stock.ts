export interface ProductStock {
  id: number;
  productId: number;
  productName: string;
  outletId?: number;
  outletName?: string;
  quantity: number;
  reorderLevel?: number;
  maxStockLevel?: number;
}

export interface ProductWithStock {
  id: number;
  productId: number;
  productName: string;
  productType: string;
  barcode?: string;
  price: number;
  centralizedStock?: number;
  customStock?: number;
  isInStock: boolean;
}

export interface UpdateStockRequest {
  productId: number;
  outletId?: number;
  stockLevel: number;
  costPrice?: number;
}

export interface StockFilter {
  outletId?: number;
  searchQuery?: string;
}

export interface StockAlert {
  id: number;
  productId: number;
  productName: string;
  outletId: number;
  outletName: string;
  currentStock: number;
  reorderLevel: number;
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK';
  createdAt: string;
  acknowledged: boolean;
}

export interface StockConfiguration {
  id: number;
  configKey: string;
  configValue: string;
  category: 'STOCK';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockBatch {
  id: number;
  stockId: number;
  batchNumber: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  remainingQuantity: number;
  batchDate: string;
  createdDate: string;
  modifiedDate: string;
}
