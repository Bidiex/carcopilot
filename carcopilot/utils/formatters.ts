export const formatCurrency = (value: string): string => {
  if (!value) return "";
  const cleanValue = value.replace(/\D/g, "");
  if (!cleanValue) return "";
  
  // Format with thousand separators (dots)
  const formattedNumber = cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `$ ${formattedNumber}`;
};

export const formatNumber = (value: string): string => {
  if (!value) return "";
  const cleanValue = value.replace(/\D/g, "");
  if (!cleanValue) return "";
  
  return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const unformatNumber = (value: string): string => {
  if (!value) return "";
  return value.replace(/\D/g, "");
};
