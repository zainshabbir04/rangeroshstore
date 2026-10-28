// =============================================================================
// RANG E ROSH — CENTRALIZED BUSINESS & ENVIRONMENT CONFIGURATION
// =============================================================================

export const BRAND_CONFIG = {
  brandName: 'Rang e Rosh',
  tagline: 'Pakistani Ladies Stitched Suits & Luxury Pret',
  businessEmail: import.meta.env.VITE_BUSINESS_EMAIL || 'rangerosh.official@gmail.com',
  generalContact: import.meta.env.VITE_GENERAL_CONTACT || '+923130888048',
  whatsappOrderRecipient: import.meta.env.VITE_WHATSAPP_NUMBER || '+923130888048',
  shippingContact: import.meta.env.VITE_SHIPPING_CONTACT || '+923200300552',
  country: 'Pakistan',
  currencyCode: 'PKR',
  currencySymbol: 'Rs.',
  siteUrl: (import.meta.env.VITE_SITE_URL || 'https://rangerosh.pk').replace(/\/$/, ''),
  metaPixelId: import.meta.env.VITE_META_PIXEL_ID || '',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  storageBucket: 'product-images',
  logoPath: '/images/logo.jpg',
} as const;

export const PAKISTAN_MAJOR_CITIES = [
  'Karachi',
  'Lahore',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Peshawar',
  'Quetta',
  'Sialkot',
  'Gujranwala',
  'Hyderabad',
  'Bahawalpur',
  'Sargodha',
  'Abbottabad',
  'Mardan',
  'Sukkur',
  'Jhelum',
  'Mirpur',
  'Muzaffarabad',
  'Other City',
] as const;

export const STANDARD_SIZES = ['XS', 'Small', 'Medium', 'Large', 'XL', 'XXL', 'Custom'] as const;

export const STANDARD_COLORS = [
  { name: 'Cranberry Red', hex: '#7A1C24' },
  { name: 'Black', hex: '#18181B' },
  { name: 'Rust', hex: '#C87D4B' },
  { name: 'Green', hex: '#3B4D2B' },
  { name: 'Orchid Purple', hex: '#3A1F47' },
  { name: 'Emerald Green', hex: '#134E3A' },
  { name: 'Warm Ivory', hex: '#FAF7F2' },
  { name: 'Soft Beige', hex: '#E5DDD0' },
  { name: 'Muted Rose', hex: '#9E4769' },
  { name: 'Deep Plum', hex: '#3B0A45' },
  { name: 'Teal Breeze', hex: '#2D6A73' },
  { name: 'Champagne Beige', hex: '#DFC9A6' },
] as const;

export function isSupabaseConfigured(): boolean {
  const url = BRAND_CONFIG.supabaseUrl.trim();
  const key = BRAND_CONFIG.supabaseAnonKey.trim();
  return (
    Boolean(url) &&
    Boolean(key) &&
    url.startsWith('http') &&
    !url.includes('your-project-ref') &&
    !key.includes('your-public-anon-key')
  );
}
