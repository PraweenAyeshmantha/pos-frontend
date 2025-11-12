import type { RecordStatus } from './configuration';

export type ProductType = 'Simple' | 'Variation';

export type StockStatus = 'IN_STOCK' | 'OUT_OF_STOCK' | 'LOW_STOCK' | 'NO_STOCK_CONFIG';

export interface Product {
  id: number;
  name: string;
  price: number;
  sku?: string;
  description?: string;
  cost?: number;
  taxRate?: number;
  category?: string;
  categoryId?: number;
  unit?: string;
  isWeightBased?: boolean;
  imageUrl?: string;
  barcode?: string;
  barcodeImage?: string;
  productType?: ProductType;
  stockStatus?: StockStatus;
  tags: string[];
  tagIds: number[];
  brands: string[];
  brandIds: number[];
  isActive?: boolean;
  recordStatus?: RecordStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProductBarcodeRequest {
  id: number;
  barcode: string;
}

export interface PrintBarcodeRequest {
  productId: number;
  quantity: number;
}

export interface ProductUpsertRequest {
  name: string;
  price: number;
  sku?: string;
  description?: string;
  cost?: number;
  taxRate?: number;
  categoryId?: number;
  unit?: string;
  isWeightBased?: boolean;
  imageUrl?: string;
  recordStatus?: RecordStatus;
  tagIds?: number[];
  brandIds?: number[];
}

export interface ProductFormValues {
  name: string;
  price: string;
  productType: ProductType;
  barcode: string;
  sku: string;
  description: string;
  cost: string;
  taxRate: string;
  categoryId: string;
  unit: string;
  isWeightBased: boolean;
  imageUrl: string;
  recordStatus: RecordStatus;
  tagIds: string[];
  brandIds: string[];
}

export interface ProductWithStockDetails extends Product {
  customStock?: number;
  reorderLevel?: number;
  maxStockLevel?: number;
  isInStock: boolean;
}
