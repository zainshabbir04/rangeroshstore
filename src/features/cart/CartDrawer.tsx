import React from 'react';
import { Link } from 'react-router-dom';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, MessageCircle } from 'lucide-react';
import { useCart } from './CartContext';
import { formatPKR } from '@/utils/format';
import { calculateLineTotal } from '@/utils/cart';

export const CartDrawer: React.FC = () => {
  const {
    items,
    itemCount,
    subtotal,
    isCartDrawerOpen,
    closeCartDrawer,
    updateQuantity,
    removeItem,
  } = useCart();

  if (!isCartDrawerOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#1E1E24]/50 backdrop-blur-xs transition-opacity"
        onClick={closeCartDrawer}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-[#FAF7F2] shadow-2xl border-l border-[#E5DDD0] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5DDD0] bg-white">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="h-5 w-5 text-[#9E4769]" aria-hidden="true" />
              <h2 id="cart-drawer-title" className="font-serif text-xl font-medium text-[#1E1E24]">
                Shopping Bag ({itemCount})
              </h2>
            </div>
            <button
              type="button"
              onClick={closeCartDrawer}
              className="p-2 text-[#5A5A66] hover:text-[#1E1E24] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9E4769]"
              aria-label="Close shopping bag"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-[#E5DDD0]">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <ShoppingBag className="h-12 w-12 text-[#C8BFAF] mb-4 stroke-[1.25]" />
                <p className="font-serif text-2xl text-[#1E1E24] mb-2">Your shopping bag is empty</p>
                <p className="text-sm text-[#6E6A63] max-w-xs mb-6">
                  Explore our stitched collections and select your preferred size and color.
                </p>
                <Link
                  to="/shop"
                  onClick={closeCartDrawer}
                  className="inline-flex items-center gap-2 bg-[#1E1E24] text-white px-6 py-3 text-xs font-medium tracking-widest uppercase hover:bg-[#9E4769] transition-colors"
                >
                  Explore Collection
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              items.map((item) => {
                const lineTotal = calculateLineTotal(item);
                return (
                  <div key={item.cartItemId} className="py-4 flex gap-4">
                    <Link
                      to={`/product/${item.slug}`}
                      onClick={closeCartDrawer}
                      className="h-24 w-18 shrink-0 overflow-hidden bg-[#F0EAE1] border border-[#E5DDD0]"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.imageAlt}
                        className="h-full w-full object-cover"
                      />
                    </Link>

                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <Link
                            to={`/product/${item.slug}`}
                            onClick={closeCartDrawer}
                            className="font-serif text-base font-medium text-[#1E1E24] hover:text-[#9E4769] leading-snug"
                          >
                            {item.name.replace(/\s*\[Sample\]/i, '')}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeItem(item.cartItemId)}
                            className="text-[#8C857B] hover:text-[#9E4769] p-1"
                            aria-label={`Remove ${item.name} from bag`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <p className="mt-1 text-xs text-[#6E6A63]">
                          {[
                            item.size ? `Size: ${item.size}` : null,
                            item.color ? `Color: ${item.color}` : null,
                          ]
                            .filter(Boolean)
                            .join(' • ')}
                        </p>

                        {!item.isAvailable && (
                          <p className="mt-1 text-xs font-medium text-red-700">
                            Currently unavailable — please remove before checkout
                          </p>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="inline-flex items-center border border-[#D6CEC2] bg-white">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                            className="p-1.5 text-[#1E1E24] hover:bg-[#F0EAE1]"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-3 text-xs font-medium text-[#1E1E24]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                            disabled={item.maxStock !== null && item.quantity >= item.maxStock}
                            className="p-1.5 text-[#1E1E24] hover:bg-[#F0EAE1] disabled:opacity-40"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="text-sm font-semibold text-[#1E1E24]">
                            {formatPKR(lineTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-[#E5DDD0] bg-white p-6 space-y-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-[#5A5A66]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#1E1E24] text-base">
                    {formatPKR(subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-[#7A756E]">
                  <span>Delivery Charges</span>
                  <span>Confirmed via WhatsApp</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                <Link
                  to="/cart"
                  onClick={closeCartDrawer}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#1E1E24] text-white px-5 py-3.5 text-xs font-medium tracking-widest uppercase hover:bg-[#9E4769] transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  Proceed to WhatsApp Checkout
                </Link>
                <button
                  type="button"
                  onClick={closeCartDrawer}
                  className="w-full border border-[#D6CEC2] bg-[#FAF7F2] text-[#1E1E24] px-5 py-2.5 text-xs font-medium tracking-widest uppercase hover:bg-[#F0EAE1] transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
