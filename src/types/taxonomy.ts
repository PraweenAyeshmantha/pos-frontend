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

export interface CreateTaxonomyRequest extends TaxonomyFormValues {}

export interface UpdateTaxonomyRequest extends TaxonomyFormValues {
  id: number;
}

export interface Tag extends TaxonomyEntity {}

export interface Brand extends TaxonomyEntity {}

export interface ProductCategory extends TaxonomyEntity {}
