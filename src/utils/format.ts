/**
 * Formats a number to include commas as thousand separators
 * @param number The number to format
 * @returns The formatted number as a string
 */
export const formatPrice = (number: number): string => {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};
