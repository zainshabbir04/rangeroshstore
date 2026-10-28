import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { CartItem, Product, ProductVariant } from '@/types';
import {
  addItemToCartList,
  calculateCartItemCount,
  calculateCartSubtotal,
  createCartItemFromProduct,
  revalidateCartItemsWithCatalog,
  updateCartItemQuantity,
} from '@/utils/cart';
import { useStore } from '@/app/StoreContext';
import { trackAddToCart } from '@/features/analytics/analytics';

const CART_STORAGE_KEY = 'rer_shopping_cart_v1';

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isCartDrawerOpen: boolean;
  revalidationWarnings: string[];
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  addToCart: (product: Product, variant: ProductVariant, quantity: number) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  revalidateCart: () => string[];
  dismissWarnings: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function loadPersistedCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CartItem[];
  } catch {
    return [];
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { products, activePixelId } = useStore();
  const [items, setItems] = useState<CartItem[]>(() => loadPersistedCart());
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [revalidationWarnings, setRevalidationWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch {
        // Ignore storage quota errors
      }
    }
  }, [items]);

  // Revalidate cart items whenever catalog products refresh
  const revalidateCart = useCallback((): string[] => {
    if (products.length === 0 || items.length === 0) return [];
    const { updatedItems, hasChanges, warnings } = revalidateCartItemsWithCatalog(items, products);
    if (hasChanges) {
      setItems(updatedItems);
      setRevalidationWarnings(warnings);
    }
    return warnings;
  }, [items, products]);

  useEffect(() => {
    if (products.length > 0 && items.length > 0) {
      const { updatedItems, hasChanges, warnings } = revalidateCartItemsWithCatalog(
        items,
        products
      );
      if (hasChanges) {
        setItems(updatedItems);
        setRevalidationWarnings(warnings);
      }
    }
    // Only run when catalog product list changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products]);

  const addToCart = useCallback(
    (product: Product, variant: ProductVariant, quantity: number) => {
      const newItem = createCartItemFromProduct(product, variant, quantity);
      setItems((prev) => addItemToCartList(prev, newItem));
      setIsCartDrawerOpen(true);

      trackAddToCart(
        {
          productId: product.id,
          name: product.name,
          unitPrice: newItem.unitPrice,
          quantity: newItem.quantity,
        },
        activePixelId
      );
    },
    [activePixelId]
  );

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    setItems((prev) => updateCartItemQuantity(prev, cartItemId, quantity));
  }, []);

  const removeItem = useCallback((cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setRevalidationWarnings([]);
  }, []);

  const openCartDrawer = useCallback(() => setIsCartDrawerOpen(true), []);
  const closeCartDrawer = useCallback(() => setIsCartDrawerOpen(false), []);
  const dismissWarnings = useCallback(() => setRevalidationWarnings([]), []);

  const itemCount = calculateCartItemCount(items);
  const subtotal = calculateCartSubtotal(items);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        isCartDrawerOpen,
        revalidationWarnings,
        openCartDrawer,
        closeCartDrawer,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        revalidateCart,
        dismissWarnings,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}
