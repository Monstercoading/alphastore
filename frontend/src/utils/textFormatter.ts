/**
 * Utility functions for handling mixed Arabic/English text
 */

/**
 * Formats mixed text with proper RTL/LTR handling
 * @param text - The text to format
 * @param options - Formatting options
 * @returns Formatted text with proper CSS classes
 */
export const formatMixedText = (text: string, options: {
  isHeading?: boolean;
  isBrand?: boolean;
  isEnglish?: boolean;
} = {}) => {
  const { isHeading = false, isBrand = false, isEnglish = false } = options;
  
  if (isBrand) {
    return `<span class="english-brand">${text}</span>`;
  }
  
  if (isEnglish) {
    return `<span class="english-text">${text}</span>`;
  }
  
  if (isHeading) {
    return `<span class="heading-mixed">${text}</span>`;
  }
  
  return `<span class="mixed-text">${text}</span>`;
};

/**
 * Detects if text contains English characters
 * @param text - Text to check
 * @returns True if text contains English characters
 */
export const hasEnglishText = (text: string): boolean => {
  return /[a-zA-Z]/.test(text);
};

/**
 * Detects if text contains Arabic characters
 * @param text - Text to check
 * @returns True if text contains Arabic characters
 */
export const hasArabicText = (text: string): boolean => {
  return /[\u0600-\u06FF]/.test(text);
};

/**
 * Formats brand names like "Alpha Store", "Monster Name"
 * @param brandName - The brand name to format
 * @returns Formatted brand name with proper CSS
 */
export const formatBrandName = (brandName: string): string => {
  return `<span class="english-brand">${brandName}</span>`;
};

/**
 * Formats mixed content sentences
 * @param arabicText - Arabic part of the text
 * @param englishText - English part of the text
 * @returns Formatted mixed content
 */
export const formatMixedContent = (arabicText: string, englishText: string): string => {
  return `<span class="mixed-text">${arabicText}<span class="english-word">${englishText}</span></span>`;
};

/**
 * Gets appropriate CSS class for text direction
 * @param text - Text to analyze
 * @returns CSS class name
 */
export const getTextDirectionClass = (text: string): string => {
  if (hasEnglishText(text) && !hasArabicText(text)) {
    return 'english-text';
  }
  if (hasArabicText(text) && hasEnglishText(text)) {
    return 'mixed-text';
  }
  return 'rtl-text';
};

/**
 * Common brand names that should always be formatted as English
 */
export const BRAND_NAMES = [
  'Alpha Store',
  'Monster Name',
  'Google',
  'Facebook',
  'Twitter',
  'Instagram',
  'YouTube',
  'GitHub'
];

/**
 * Formats text with automatic brand name detection
 * @param text - Text to format
 * @returns Text with brand names properly formatted
 */
export const formatTextWithBrands = (text: string): string => {
  let formattedText = text;
  
  BRAND_NAMES.forEach(brand => {
    const regex = new RegExp(`\\b${brand}\\b`, 'gi');
    formattedText = formattedText.replace(regex, `<span class="english-brand">${brand}</span>`);
  });
  
  return `<span class="mixed-text">${formattedText}</span>`;
};
