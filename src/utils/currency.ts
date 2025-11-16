import { getSystemCurrency } from '../hooks/useSystemCurrency';
import type { SystemCurrency } from '../types/configuration';

const CURRENCY_LOCALE_MAP: Record<SystemCurrency, string> = {
  USD: 'en-US',
  LKR: 'en-LK',
};

const CURRENCY_SYMBOL_MAP: Record<SystemCurrency, string> = {
  USD: '$',
  LKR: 'Rs',
};

const formatterCache: Partial<Record<SystemCurrency, Intl.NumberFormat>> = {};

const resolveFormatter = () => {
  const currency = getSystemCurrency();
  if (!formatterCache[currency]) {
    const locale = CURRENCY_LOCALE_MAP[currency] ?? 'en-US';
    formatterCache[currency] = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return {
    formatter: formatterCache[currency] as Intl.NumberFormat,
    currency,
  };
};

const coerceToNumber = (value?: number | string | null): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export const formatCurrency = (value?: number | string | null): string => {
  const { formatter } = resolveFormatter();
  return formatter.format(coerceToNumber(value));
};

export const getCurrencySymbol = (): string => {
  const currency = getSystemCurrency();
  return CURRENCY_SYMBOL_MAP[currency] ?? currency;
};

export const getCurrencyCode = (): SystemCurrency => getSystemCurrency();
