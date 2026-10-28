// =============================================================================
// RANG E ROSH — CENTRALIZED DOMAIN TYPES & DATABASE MODELS
// =============================================================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product_count?: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  stock_quantity: number | null;
  is_available: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  storage_path: string;
  alt_text: string;
  display_order: number;
  is_primary: boolean;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string;
  description: string;
  category_id: string;
  price: number;
  sale_price: number | null;
  sku: string | null;
  is_featured: boolean;
  is_active: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  variants: ProductVariant[];
  images: ProductImage[];
}

export interface ProductInput {
  name: string;
  slug: string;
  short_description: string;
  description: string;
  category_id: string;
  price: number;
  sale_price: number | null;
  sku: string | null;
  is_featured: boolean;
  is_active: boolean;
  is_published: boolean;
  variants: Omit<ProductVariant, 'id' | 'product_id' | 'created_at' | 'updated_at'>[];
  images: Omit<ProductImage, 'id' | 'product_id' | 'created_at'>[];
}

export interface CategoryInput {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  is_active: boolean;
}

export interface StoreSettings {
  id: number;
  store_name: string;
  tagline: string;
  contact_email: string;
  general_contact: string;
  whatsapp_number: string;
  shipping_contact: string;
  currency_code: string;
  currency_symbol: string;
  announcement_enabled: boolean;
  announcement_text: string;
  hero_badge: string;
  hero_headline: string;
  hero_subtext: string;
  hero_cta_text: string;
  hero_cta_link: string;
  hero_image_url: string;
  editorial_title: string;
  editorial_body: string;
  meta_pixel_enabled: boolean;
  meta_pixel_id: string;
  instagram_url: string;
  facebook_url: string;
  updated_at: string;
}

export interface CartItem {
  cartItemId: string; // Deterministic composite key: productId::variantId::size::color
  productId: string;
  variantId: string;
  slug: string;
  name: string;
  imageUrl: string;
  imageAlt: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  unitPrice: number;
  regularPrice: number;
  salePrice: number | null;
  quantity: number;
  maxStock: number | null;
  isAvailable: boolean;
}

export interface CheckoutCustomerDetails {
  customerName: string;
  customerPhone: string;
  city: string;
  deliveryAddress: string;
  deliveryInstructions?: string;
}

export type OrderLifecycleStage =
  | 'idle'
  | 'message_prepared'
  | 'whatsapp_opened'
  | 'awaiting_manual_confirmation'
  | 'confirmed_by_owner'
  | 'cancelled_by_agreement';

export interface PreparedWhatsAppOrder {
  orderReference: string;
  createdAtIso: string;
  customer: CheckoutCustomerDetails;
  items: CartItem[];
  subtotal: number;
  deliveryChargesText: string;
  provisionalTotal: number;
  messageBody: string;
  whatsappUrl: string;
  stage: OrderLifecycleStage;
}

export interface DashboardStatistics {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  activeCategories: number;
  unavailableProducts: number;
  lowStockProducts: number;
  hasConfiguredStock: boolean;
  recentlyUpdatedProducts: Product[];
}

export interface UtmParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'featured';
