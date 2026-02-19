export const formatPhoneNumber = (phone: string): string => {
  if (!phone) return '';
  const numericOnly = phone.replace(/\D/g, '');
  if (numericOnly.length <= 3) return numericOnly;
  if (numericOnly.length <= 6) return `(${numericOnly.slice(0, 3)}) ${numericOnly.slice(3)}`;
  return `(${numericOnly.slice(0, 3)}) ${numericOnly.slice(3, 6)}-${numericOnly.slice(6, 10)}`;
};
