export const formatPrice = (value: string | number): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '';
  return numValue.toFixed(2);
};

export const formatPriceDisplay = (value: number | undefined): string => {
  if (value === undefined || value === null) return '$0.00';
  return `$${value.toFixed(2)}`;
};

export const parsePrice = (value: string): number => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};
