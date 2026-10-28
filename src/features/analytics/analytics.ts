// =============================================================================
// RANG E ROSH — META PIXEL & UTM ATTRIBUTION TRACKING
// =============================================================================
// Strict Privacy & Compliance Rules (Requirement 14):
// 1. Optional feature: disabled until a valid Pixel ID is configured & enabled.
// 2. Supports: PageView, ViewContent, AddToCart, InitiateCheckout, and custom
//    WhatsAppOrderClick (contact/click event).
// 3. NEVER fires a `Purchase` event in version one (a WhatsApp click is NOT a purchase).
// 4. NEVER sends customer names, phone numbers, or delivery addresses to Meta.
// 5. Deduplicates React Router page views and events.
// 6. Captures only standard UTM parameters (utm_source, utm_medium, utm_campaign,
//    utm_content, utm_term) in sessionStorage without retaining sensitive query data.
// =============================================================================

import type { UtmParameters } from '@/types';
import { BRAND_CONFIG } from '@/lib/config';

const UTM_STORAGE_KEY = 'rer_utm_attribution_v1';
const ALLOWED_UTM_KEYS: (keyof UtmParameters)[] = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
];

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

let initializedPixelId: string | null = null;
let lastTrackedPagePath: string | null = null;
let lastEventSignature: { key: string; timestamp: number } | null = null;

/**
 * Extracts and stores only allowed UTM parameters from a URL search string.
 * Strips any unexpected or potentially sensitive query parameters.
 */
export function captureUtmParameters(searchString: string): UtmParameters {
  const params = new URLSearchParams(searchString);
  const captured: UtmParameters = {};
  let foundAny = false;

  for (const key of ALLOWED_UTM_KEYS) {
    const rawValue = params.get(key);
    if (rawValue && rawValue.trim().length > 0) {
      // Sanitize length and characters to avoid storing arbitrary PII
      const cleanValue = rawValue.trim().slice(0, 120);
      captured[key] = cleanValue;
      foundAny = true;
    }
  }

  if (foundAny && typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const existing = getStoredUtmParameters();
      const merged = { ...existing, ...captured };
      window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    } catch {
      return captured;
    }
  }

  return getStoredUtmParameters();
}

/**
 * Reads stored UTM parameters for the current session
 */
export function getStoredUtmParameters(): UtmParameters {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return {};
  }
  try {
    const raw = window.sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const sanitized: UtmParameters = {};
    for (const key of ALLOWED_UTM_KEYS) {
      if (typeof parsed[key] === 'string' && parsed[key].trim().length > 0) {
        sanitized[key] = parsed[key].trim().slice(0, 120);
      }
    }
    return sanitized;
  } catch {
    return {};
  }
}

/**
 * Validates that a Pixel ID is a real numeric Meta Pixel identifier (10-20 digits)
 */
export function isValidMetaPixelId(pixelId: string | null | undefined): boolean {
  if (!pixelId) return false;
  return /^\d{10,20}$/.test(pixelId.trim());
}

/**
 * Resolves the active Meta Pixel ID from environment or store settings if enabled
 */
export function getActivePixelId(
  settingsPixelEnabled?: boolean,
  settingsPixelId?: string
): string | null {
  if (settingsPixelEnabled === false) {
    return null;
  }
  const candidate = (settingsPixelId || BRAND_CONFIG.metaPixelId || '').trim();
  if (!isValidMetaPixelId(candidate)) {
    return null;
  }
  return candidate;
}

/**
 * Injects and initializes the Meta Pixel script once when a valid Pixel ID is active
 */
export function initializeMetaPixel(pixelId: string | null): boolean {
  if (!pixelId || !isValidMetaPixelId(pixelId) || typeof window === 'undefined') {
    return false;
  }

  if (initializedPixelId === pixelId && typeof window.fbq === 'function') {
    return true;
  }

  if (!window.fbq) {
    const fbqStub: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void;
      queue?: unknown[];
      push?: unknown;
      loaded?: boolean;
      version?: string;
    } = function (...args: unknown[]) {
      if (fbqStub.callMethod) {
        fbqStub.callMethod(...args);
      } else {
        fbqStub.queue?.push(args);
      }
    };
    fbqStub.queue = [];
    fbqStub.loaded = true;
    fbqStub.version = '2.0';
    window.fbq = fbqStub;
    window._fbq = fbqStub;

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript?.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }
  }

  window.fbq('init', pixelId);
  initializedPixelId = pixelId;
  return true;
}

/**
 * Prevents duplicate rapid-fire events within a short window (e.g. React StrictMode double effects)
 */
function isDuplicateEvent(signature: string, windowMs = 1200): boolean {
  const now = Date.now();
  if (
    lastEventSignature &&
    lastEventSignature.key === signature &&
    now - lastEventSignature.timestamp < windowMs
  ) {
    return true;
  }
  lastEventSignature = { key: signature, timestamp: now };
  return false;
}

