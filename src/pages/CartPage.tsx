import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  MessageCircle,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Clock,
} from 'lucide-react';
import { useCart } from '@/features/cart/CartContext';
import { useStore } from '@/app/StoreContext';
import { DocumentHead } from '@/components/DocumentHead';
import { formatPKR } from '@/utils/format';
import { calculateLineTotal } from '@/utils/cart';
import {
  buildWhatsAppOrder,
  validateCheckoutForm,
  type CheckoutValidationErrors,
} from '@/utils/whatsapp';
import type { CheckoutCustomerDetails, PreparedWhatsAppOrder } from '@/types';
import { PAKISTAN_MAJOR_CITIES } from '@/lib/config';
import {
  trackInitiateCheckout,
  trackWhatsAppOrderClick,
} from '@/features/analytics/analytics';

export const CartPage: React.FC = () => {
  const {
    items,
    itemCount,
    subtotal,
    revalidationWarnings,
    updateQuantity,
    removeItem,
    revalidateCart,
    dismissWarnings,
  } = useCart();
  const { settings, activePixelId } = useStore();

  const [customer, setCustomer] = useState<CheckoutCustomerDetails>({
    customerName: '',
    customerPhone: '',
    city: '',
    deliveryAddress: '',
    deliveryInstructions: '',
  });
  const [errors, setErrors] = useState<CheckoutValidationErrors>({});
  const [preparedOrder, setPreparedOrder] = useState<PreparedWhatsAppOrder | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);

  const hasUnavailableItems = items.some((i) => !i.isAvailable);

  const handleCheckoutFieldChange = (
    field: keyof CheckoutCustomerDetails,
    value: string
  ) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof CheckoutValidationErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handlePlaceOrderOnWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Revalidate current product prices and availability against fresh catalog
    revalidateCart();

    // 2. Validate form fields and items
    const validation = validateCheckoutForm(customer, items);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});

    // 3. Fire InitiateCheckout analytics (no PII)
    trackInitiateCheckout(
      {
        productIds: items.map((i) => i.productId),
        subtotal,
        itemCount,
      },
      activePixelId
    );

    // 4. Generate readable, URL-encoded WhatsApp order message
    const order = buildWhatsAppOrder(customer, items, settings.whatsapp_number);

    // 5. Track custom WhatsApp click event (NEVER fires a Purchase event, NEVER sends PII)
    trackWhatsAppOrderClick(
      {
        orderReference: order.orderReference,
        productIds: items.map((i) => i.productId),
        subtotal: order.subtotal,
        itemCount,
      },
      activePixelId
    );

    // 6. Open WhatsApp in new tab / app and transition state to awaiting_manual_confirmation
    window.open(order.whatsappUrl, '_blank', 'noopener,noreferrer');

    setPreparedOrder({
      ...order,
      stage: 'awaiting_manual_confirmation',
    });
  };

  const handleCopyMessageBody = async () => {
    if (!preparedOrder) return;
    try {
      await navigator.clipboard.writeText(preparedOrder.messageBody);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2500);
    } catch {
      // Ignore clipboard permission errors
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <DocumentHead
        title="Shopping Bag & WhatsApp Checkout"
        description="Review your selected Rang e Rosh stitched suits and place your order directly via WhatsApp."
        canonicalPath="/cart"
        noIndex
      />

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DDD0] pb-6">
        <div>
          <p className="text-xs font-medium tracking-[0.22em] uppercase text-[#9E4769] mb-1">
            Rang e Rosh Bag
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#1E1E24]">
            Shopping Bag & WhatsApp Checkout
          </h1>
        </div>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-xs font-medium tracking-widest uppercase text-[#1E1E24] hover:text-[#9E4769]"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue Shopping
        </Link>
      </div>

      {/* Revalidation Warnings */}
      {revalidationWarnings.length > 0 && (
        <div
          role="alert"
          className="mb-8 border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 flex items-start justify-between gap-4"
        >
          <div className="space-y-1">
            <p className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
              Catalog Availability Update
            </p>
            <ul className="list-disc pl-5 space-y-0.5">
              {revalidationWarnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={dismissWarnings}
            className="text-xs underline font-medium shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Post-Redirect WhatsApp Handoff Status Panel (Requirement 9) */}
      {preparedOrder && (
        <section
          aria-live="polite"
          className="mb-10 border-2 border-[#B8860B] bg-white p-6 sm:p-8 shadow-sm space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DDD0] pb-4">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-[#B8860B] shrink-0" />
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[#9E4769]">
                  Order Reference: {preparedOrder.orderReference}
                </span>
                <h2 className="font-serif text-2xl font-medium text-[#1E1E24]">
                  WhatsApp Opened — Awaiting Manual Confirmation
                </h2>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 bg-[#FAF7F2] border border-[#B8860B]/50 px-3 py-1 text-xs font-medium text-[#3B0A45]">
              Status: Awaiting Manual Confirmation
            </span>
          </div>

          {/* Exact required customer feedback message from Requirement 9 */}
          <div className="bg-[#FAF7F2] border-l-4 border-[#9E4769] p-4 text-sm sm:text-base text-[#1E1E24] font-medium leading-relaxed">
            “Your order message is ready in WhatsApp. Please send it to Rang e Rosh. Our team will
            contact you to confirm product availability, delivery charges, and your order.”
          </div>

          {/* Clear 5-stage Order Status Stepper (Requirement 9) */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2 text-xs">
            <div className="p-3 border border-emerald-300 bg-emerald-50/70 text-emerald-900">
              <div className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                1. Message Prepared
              </div>
              <p className="mt-1 text-[11px] text-emerald-800">
                Order details encoded with ref {preparedOrder.orderReference}.
              </p>
            </div>

            <div className="p-3 border border-emerald-300 bg-emerald-50/70 text-emerald-900">
              <div className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                2. WhatsApp Opened
              </div>
              <p className="mt-1 text-[11px] text-emerald-800">
                Press “Send” inside WhatsApp to transmit your message.
              </p>
            </div>

            <div className="p-3 border-2 border-[#B8860B] bg-[#FAF7F2] text-[#1E1E24]">
              <div className="flex items-center gap-1.5 font-semibold text-[#9E4769]">
                <Clock className="h-4 w-4" />
                3. Awaiting Confirmation
              </div>
              <p className="mt-1 text-[11px] text-[#5A5A66]">
                Our team checks stock & delivery charges after receiving your message.
              </p>
            </div>

            <div className="p-3 border border-[#E5DDD0] bg-white text-[#7A756E]">
              <div className="font-semibold">4. Confirmed by Owner</div>
              <p className="mt-1 text-[11px]">
                Confirmed only after both you and Rang e Rosh agree on WhatsApp.
              </p>
            </div>

            <div className="p-3 border border-[#E5DDD0] bg-white text-[#7A756E]">
              <div className="font-semibold">5. Or Cancelled by Agreement</div>
              <p className="mt-1 text-[11px]">
                No obligation until manually confirmed on WhatsApp.
              </p>
            </div>
          </div>

          {/* Prepared Message Preview & Fallback Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#5A5A66]">
                Prepared WhatsApp Order Message Preview
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyMessageBody}
                  className="inline-flex items-center gap-1.5 border border-[#D6CEC2] bg-[#FAF7F2] px-3 py-1.5 text-xs font-medium text-[#1E1E24] hover:bg-[#F0EAE1]"
                >
                  {copiedMessage ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-700" />
                      Copied Message
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Message Text
                    </>
                  )}
                </button>
                <a
                  href={preparedOrder.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-[#25D366] text-[#1E1E24] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider hover:opacity-90"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Re-open WhatsApp
                </a>
              </div>
            </div>
            <pre className="bg-[#FAF7F2] border border-[#E5DDD0] p-4 text-xs text-[#1E1E24] whitespace-pre-wrap font-mono overflow-x-auto">
              {preparedOrder.messageBody}
            </pre>
          </div>
        </section>
      )}

      {items.length === 0 ? (
        <div className="bg-white border border-[#E5DDD0] p-12 sm:p-16 text-center space-y-5">
          <ShoppingBag className="h-14 w-14 text-[#C8BFAF] mx-auto stroke-[1.25]" />
          <h2 className="font-serif text-3xl text-[#1E1E24]">Your Shopping Bag is Empty</h2>
          <p className="text-sm text-[#6E6A63] max-w-md mx-auto">
            Browse our ladies stitched suits and select your size and color to add items to your
            shopping bag.
          </p>
          <div className="pt-2">
            <Link
              to="/shop"
              className="inline-block bg-[#1E1E24] text-white px-8 py-4 text-xs font-medium tracking-widest uppercase hover:bg-[#9E4769] transition-colors"
            >
              Explore Stitched Suits
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Cart Items Table */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-[#E5DDD0] divide-y divide-[#E5DDD0]">
              {items.map((item) => {
                const lineTotal = calculateLineTotal(item);
                return (
                  <div
                    key={item.cartItemId}
                    className="p-4 sm:p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center"
                  >
                    <Link
                      to={`/product/${item.slug}`}
                      className="h-28 w-22 shrink-0 overflow-hidden bg-[#F0EAE1] border border-[#E5DDD0]"
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.imageAlt}
                        className="h-full w-full object-cover"
                      />
                    </Link>

                    <div className="flex-1 space-y-1.5">
                      <Link
                        to={`/product/${item.slug}`}
                        className="font-serif text-xl font-medium text-[#1E1E24] hover:text-[#9E4769]"
                      >
                        {item.name.replace(/\s*\[Sample\]/i, '')}
                      </Link>

                      <div className="flex flex-wrap gap-3 text-xs text-[#5A5A66]">
                        {item.size && (
                          <span className="bg-[#FAF7F2] border border-[#E5DDD0] px-2 py-0.5">
                            Size: <strong>{item.size}</strong>
                          </span>
                        )}
                        {item.color && (
                          <span className="bg-[#FAF7F2] border border-[#E5DDD0] px-2 py-0.5">
                            Color: <strong>{item.color}</strong>
                          </span>
                        )}
                        {item.sku && <span className="text-[#8C857B]">SKU: {item.sku}</span>}
                      </div>

                      <div className="text-xs text-[#6E6A63] pt-1">
                        Unit Price: <strong className="text-[#1E1E24]">{formatPKR(item.unitPrice)}</strong>
                        {item.salePrice !== null && item.salePrice < item.regularPrice && (
                          <span className="ml-2 line-through text-[#8C857B]">
                            {formatPKR(item.regularPrice)}
                          </span>
                        )}
                      </div>

                      {!item.isAvailable && (
                        <p className="text-xs font-semibold text-red-700 pt-1">
                          This variant is no longer available. Please remove it to proceed.
                        </p>
                      )}
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#F0EAE1]">
                      <div className="inline-flex items-center border border-[#D6CEC2] bg-[#FAF7F2]">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          className="p-2 text-[#1E1E24] hover:bg-[#E5DDD0]"
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-3.5 text-xs font-semibold text-[#1E1E24]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          disabled={item.maxStock !== null && item.quantity >= item.maxStock}
                          className="p-2 text-[#1E1E24] hover:bg-[#E5DDD0] disabled:opacity-40"
                          aria-label={`Increase quantity of ${item.name}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-base font-semibold text-[#1E1E24]">
                          {formatPKR(lineTotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.cartItemId)}
                          className="text-[#8C857B] hover:text-red-700 p-1"
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Order Summary & WhatsApp Checkout Form */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-[#E5DDD0] p-6 sm:p-8 space-y-6 sticky top-28">
              <div>
                <h2 className="font-serif text-2xl font-medium text-[#1E1E24]">
                  WhatsApp Checkout
                </h2>
                <p className="text-xs text-[#6E6A63] mt-1">
                  Enter your delivery information below to prepare your order message for Rang e
                  Rosh on WhatsApp.
                </p>
              </div>

              {/* Order Totals Box */}
              <div className="bg-[#FAF7F2] border border-[#E5DDD0] p-4 space-y-2.5 text-sm">
                <div className="flex justify-between text-[#5A5A66]">
                  <span>Items ({itemCount})</span>
                  <span className="font-medium text-[#1E1E24]">{formatPKR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs text-[#6E6A63]">
                  <span>Delivery Charges</span>
                  <span className="font-medium text-[#3B0A45]">To be confirmed on WhatsApp</span>
                </div>
                <div className="pt-2.5 border-t border-[#E5DDD0] flex justify-between items-baseline">
                  <span className="font-semibold text-[#1E1E24]">Provisional Total</span>
                  <span className="font-serif text-2xl font-semibold text-[#1E1E24]">
                    {formatPKR(subtotal)}
                  </span>
                </div>
              </div>

              {/* Delivery Form */}
              <form onSubmit={handlePlaceOrderOnWhatsApp} noValidate className="space-y-4">
                {errors.items && (
                  <div
                    role="alert"
                    className="border border-red-300 bg-red-50 p-3 text-xs text-red-800"
                  >
                    {errors.items}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="checkout-name"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
                  >
                    Full Name <span className="text-[#9E4769]">*</span>
                  </label>
                  <input
                    id="checkout-name"
                    type="text"
                    required
                    value={customer.customerName}
                    onChange={(e) => handleCheckoutFieldChange('customerName', e.target.value)}
                    placeholder="e.g., Ayesha Khan"
                    aria-invalid={Boolean(errors.customerName)}
                    aria-describedby={errors.customerName ? 'err-checkout-name' : undefined}
                    className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24] focus:border-[#9E4769] focus:outline-none"
                  />
                  {errors.customerName && (
                    <p id="err-checkout-name" className="mt-1 text-xs text-red-700" role="alert">
                      {errors.customerName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="checkout-phone"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
                  >
                    Phone / WhatsApp Number <span className="text-[#9E4769]">*</span>
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    required
                    value={customer.customerPhone}
                    onChange={(e) => handleCheckoutFieldChange('customerPhone', e.target.value)}
                    placeholder="e.g., 0300 1234567 or +923001234567"
                    aria-invalid={Boolean(errors.customerPhone)}
                    aria-describedby={errors.customerPhone ? 'err-checkout-phone' : undefined}
                    className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24] focus:border-[#9E4769] focus:outline-none"
                  />
                  {errors.customerPhone && (
                    <p id="err-checkout-phone" className="mt-1 text-xs text-red-700" role="alert">
                      {errors.customerPhone}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="checkout-city"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
                  >
                    City <span className="text-[#9E4769]">*</span>
                  </label>
                  <input
                    id="checkout-city"
                    type="text"
                    list="pakistan-cities-list"
                    required
                    value={customer.city}
                    onChange={(e) => handleCheckoutFieldChange('city', e.target.value)}
                    placeholder="Select or type your city (e.g., Lahore, Karachi, Islamabad)"
                    aria-invalid={Boolean(errors.city)}
                    aria-describedby={errors.city ? 'err-checkout-city' : undefined}
                    className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24] focus:border-[#9E4769] focus:outline-none"
                  />
                  <datalist id="pakistan-cities-list">
                    {PAKISTAN_MAJOR_CITIES.map((city) => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                  {errors.city && (
                    <p id="err-checkout-city" className="mt-1 text-xs text-red-700" role="alert">
                      {errors.city}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="checkout-address"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
                  >
                    Complete Delivery Address <span className="text-[#9E4769]">*</span>
                  </label>
                  <textarea
                    id="checkout-address"
                    rows={3}
                    required
                    value={customer.deliveryAddress}
                    onChange={(e) => handleCheckoutFieldChange('deliveryAddress', e.target.value)}
                    placeholder="House / Apartment No., Street, Block / Sector, Nearest Landmark"
                    aria-invalid={Boolean(errors.deliveryAddress)}
                    aria-describedby={errors.deliveryAddress ? 'err-checkout-address' : undefined}
                    className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24] focus:border-[#9E4769] focus:outline-none"
                  />
                  {errors.deliveryAddress && (
                    <p id="err-checkout-address" className="mt-1 text-xs text-red-700" role="alert">
                      {errors.deliveryAddress}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="checkout-instructions"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
                  >
                    Delivery Instructions <span className="text-[#8C857B] font-normal">(Optional)</span>
                  </label>
                  <input
                    id="checkout-instructions"
                    type="text"
                    value={customer.deliveryInstructions || ''}
                    onChange={(e) =>
                      handleCheckoutFieldChange('deliveryInstructions', e.target.value)
                    }
                    placeholder="Preferred delivery time or special note"
                    className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24] focus:border-[#9E4769] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={hasUnavailableItems}
                  className="w-full inline-flex items-center justify-center gap-2.5 bg-[#1E1E24] text-white px-6 py-4 text-xs font-semibold tracking-[0.2em] uppercase hover:bg-[#9E4769] transition-colors disabled:bg-[#C8BFAF] disabled:cursor-not-allowed"
                >
                  <MessageCircle className="h-4 w-4" />
                  Place Order on WhatsApp
                </button>

                <p className="text-[11px] text-[#6E6A63] leading-relaxed text-center">
                  Clicking above opens WhatsApp with your prefilled order message addressed to Rang e
                  Rosh ({settings.whatsapp_number}). Your order is confirmed once our team replies
                  and agrees on the final details with you.
                </p>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
