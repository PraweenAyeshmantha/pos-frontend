import { createStore, del, entries, get, set } from 'idb-keyval';
import type { CreateOrderRequest } from './posService';

const queueStore = createStore('pos-offline-orders', 'order-queue');

export interface OfflineOrderQueueItem {
  id: string;
  payload: CreateOrderRequest;
  createdAt: string;
  retries: number;
  lastError?: string;
}

const sortByCreatedDate = (a: OfflineOrderQueueItem, b: OfflineOrderQueueItem) =>
  new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

export const offlineQueueService = {
  async enqueue(payload: CreateOrderRequest): Promise<OfflineOrderQueueItem> {
    const generated =
      typeof window !== 'undefined' && window.crypto?.randomUUID
        ? window.crypto.randomUUID()
        : `offline-${Date.now()}`;
    const id = payload.offlineReference ?? generated;
    const entry: OfflineOrderQueueItem = {
      id,
      payload: { ...payload, offlineReference: id },
      createdAt: payload.offlineCapturedAt ?? new Date().toISOString(),
      retries: 0,
    };
    await set(id, entry, queueStore);
    return entry;
  },

  async getAll(): Promise<OfflineOrderQueueItem[]> {
    const data = await entries<string, OfflineOrderQueueItem>(queueStore);
    return data.map(([, value]) => value).sort(sortByCreatedDate);
  },

  async get(id: string): Promise<OfflineOrderQueueItem | undefined> {
    return get<OfflineOrderQueueItem>(id, queueStore);
  },

  async remove(id: string): Promise<void> {
    await del(id, queueStore);
  },

  async markFailure(id: string, error: string): Promise<OfflineOrderQueueItem | undefined> {
    const existing = await get<OfflineOrderQueueItem>(id, queueStore);
    if (!existing) {
      return undefined;
    }
    const updated: OfflineOrderQueueItem = {
      ...existing,
      retries: existing.retries + 1,
      lastError: error,
    };
    await set(id, updated, queueStore);
    return updated;
  },

  async clear(): Promise<void> {
    const data = await entries<string, OfflineOrderQueueItem>(queueStore);
    await Promise.all(data.map(([key]) => del(key, queueStore)));
  },
};
