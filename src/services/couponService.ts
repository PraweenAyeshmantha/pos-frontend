import apiClient from './apiClient';
import type { ApiResponse } from '../types/configuration';
import type { Coupon, CreateCouponPayload } from '../types/coupon';
import type { Product } from '../types/product';

export const couponService = {
  /**
   * Fetch all coupons (active only by default)
   */
  async getAll(includeInactive = false): Promise<Coupon[]> {
    const response = await apiClient.get<ApiResponse<Coupon[]>>('/coupons', {
      params: {
        includeInactive,
      },
    });
    return response.data.data || [];
  },

  /**
   * Fetch a coupon by ID
   */
  async getById(id: number): Promise<Coupon> {
    const response = await apiClient.get<ApiResponse<Coupon>>(`/coupons/${id}`);
    return response.data.data;
  },

  /**
   * Fetch a coupon by code
   */
  async getByCode(code: string): Promise<Coupon> {
    const response = await apiClient.get<ApiResponse<Coupon>>(`/coupons/code/${code}`);
    return response.data.data;
  },

  /**
   * Create a new coupon
   */
  async create(payload: CreateCouponPayload): Promise<Coupon> {
    const response = await apiClient.post<ApiResponse<Coupon>>('/coupons', payload);
    return response.data.data;
  },

  /**
   * Update an existing coupon
   */
  async update(id: number, payload: CreateCouponPayload): Promise<Coupon> {
    const response = await apiClient.put<ApiResponse<Coupon>>(`/coupons/${id}`, payload);
    return response.data.data;
  },

  /**
   * Delete a coupon
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/coupons/${id}`);
  },

  /**
   * Link products to a coupon
   */
  async linkProducts(couponId: number, productIds: number[]): Promise<Coupon> {
    const response = await apiClient.post<ApiResponse<Coupon>>(
      `/coupons/${couponId}/products`,
      { productIds }
    );
    return response.data.data;
  },

  /**
   * Unlink all products from a coupon (makes it applicable to all products)
   */
  async unlinkAllProducts(couponId: number): Promise<Coupon> {
    const response = await apiClient.delete<ApiResponse<Coupon>>(`/coupons/${couponId}/products`);
    return response.data.data;
  },

  /**
   * Get all products applicable to a coupon
   */
  async getApplicableProducts(couponId: number): Promise<Product[]> {
    const response = await apiClient.get<ApiResponse<Product[]>>(`/coupons/${couponId}/products`);
    return response.data.data || [];
  },

  /**
   * Check if a coupon is applicable to a specific product
   */
  async isCouponApplicableToProduct(couponId: number, productId: number): Promise<boolean> {
    const response = await apiClient.get<ApiResponse<boolean>>(
      `/coupons/${couponId}/products/${productId}/applicable`
    );
    return response.data.data || false;
  },
};
