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
}

export interface StockFilter {
  outletId?: number;
  searchQuery?: string;
}
