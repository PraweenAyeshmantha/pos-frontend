import { useEffect, useState } from 'react';
import { configurationService } from '../services/configurationService';
import type { SystemCurrency } from '../types/configuration';

const STORAGE_KEY = 'posSystemCurrency';
const DEFAULT_CURRENCY: SystemCurrency = 'USD';

let cachedCurrency: SystemCurrency | null = null;
let pendingRequest: Promise<SystemCurrency> | null = null;

const normalizeCurrency = (value?: string | null): SystemCurrency => {
  if (value === 'LKR') {
    return 'LKR';
  }
  return DEFAULT_CURRENCY;
};

const readStoredCurrency = (): SystemCurrency => {
  if (cachedCurrency) {
    return cachedCurrency;
  }
  if (typeof window === 'undefined') {
    return DEFAULT_CURRENCY;
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  const resolved = normalizeCurrency(stored);
  cachedCurrency = resolved;
  return resolved;
};

export const persistSystemCurrency = (currency: SystemCurrency) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, currency);
  }
  cachedCurrency = currency;
};

const fetchSystemCurrency = async (): Promise<SystemCurrency> => {
  if (cachedCurrency) {
    return cachedCurrency;
  }
  if (pendingRequest) {
    return pendingRequest;
  }

  pendingRequest = configurationService
    .getConfigurationByKey('system_currency', 'GENERAL')
    .then((config) => normalizeCurrency(config?.configValue))
    .catch(() => readStoredCurrency())
    .then((currency) => {
      persistSystemCurrency(currency);
      return currency;
    })
    .finally(() => {
      pendingRequest = null;
    });

  return pendingRequest;
};

export const useSystemCurrency = () => {
  const [currencyCode, setCurrencyCode] = useState<SystemCurrency>(() => readStoredCurrency());

  useEffect(() => {
    let mounted = true;
    void fetchSystemCurrency().then((currency) => {
      if (mounted) {
        setCurrencyCode(currency);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return {
    currencyCode,
  };
};

export const getSystemCurrency = (): SystemCurrency => readStoredCurrency();
