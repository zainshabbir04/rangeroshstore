import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  captureUtmParameters,
  getActivePixelId,
  isValidMetaPixelId,
  resetAnalyticsStateForTests,
  sanitizeAnalyticsPayload,
  trackPageView,
  trackWhatsAppOrderClick,
} from '@/features/analytics/analytics';

describe('Meta Pixel & UTM Attribution Safeguards (Requirement 14)', () => {
  beforeEach(() => {
    resetAnalyticsStateForTests();
    window.sessionStorage.clear();
    delete window.fbq;
  });

  it('validates numeric Meta Pixel IDs and remains inactive when disabled or blank', () => {
    expect(isValidMetaPixelId('')).toBe(false);
    expect(isValidMetaPixelId('abc12345')).toBe(false);
    expect(isValidMetaPixelId('123456789012345')).toBe(true);

    expect(getActivePixelId(false, '123456789012345')).toBeNull();
    expect(getActivePixelId(true, '')).toBeNull();
    expect(getActivePixelId(true, '123456789012345')).toBe('123456789012345');
  });

  it('captures only allowed UTM parameters and ignores sensitive query parameters', () => {
    const captured = captureUtmParameters(
      '?utm_source=instagram&utm_medium=cpc&utm_campaign=eid_pret&phone=03001234567&name=Secret'
    );

    expect(captured).toEqual({
      utm_source: 'instagram',
      utm_medium: 'cpc',
      utm_campaign: 'eid_pret',
    });
    expect((captured as Record<string, unknown>).phone).toBeUndefined();
    expect((captured as Record<string, unknown>).name).toBeUndefined();
  });

  it('strips customer PII from analytics payloads', () => {
    const dirty = {
      content_ids: ['prod-1'],
      value: 8950,
      currency: 'PKR',
      customerName: 'Ayesha',
      customerPhone: '03001234567',
      deliveryAddress: 'Street 1',
      email: 'test@example.com',
    };

    const clean = sanitizeAnalyticsPayload(dirty);
    expect(clean).toEqual({
      content_ids: ['prod-1'],
      value: 8950,
      currency: 'PKR',
    });
  });

  it('deduplicates PageView events and never fires a Purchase event for WhatsApp clicks', () => {
    const fbqSpy = vi.fn();
    window.fbq = fbqSpy;

    const pixelId = '123456789012345';
    const firstPage = trackPageView('/shop', pixelId);
    const duplicatePage = trackPageView('/shop', pixelId);

    expect(firstPage).toBe(true);
    expect(duplicatePage).toBe(false);

    // Track WhatsApp order click
    const clicked = trackWhatsAppOrderClick(
      {
        orderReference: 'RER-20261028-1111',
        productIds: ['prod-1'],
        subtotal: 8950,
        itemCount: 1,
      },
      pixelId
    );
    expect(clicked).toBe(true);

    // Ensure 'Purchase' was NEVER called
    const allCalls = fbqSpy.mock.calls;
    const hasPurchaseCall = allCalls.some(
      (call) => call[0] === 'track' && call[1] === 'Purchase'
    );
    const hasCustomWhatsAppCall = allCalls.some(
      (call) => call[0] === 'trackCustom' && call[1] === 'WhatsAppOrderClick'
    );

    expect(hasPurchaseCall).toBe(false);
    expect(hasCustomWhatsAppCall).toBe(true);
  });
});