/**
 * Sanitizes event payloads to guarantee no customer PII (name, phone, address, email) is ever sent
 */
export function sanitizeAnalyticsPayload(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const forbiddenKeys = [
    'name',
    'customerName',
    'phone',
    'customerPhone',
    'address',
    'deliveryAddress',
    'email',
    'deliveryInstructions',
  ];

  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!forbiddenKeys.includes(key)) {
      clean[key] = value;
    }
  }
  return clean;
}

/**
 * Tracks a PageView event on route change without firing duplicates
 */
export function trackPageView(pathname: string, activePixelId: string | null): boolean {
  if (!activePixelId || !initializeMetaPixel(activePixelId)) {
    return false;
  }
  if (lastTrackedPagePath === pathname) {
    return false;
  }
  lastTrackedPagePath = pathname;
  window.fbq?.('track', 'PageView');
  return true;
}

/**
 * Tracks ViewContent when a customer views a published product detail page
 */
export function trackViewContent(
  product: { id: string; name: string; price: number; categoryName?: string },
  activePixelId: string | null
): boolean {
  if (!activePixelId || !initializeMetaPixel(activePixelId)) {
    return false;
  }
  const sig = `ViewContent:${product.id}`;
  if (isDuplicateEvent(sig)) return false;

  const payload = sanitizeAnalyticsPayload({
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    content_category: product.categoryName || 'Ladies Stitched Suits',
    value: Number(product.price),
    currency: BRAND_CONFIG.currencyCode,
    ...getStoredUtmParameters(),
  });

  window.fbq?.('track', 'ViewContent', payload);
  return true;
}

/**
 * Tracks AddToCart when a customer adds a suit variant to their shopping bag
 */
export function trackAddToCart(
  item: { productId: string; name: string; unitPrice: number; quantity: number },
  activePixelId: string | null
): boolean {
  if (!activePixelId || !initializeMetaPixel(activePixelId)) {
    return false;
  }
  const sig = `AddToCart:${item.productId}:${item.quantity}`;
  if (isDuplicateEvent(sig, 500)) return false;

  const payload = sanitizeAnalyticsPayload({
    content_ids: [item.productId],
    content_name: item.name,
    content_type: 'product',
    value: Number(item.unitPrice) * Number(item.quantity),
    currency: BRAND_CONFIG.currencyCode,
    num_items: item.quantity,
    ...getStoredUtmParameters(),
  });

  window.fbq?.('track', 'AddToCart', payload);
  return true;
}

/**
 * Tracks InitiateCheckout when a customer opens the checkout step
 */
export function trackInitiateCheckout(
  summary: { productIds: string[]; subtotal: number; itemCount: number },
  activePixelId: string | null
): boolean {
  if (!activePixelId || !initializeMetaPixel(activePixelId)) {
    return false;
  }
  const sig = `InitiateCheckout:${summary.subtotal}:${summary.itemCount}`;
  if (isDuplicateEvent(sig)) return false;

  const payload = sanitizeAnalyticsPayload({
    content_ids: summary.productIds,
    content_type: 'product',
    value: Number(summary.subtotal),
    currency: BRAND_CONFIG.currencyCode,
    num_items: summary.itemCount,
    ...getStoredUtmParameters(),
  });

  window.fbq?.('track', 'InitiateCheckout', payload);
  return true;
}

/**
 * Tracks a custom WhatsApp contact/order click event ONLY when the customer clicks
 * "Place Order on WhatsApp".
 * IMPORTANT: Never fires a `Purchase` event and never transmits customer PII.
 */
export function trackWhatsAppOrderClick(
  orderMeta: {
    orderReference: string;
    productIds: string[];
    subtotal: number;
    itemCount: number;
  },
  activePixelId: string | null
): boolean {
  if (!activePixelId || !initializeMetaPixel(activePixelId)) {
    return false;
  }
  const sig = `WhatsAppOrderClick:${orderMeta.orderReference}`;
  if (isDuplicateEvent(sig)) return false;

  const payload = sanitizeAnalyticsPayload({
    order_reference: orderMeta.orderReference,
    content_ids: orderMeta.productIds,
    content_type: 'product',
    value: Number(orderMeta.subtotal),
    currency: BRAND_CONFIG.currencyCode,
    num_items: orderMeta.itemCount,
    order_channel: 'whatsapp_manual_confirmation',
    ...getStoredUtmParameters(),
  });

  window.fbq?.('trackCustom', 'WhatsAppOrderClick', payload);
  return true;
}

/**
 * Resets internal deduplication state (used in unit tests)
 */
export function resetAnalyticsStateForTests(): void {
  initializedPixelId = null;
  lastTrackedPagePath = null;
  lastEventSignature = null;
}
