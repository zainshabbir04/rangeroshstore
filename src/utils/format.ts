import { BRAND_CONFIG } from '@/lib/config';

/**
 * Formats a numeric PKR price cleanly, e.g. Rs. 8,950
 */
export function formatPKR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return `${BRAND_CONFIG.currencySymbol} 0`;
  }
  const rounded = Math.round(Number(amount));
  return `${BRAND_CONFIG.currencySymbol} ${rounded.toLocaleString('en-PK')}`;
}

/**
 * Generates a URL-safe slug from any string (product name, category name, etc.)
 */
export function generateSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\[sample\]/gi, 'sample')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Validates whether a slug matches strict lowercase hyphenated format
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim());
}

/**
 * Normalizes a Pakistani or international phone number into digits for WhatsApp wa.me links
 */
export function normalizeWhatsAppDigits(phone: string): string {
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.startsWith('00')) {
    return digitsOnly.slice(2);
  }
  if (digitsOnly.startsWith('03') && digitsOnly.length === 11) {
    return `92${digitsOnly.slice(1)}`;
  }
  return digitsOnly;
}

/**
 * Validates customer phone number (supports Pakistani 03XX-XXXXXXX, +923XXXXXXXXX, and international formats)
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.trim();
  if (!cleaned) return false;
  const digits = cleaned.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Returns the effective selling price of a product (sale_price if valid and lower than regular price)
 */
export function getEffectivePrice(price: number, salePrice: number | null | undefined): number {
  if (
    salePrice !== null &&
    salePrice !== undefined &&
    Number(salePrice) > 0 &&
    Number(salePrice) < Number(price)
  ) {
    return Number(salePrice);
  }
  return Number(price);
}

/**
 * Calculates discount percentage when a valid sale price is configured
 */
export function getDiscountPercentage(price: number, salePrice: number | null | undefined): number | null {
  if (
    salePrice === null ||
    salePrice === undefined ||
    Number(salePrice) <= 0 ||
    Number(salePrice) >= Number(price)
  ) {
    return null;
  }
  return Math.round(((Number(price) - Number(salePrice)) / Number(price)) * 100);
}
