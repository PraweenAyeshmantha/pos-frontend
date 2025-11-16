import { formatCurrency as systemFormatCurrency } from './currency';

const numberFormatter = new Intl.NumberFormat('en-US');

export const formatCurrency = (value: number) => systemFormatCurrency(value);
export const formatNumber = (value: number) => numberFormatter.format(value);

export const getTodayRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  // End of day should be start of next day (exclusive upper bound)
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    label: start.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }),
  };
};
