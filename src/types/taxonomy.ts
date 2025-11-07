import type { RecordStatus } from './configuration';

export interface TaxonomyEntity {
  id: number;
  name: string;
  description?: string;
  recordStatus: RecordStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaxonomyFormValues {
  name: string;
  description?: string;
  recordStatus: RecordStatus;
}

export type CreateTaxonomyRequest = TaxonomyFormValues;

export interface UpdateTaxonomyRequest extends TaxonomyFormValues {
  id: number;
}

export type Tag = TaxonomyEntity;

export type Brand = TaxonomyEntity;

export type ProductCategory = TaxonomyEntity;
