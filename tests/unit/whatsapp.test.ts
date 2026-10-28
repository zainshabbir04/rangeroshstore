import { describe, it, expect } from 'vitest';
import {
  buildWhatsAppOrder,
  generateOrderReference,
  validateCheckoutForm,
} from '@/utils/whatsapp';
import { createCartItemFromProduct } from '@/utils/cart';
import { INITIAL_SAMPLE_PRODUCTS } from '@/services/sampleCatalog';

describe('WhatsApp Checkout Validation & Message Encoding Tests', () => {
  const product = INITIAL_SAMPLE_PRODUCTS[0]; // Hazel — Cranberry Red (7490 PKR)
  const variant = product.variants[1]; // Small / Cranberry Red
  const validItem = createCartItemFromProduct(product, variant, 2); // 2 * 7490 = 14980

  it('rejects incomplete or invalid customer checkout fields', () => {
    const result = validateCheckoutForm(
      {
        customerName: 'A',
        customerPhone: '123',
        city: '',
        deliveryAddress: 'Short',
      },
      [validItem]
    );

    expect(result.isValid).toBe(false);
    expect(result.errors.customerName).toBeDefined();
    expect(result.errors.customerPhone).toBeDefined();
    expect(result.errors.city).toBeDefined();
    expect(result.errors.deliveryAddress).toBeDefined();
  });

  it('passes validation with complete Pakistani customer delivery details and available items', () => {
    const result = validateCheckoutForm(
      {
        customerName: 'Ayesha Khan',
        customerPhone: '+923130888048',
        city: 'Lahore',
        deliveryAddress: 'House 14, Street 5, Block H, Gulberg III, Lahore',
        deliveryInstructions: 'Call before arrival',
      },
      [validItem]
    );

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('generates a readable, URL-encoded WhatsApp message with brand name, order ref, variants, PKR subtotal, and "To be confirmed" delivery charges', () => {
    const ref = generateOrderReference(new Date('2026-10-28T06:00:00Z'));
    expect(ref).toMatch(/^RER-20261028-\d{4}$/);

    const order = buildWhatsAppOrder(
      {
        customerName: 'Zainab Ahmed',
        customerPhone: '03001234567',
        city: 'Karachi',
        deliveryAddress: 'Apartment 4B, Clifton Block 5, Karachi',
        deliveryInstructions: 'Leave at reception if busy',
      },
      [validItem],
      '+923130888048',
      'RER-20261028-9999'
    );

    expect(order.orderReference).toBe('RER-20261028-9999');
    expect(order.subtotal).toBe(14980);
    expect(order.deliveryChargesText).toBe('To be confirmed');
    expect(order.stage).toBe('message_prepared');

    // Verify required contents in message body
    expect(order.messageBody).toContain('Rang e Rosh');
    expect(order.messageBody).toContain('RER-20261028-9999');
    expect(order.messageBody).toContain('Zainab Ahmed');
    expect(order.messageBody).toContain('03001234567');
    expect(order.messageBody).toContain('Karachi');
    expect(order.messageBody).toContain('Apartment 4B, Clifton Block 5, Karachi');
    expect(order.messageBody).toContain('Leave at reception if busy');
    expect(order.messageBody).toContain('Hazel — Cranberry Red Embroidered 2-Piece Suit');
    expect(order.messageBody).toContain('Size: Small');
    expect(order.messageBody).toContain('Color: Cranberry Red');
    expect(order.messageBody).toContain('Rs. 14,980');
    expect(order.messageBody).toContain('To be confirmed');

    // Verify URL encoding and recipient number
    expect(order.whatsappUrl).toMatch(/^https:\/\/wa\.me\/923130888048\?text=/);
    expect(decodeURIComponent(order.whatsappUrl.split('?text=')[1])).toBe(order.messageBody);
  });
});
