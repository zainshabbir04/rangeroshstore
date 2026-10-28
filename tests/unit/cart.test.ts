import { describe, it, expect } from 'vitest';
import {
  addItemToCartList,
  buildCartItemId,
  calculateCartItemCount,
  calculateCartSubtotal,
  calculateLineTotal,
  createCartItemFromProduct,
  revalidateCartItemsWithCatalog,
  updateCartItemQuantity,
} from '@/utils/cart';
import { INITIAL_SAMPLE_PRODUCTS } from '@/services/sampleCatalog';

describe('Cart Logic & Variant Identity Tests', () => {
  const sampleProduct = INITIAL_SAMPLE_PRODUCTS[0]; // Hazel — Cranberry Red (7490 PKR)
  const xsRedVariant = sampleProduct.variants[0]; // XS / Cranberry Red (stock: 4)
  const smallRedVariant = sampleProduct.variants[1]; // Small / Cranberry Red (stock: 6)

  it('distinguishes different size/color variants of the same product with unique cartItemIds', () => {
    const idXs = buildCartItemId(
      sampleProduct.id,
      xsRedVariant.id,
      xsRedVariant.size,
      xsRedVariant.color
    );
    const idSmall = buildCartItemId(
      sampleProduct.id,
      smallRedVariant.id,
      smallRedVariant.size,
      smallRedVariant.color
    );
    expect(idXs).not.toBe(idSmall);
  });

  it('adds items and increments quantity for identical variant while respecting maxStock', () => {
    const item1 = createCartItemFromProduct(sampleProduct, xsRedVariant, 2);
    let cart = addItemToCartList([], item1);
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(2);

    // Add 1 more of the same variant -> should increment to 3
    const itemAddOne = createCartItemFromProduct(sampleProduct, xsRedVariant, 1);
    cart = addItemToCartList(cart, itemAddOne);
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(3);

    // Add 5 more -> should clamp at xsRedVariant.stock_quantity (4)
    const itemMore = createCartItemFromProduct(sampleProduct, xsRedVariant, 4);
    cart = addItemToCartList(cart, itemMore);
    expect(cart[0].quantity).toBe(4);
  });

  it('calculates line totals, subtotal, and total item count accurately in PKR', () => {
    const item1 = createCartItemFromProduct(sampleProduct, xsRedVariant, 2); // 2 * 7490 = 14980
    const saleProduct = INITIAL_SAMPLE_PRODUCTS[7]; // Gul-e-Lala [Sample] (sale_price: 10900, regular: 12500)
    const item2 = createCartItemFromProduct(saleProduct, saleProduct.variants[0], 1); // 1 * 10900 = 10900

    const cart = [item1, item2];
    expect(calculateLineTotal(item1)).toBe(14980);
    expect(calculateLineTotal(item2)).toBe(10900);
    expect(calculateCartSubtotal(cart)).toBe(25880);
    expect(calculateCartItemCount(cart)).toBe(3);
  });

  it('updates item quantities and removes item when quantity <= 0', () => {
    const item1 = createCartItemFromProduct(sampleProduct, xsRedVariant, 2);
    let cart = [item1];

    cart = updateCartItemQuantity(cart, item1.cartItemId, 3);
    expect(cart[0].quantity).toBe(3);

    cart = updateCartItemQuantity(cart, item1.cartItemId, 0);
    expect(cart).toHaveLength(0);
  });

  it('revalidates cart items against fresh catalog prices and availability', () => {
    const item1 = createCartItemFromProduct(sampleProduct, xsRedVariant, 2);
    const modifiedCatalog = INITIAL_SAMPLE_PRODUCTS.map((p) =>
      p.id === sampleProduct.id ? { ...p, sale_price: 6990 } : p
    );

    const { updatedItems, hasChanges, warnings } = revalidateCartItemsWithCatalog(
      [item1],
      modifiedCatalog
    );

    expect(hasChanges).toBe(true);
    expect(updatedItems[0].unitPrice).toBe(6990);
    expect(warnings.length).toBeGreaterThan(0);
  });
});
