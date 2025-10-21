import type { RecordStatus } from './configuration';

export type ProductType = 'Simple' | 'Variation';

export interface Product {
  id: number;
  name: string;
  productType: ProductType;
  price: number;
  barcode?: string;
  barcodeImage?: string;
  sku?: string;
  description?: string;
  cost?: number;
  taxRate?: number;
  category?: string;
  unit?: string;
  isWeightBased?: boolean;
  imageUrl?: string;
  isActive?: boolean;
  stockStatus?: 'IN_STOCK' | 'OUT_OF_STOCK' | 'LOW_STOCK';
  tags?: string[];
  brands?: string[];
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

export interface CreateProductRequest {
  name: string;
  price: number;
  productType?: ProductType;
  barcode?: string;
  sku?: string;
  description?: string;
  cost?: number;
  taxRate?: number;
  category?: string;
  unit?: string;
  isWeightBased?: boolean;
  imageUrl?: string;
  isActive?: boolean;
  recordStatus?: RecordStatus;
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
  category: string;
  unit: string;
  isWeightBased: boolean;
  imageUrl: string;
  isActive: boolean;
  recordStatus: RecordStatus;
}
