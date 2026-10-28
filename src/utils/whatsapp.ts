import type {
  CartItem,
  CheckoutCustomerDetails,
  PreparedWhatsAppOrder,
} from '@/types';
import { BRAND_CONFIG } from '@/lib/config';
import { formatPKR, isValidPhone, normalizeWhatsAppDigits } from './format';
import { calculateCartSubtotal, calculateLineTotal } from './cart';

export interface CheckoutValidationErrors {
  customerName?: string;
  customerPhone?: string;
  city?: string;
  deliveryAddress?: string;
  items?: string;
}

/**
 * Validates checkout form details and cart items before preparing a WhatsApp order message
 */
export function validateCheckoutForm(
  customer: CheckoutCustomerDetails,
  items: CartItem[]
): { isValid: boolean; errors: CheckoutValidationErrors } {
  const errors: CheckoutValidationErrors = {};

  if (!customer.customerName || customer.customerName.trim().length < 2) {
    errors.customerName = 'Please enter your full name (at least 2 characters).';
  }

  if (!customer.customerPhone || !isValidPhone(customer.customerPhone)) {
    errors.customerPhone = 'Please enter a valid mobile or WhatsApp phone number (e.g. 03001234567).';
  }

  if (!customer.city || customer.city.trim().length < 2) {
    errors.city = 'Please select or enter your city.';
  }

  if (!customer.deliveryAddress || customer.deliveryAddress.trim().length < 10) {
    errors.deliveryAddress = 'Please enter your complete street/house delivery address (at least 10 characters).';
  }

  if (!items || items.length === 0) {
    errors.items = 'Your shopping bag is empty.';
  } else if (items.some((i) => !i.isAvailable || i.quantity <= 0)) {
    errors.items = 'Please remove unavailable items from your shopping bag before placing an order.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Generates a unique, human-readable Order Reference for message identification (e.g., RER-20261028-4829)
 */
export function generateOrderReference(date: Date = new Date()): string {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `RER-${yyyy}${mm}${dd}-${randomSuffix}`;
}

/**
 * Builds the complete, formatted WhatsApp order message and URL-encoded wa.me link
 * Adheres strictly to Requirement 9:
 * - Includes Rang e Rosh brand name
 * - Order reference generated for message identification
 * - Customer name, phone, city, delivery address, optional instructions
 * - Product names, selected sizes, selected colors, quantities, item prices
 * - Subtotal
 * - Delivery charges marked "To be confirmed"
 * - Provisional total
 */
export function buildWhatsAppOrder(
  customer: CheckoutCustomerDetails,
  items: CartItem[],
  whatsappRecipientNumber: string = BRAND_CONFIG.whatsappOrderRecipient,
  customOrderRef?: string
): PreparedWhatsAppOrder {
  const orderReference = customOrderRef || generateOrderReference();
  const subtotal = calculateCartSubtotal(items);
  const deliveryChargesText = 'To be confirmed';
  const provisionalTotal = subtotal;

  const lines: string[] = [
    `*${BRAND_CONFIG.brandName} — Order Request*`,
    `Order Reference: *${orderReference}*`,
    `--------------------------------`,
    `*Customer & Delivery Details*`,
    `Name: ${customer.customerName.trim()}`,
    `Phone: ${customer.customerPhone.trim()}`,
    `City: ${customer.city.trim()}`,
    `Address: ${customer.deliveryAddress.trim()}`,
  ];

  if (customer.deliveryInstructions && customer.deliveryInstructions.trim().length > 0) {
    lines.push(`Delivery Instructions: ${customer.deliveryInstructions.trim()}`);
  }

  lines.push(`--------------------------------`);
  lines.push(`*Selected Items*`);

  items.forEach((item, index) => {
    const lineTotal = calculateLineTotal(item);
    const sizeText = item.size ? `Size: ${item.size}` : 'Size: Standard';
    const colorText = item.color ? `Color: ${item.color}` : 'Color: As Shown';
    const skuText = item.sku ? ` (SKU: ${item.sku})` : '';

    lines.push(
      `${index + 1}. *${item.name}*${skuText}`,
      `   • ${sizeText} | ${colorText}`,
      `   • Qty: ${item.quantity} × ${formatPKR(item.unitPrice)} = *${formatPKR(lineTotal)}*`
    );
  });

  lines.push(
    `--------------------------------`,
    `Subtotal: *${formatPKR(subtotal)}*`,
    `Delivery Charges: *${deliveryChargesText}*`,
    `Provisional Total: *${formatPKR(provisionalTotal)}* (excl. delivery)`,
    `--------------------------------`,
    `Please confirm product availability, applicable delivery charges, and my order details. Thank you!`
  );

  const messageBody = lines.join('\n');
  const recipientDigits = normalizeWhatsAppDigits(whatsappRecipientNumber || BRAND_CONFIG.whatsappOrderRecipient);
  const encodedText = encodeURIComponent(messageBody);
  const whatsappUrl = `https://wa.me/${recipientDigits}?text=${encodedText}`;

  return {
    orderReference,
    createdAtIso: new Date().toISOString(),
    customer: {
      customerName: customer.customerName.trim(),
      customerPhone: customer.customerPhone.trim(),
      city: customer.city.trim(),
      deliveryAddress: customer.deliveryAddress.trim(),
      deliveryInstructions: customer.deliveryInstructions?.trim() || undefined,
    },
    items,
    subtotal,
    deliveryChargesText,
    provisionalTotal,
    messageBody,
    whatsappUrl,
    stage: 'message_prepared',
  };
}
