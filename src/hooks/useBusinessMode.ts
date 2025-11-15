import { useEffect, useState } from 'react';
import { configurationService } from '../services/configurationService';
import type { BusinessMode } from '../types/configuration';

const STORAGE_KEY = 'posBusinessMode';
const DEFAULT_MODE: BusinessMode = 'RETAIL';

let cachedMode: BusinessMode | null = null;
let pendingRequest: Promise<BusinessMode> | null = null;

const normalizeMode = (value?: string | null): BusinessMode => {
  if (value === 'RESTAURANT_CAFE') {
    return 'RESTAURANT_CAFE';
  }
  return DEFAULT_MODE;
};

const readStoredMode = (): BusinessMode => {
  if (cachedMode) {
    return cachedMode;
  }
  if (typeof window === 'undefined') {
    return DEFAULT_MODE;
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  const resolved = normalizeMode(stored);
  cachedMode = resolved;
  return resolved;
};

const persistMode = (mode: BusinessMode) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, mode);
  }
  cachedMode = mode;
};

const fetchBusinessMode = async (): Promise<BusinessMode> => {
  if (cachedMode) {
    return cachedMode;
  }
  if (pendingRequest) {
    return pendingRequest;
  }

  pendingRequest = configurationService
    .getConfigurationByKey('business_mode', 'GENERAL')
    .then((config) => normalizeMode(config?.configValue))
    .catch(() => readStoredMode())
    .then((mode) => {
      persistMode(mode);
      return mode;
    })
    .finally(() => {
      pendingRequest = null;
    });

  return pendingRequest;
};

export const useBusinessMode = () => {
  const [businessMode, setBusinessMode] = useState<BusinessMode>(() => readStoredMode());

  useEffect(() => {
    let mounted = true;
    void fetchBusinessMode().then((mode) => {
      if (mounted) {
        setBusinessMode(mode);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return {
    businessMode,
    isRestaurantMode: businessMode === 'RESTAURANT_CAFE',
  };
};

export const getBusinessMode = (): BusinessMode => readStoredMode();
