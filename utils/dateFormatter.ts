export const formatDate = (input: string | Date | null | undefined): string => {
  if (!input) return '';

  if (input instanceof Date) {
    const month = String(input.getMonth() + 1).padStart(2, '0');
    const day = String(input.getDate()).padStart(2, '0');
    const year = input.getFullYear();
    return `${month}/${day}/${year}`;
  }

  let dateStr = typeof input === 'string' ? input : '';

  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const [yyyy, mm, dd] = parts;
      return `${mm}/${dd}/${yyyy}`;
    }
  }

  const digitsOnly = dateStr.replace(/\D/g, '');

  if (digitsOnly.length === 8) {
    const mm = digitsOnly.substring(0, 2);
    const dd = digitsOnly.substring(2, 4);
    const yyyy = digitsOnly.substring(4, 8);
    return `${mm}/${dd}/${yyyy}`;
  }

  return '';
};

export const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;

  const formatted = formatDate(dateStr);
  const parts = formatted.split('/');

  if (parts.length !== 3) return null;

  const [mm, dd, yyyy] = parts.map(p => parseInt(p, 10));

  if (isNaN(mm) || isNaN(dd) || isNaN(yyyy)) return null;
  if (mm < 1 || mm > 12) return null;
  if (dd < 1 || dd > 31) return null;
  if (yyyy < 1900 || yyyy > 2100) return null;

  return new Date(yyyy, mm - 1, dd);
};

export const getTodayFormatted = (): string => {
  return formatDate(new Date());
};
