export type DiscountType = 'FIXED' | 'PERCENTAGE';

export interface Coupon {
  id: number;
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  validFrom?: string | null;
  validTo?: string | null;
  usageLimit?: number | null;
  timesUsed: number;
  recordStatus: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  applicableProductIds?: number[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCouponPayload {
  code: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  validFrom?: string | null;
  validTo?: string | null;
  usageLimit?: number | null;
  applicableProductIds?: number[];
}

export interface CouponFormValues extends CreateCouponPayload {
  // For form handling
}

