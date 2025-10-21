import type { RecordStatus } from './configuration';

export type ProductType = 'Simple' | 'Variation';

export interface Product {
  id: number;
  name: string;
  productType: ProductType;
  price: number;
  barcode?: string;
  barcodeImage?: string;
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
  recordStatus?: RecordStatus;
}

export interface ProductFormValues {
  name: string;
  price: string;
  productType: ProductType;
  barcode: string;
  sku: string;
  description: string;
  recordStatus: RecordStatus;
}
