import type { CartItem, Product, ProductVariant } from '@/types';
import { getEffectivePrice } from './format';
import { resolveProductImageUrl } from '@/lib/supabase';

/**
 * Builds a deterministic cart item identity that distinguishes different variants
 * (size + color + variantId) of the same product.
 */
export function buildCartItemId(
  productId: string,
  variantId: string,
  size: string | null,
  color: string | null
): string {
  const normSize = (size || 'default').trim().toLowerCase();
  const normColor = (color || 'default').trim().toLowerCase();
  return `${productId}::${variantId}::${normSize}::${normColor}`;
}

/**
 * Creates a normalized CartItem from a Product and selected ProductVariant
 */
export function createCartItemFromProduct(
  product: Product,
  variant: ProductVariant,
  quantity: number
): CartItem {
  const primaryImg =
    product.images.find((img) => img.is_primary) ||
    product.images[0] || {
      storage_path: '/images/sample/product-1.svg',
      alt_text: product.name,
    };

  const unitPrice = getEffectivePrice(product.price, product.sale_price);
  const safeQuantity = Math.max(1, Math.floor(quantity));
  const maxStock =
    variant.stock_quantity !== null && variant.stock_quantity !== undefined
      ? variant.stock_quantity
      : null;

  const clampedQuantity =
    maxStock !== null && maxStock > 0 ? Math.min(safeQuantity, maxStock) : safeQuantity;

  return {
    cartItemId: buildCartItemId(product.id, variant.id, variant.size, variant.color),
    productId: product.id,
    variantId: variant.id,
    slug: product.slug,
    name: product.name,
    imageUrl: resolveProductImageUrl(primaryImg.storage_path),
    imageAlt: primaryImg.alt_text || product.name,
    size: variant.size,
    color: variant.color,
    sku: variant.sku || product.sku,
    unitPrice,
    regularPrice: product.price,
    salePrice: product.sale_price,
    quantity: clampedQuantity,
    maxStock,
    isAvailable: Boolean(product.is_active && product.is_published && variant.is_available && (maxStock === null || maxStock > 0)),
  };
}

/**
 * Adds or increments an item in the cart array immutably
 */
export function addItemToCartList(existingItems: CartItem[], newItem: CartItem): CartItem[] {
  if (!newItem.isAvailable || newItem.quantity <= 0) {
    return existingItems;
  }

  const index = existingItems.findIndex((item) => item.cartItemId === newItem.cartItemId);
  if (index === -1) {
    return [...existingItems, newItem];
  }

  return existingItems.map((item, idx) => {
    if (idx !== index) return item;
    const combinedQty = item.quantity + newItem.quantity;
    const clampedQty =
      newItem.maxStock !== null && newItem.maxStock > 0
        ? Math.min(combinedQty, newItem.maxStock)
        : combinedQty;
    return {
      ...item,
      ...newItem,
      quantity: clampedQty,
    };
  });
}

/**
 * Updates quantity of a specific cart item; removes it if quantity <= 0
 */
export function updateCartItemQuantity(
  existingItems: CartItem[],
  cartItemId: string,
  newQuantity: number
): CartItem[] {
  if (newQuantity <= 0) {
    return existingItems.filter((item) => item.cartItemId !== cartItemId);
  }

  return existingItems.map((item) => {
    if (item.cartItemId !== cartItemId) return item;
    const clampedQty =
      item.maxStock !== null && item.maxStock > 0
        ? Math.min(Math.floor(newQuantity), item.maxStock)
        : Math.floor(newQuantity);
    return {
      ...item,
      quantity: Math.max(1, clampedQty),
    };
  });
}

/**
 * Computes line total for a single CartItem
 */
export function calculateLineTotal(item: Pick<CartItem, 'unitPrice' | 'quantity'>): number {
  return Math.round(Number(item.unitPrice) * Number(item.quantity));
}

/**
 * Computes total subtotal across all CartItems
 */
export function calculateCartSubtotal(items: Pick<CartItem, 'unitPrice' | 'quantity'>[]): number {
  return items.reduce((sum, item) => sum + calculateLineTotal(item), 0);
}

/**
 * Computes total item quantity count in the cart
 */
export function calculateCartItemCount(items: Pick<CartItem, 'quantity'>[]): number {
  return items.reduce((count, item) => count + Math.max(0, Number(item.quantity)), 0);
}

/**
 * Revalidates cart items against fresh product catalog data before checkout.
 * Updates prices, stock limits, and availability flags.
 */
export function revalidateCartItemsWithCatalog(
  cartItems: CartItem[],
  catalogProducts: Product[]
): {
  updatedItems: CartItem[];
  hasChanges: boolean;
  warnings: string[];
} {
  let hasChanges = false;
  const warnings: string[] = [];

  const updatedItems = cartItems.map((item) => {
    const product = catalogProducts.find((p) => p.id === item.productId);
    if (!product || !product.is_published || !product.is_active) {
      hasChanges = true;
      warnings.push(`"${item.name}" is no longer available in the catalog.`);
      return { ...item, isAvailable: false };
    }

    const variant = product.variants.find((v) => v.id === item.variantId);
    if (!variant || !variant.is_available || (variant.stock_quantity !== null && variant.stock_quantity <= 0)) {
      hasChanges = true;
      warnings.push(
        `"${item.name}" (${[item.size, item.color].filter(Boolean).join(' / ') || 'Selected variant'}) is currently unavailable.`
      );
      return { ...item, isAvailable: false };
    }

    const latestUnitPrice = getEffectivePrice(product.price, product.sale_price);
    let nextQuantity = item.quantity;

    if (variant.stock_quantity !== null && nextQuantity > variant.stock_quantity) {
      nextQuantity = variant.stock_quantity;
      hasChanges = true;
      warnings.push(
        `Quantity for "${item.name}" was adjusted to ${nextQuantity} due to available stock.`
      );
    }

    if (latestUnitPrice !== item.unitPrice) {
      hasChanges = true;
      warnings.push(`Price for "${item.name}" was updated to reflect the current store price.`);
    }

    return {
      ...item,
      name: product.name,
      unitPrice: latestUnitPrice,
      regularPrice: product.price,
      salePrice: product.sale_price,
      quantity: nextQuantity,
      maxStock: variant.stock_quantity,
      isAvailable: true,
    };
  });

  return { updatedItems, hasChanges, warnings };
}
