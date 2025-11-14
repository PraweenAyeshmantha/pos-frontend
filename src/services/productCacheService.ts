import { createStore, get, set } from 'idb-keyval';
import type { Product } from '../types/product';
import type { ProductCategory } from '../types/taxonomy';
import type { PaymentMethod } from '../types/payment';

const cacheStore = createStore('pos-offline-cache', 'pos-cache');
const PRODUCTS_KEY = 'products';
const CATEGORIES_KEY = 'categories';
const PAYMENT_METHODS_KEY = 'payment_methods';

interface CachedProducts {
  products: Product[];
  timestamp: number;
}

interface CachedCategories {
  categories: ProductCategory[];
  timestamp: number;
}

interface CachedPaymentMethods {
  paymentMethods: PaymentMethod[];
  timestamp: number;
}

export const productCacheService = {
  async saveProducts(products: Product[]): Promise<void> {
    const payload: CachedProducts = {
      products,
      timestamp: Date.now(),
    };
    await set(PRODUCTS_KEY, payload, cacheStore);
  },

  async getProducts(): Promise<Product[] | null> {
    const cached = await get<CachedProducts | undefined>(PRODUCTS_KEY, cacheStore);
    return cached?.products ?? null;
  },

  async saveCategories(categories: ProductCategory[]): Promise<void> {
    const payload: CachedCategories = {
      categories,
      timestamp: Date.now(),
    };
    await set(CATEGORIES_KEY, payload, cacheStore);
  },

  async getCategories(): Promise<ProductCategory[] | null> {
    const cached = await get<CachedCategories | undefined>(CATEGORIES_KEY, cacheStore);
    return cached?.categories ?? null;
  },

  async savePaymentMethods(methods: PaymentMethod[]): Promise<void> {
    const payload: CachedPaymentMethods = {
      paymentMethods: methods,
      timestamp: Date.now(),
    };
    await set(PAYMENT_METHODS_KEY, payload, cacheStore);
  },

  async getPaymentMethods(): Promise<PaymentMethod[] | null> {
    const cached = await get<CachedPaymentMethods | undefined>(PAYMENT_METHODS_KEY, cacheStore);
    return cached?.paymentMethods ?? null;
  },
};
