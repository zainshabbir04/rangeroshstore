import React, { useEffect, useState } from 'react';
import { Save, Upload, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { useStore } from '@/app/StoreContext';
import {
  updateStoreSettings,
  uploadProductImageFile,
} from '@/services/catalogService';
import type { StoreSettings } from '@/types';
import { isValidMetaPixelId } from '@/features/analytics/analytics';

export const AdminSettingsPage: React.FC = () => {
  const { settings, refreshStoreData } = useStore();
  const [form, setForm] = useState<StoreSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const result = await uploadProductImageFile(file, 'homepage-hero');
      setForm((prev) => ({ ...prev, hero_image_url: result.publicUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload hero image.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);

    if (form.meta_pixel_enabled && !isValidMetaPixelId(form.meta_pixel_id)) {
      setError(
        'To enable Meta Pixel tracking, please enter a valid numeric Meta Pixel ID (10–20 digits).'
      );
      return;
    }

    setSaving(true);
    try {
      await updateStoreSettings({
        store_name: form.store_name.trim(),
        tagline: form.tagline.trim(),
        contact_email: form.contact_email.trim(),
        general_contact: form.general_contact.trim(),
        whatsapp_number: form.whatsapp_number.trim(),
        shipping_contact: form.shipping_contact.trim(),
        announcement_enabled: form.announcement_enabled,
        announcement_text: form.announcement_text.trim(),
        hero_badge: form.hero_badge.trim(),
        hero_headline: form.hero_headline.trim(),
        hero_subtext: form.hero_subtext.trim(),
        hero_cta_text: form.hero_cta_text.trim(),
        hero_cta_link: form.hero_cta_link.trim(),
        hero_image_url: form.hero_image_url.trim(),
        editorial_title: form.editorial_title.trim(),
        editorial_body: form.editorial_body.trim(),
        meta_pixel_enabled: form.meta_pixel_enabled,
        meta_pixel_id: form.meta_pixel_id.trim(),
        instagram_url: form.instagram_url.trim(),
        facebook_url: form.facebook_url.trim(),
      });
      await refreshStoreData();
      setFeedback('Storefront configuration and business settings saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save store settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DDD0] pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9E4769]">
            Storefront & Business Configuration
          </p>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#1E1E24] mt-1">
            Store Settings
          </h1>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[#1E1E24] text-white px-6 py-3 text-xs font-semibold uppercase tracking-widest hover:bg-[#9E4769] transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving Settings...' : 'Save Settings'}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 border border-red-300 bg-red-50 p-4 text-xs text-red-800"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-700" />
          <span>{error}</span>
        </div>
      )}

      {feedback && (
        <div
          role="status"
          className="flex items-center gap-2 border border-emerald-300 bg-emerald-50 p-4 text-xs text-emerald-900"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-700" />
          <span>{feedback}</span>
        </div>
      )}

      {/* 1. Business Contact & WhatsApp Numbers */}
      <section className="bg-white border border-[#E5DDD0] p-6 space-y-5">
        <h2 className="font-serif text-xl font-medium text-[#1E1E24] border-b border-[#F0EAE1] pb-3">
          1. Business Identity & Official Contact Numbers
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="set-store-name"
              className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
            >
              Store Display Name
            </label>
            <input
              id="set-store-name"
              type="text"
              required
              value={form.store_name}
              onChange={(e) => setForm((prev) => ({ ...prev, store_name: e.target.value }))}
              className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24]"
            />
          </div>

          <div>
            <label
              htmlFor="set-email"
              className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
            >
              Business Email
            </label>
            <input
              id="set-email"
              type="email"
              required
              value={form.contact_email}
              onChange={(e) => setForm((prev) => ({ ...prev, contact_email: e.target.value }))}
              className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24]"
            />
          </div>

          <div>
            <label
              htmlFor="set-whatsapp"
              className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
            >
              WhatsApp Order Recipient Number
            </label>
            <input
              id="set-whatsapp"
              type="tel"
              required
              value={form.whatsapp_number}
              onChange={(e) => setForm((prev) => ({ ...prev, whatsapp_number: e.target.value }))}
              placeholder="+923130888048"
              className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24]"
            />
          </div>

          <div>
            <label
              htmlFor="set-general-contact"
              className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
            >
              General Contact Number
            </label>
            <input
              id="set-general-contact"
              type="tel"
              required
              value={form.general_contact}
              onChange={(e) => setForm((prev) => ({ ...prev, general_contact: e.target.value }))}
              placeholder="+923130888048"
              className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24]"
            />
          </div>

          <div>
            <label
              htmlFor="set-shipping-contact"
              className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
            >
              Shipping Contact Number
            </label>
            <input
              id="set-shipping-contact"
              type="tel"
              required
              value={form.shipping_contact}
              onChange={(e) => setForm((prev) => ({ ...prev, shipping_contact: e.target.value }))}
              placeholder="+923200300552"
              className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24]"
            />
          </div>
        </div>
      </section>

      {/* 2. Homepage Announcement Bar & Hero Section */}
      <section className="bg-white border border-[#E5DDD0] p-6 space-y-5">
        <h2 className="font-serif text-xl font-medium text-[#1E1E24] border-b border-[#F0EAE1] pb-3">
          2. Homepage Announcement & Hero Campaign
        </h2>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.announcement_enabled}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, announcement_enabled: e.target.checked }))
            }
            className="h-4 w-4 accent-[#9E4769]"
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#1E1E24]">
            Display Top Announcement Bar
          </span>
        </label>

        <div>
          <label
            htmlFor="set-announcement-text"
            className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
          >
            Announcement Text (Use only confirmed delivery/promotional info)
          </label>
          <input
            id="set-announcement-text"
            type="text"
            value={form.announcement_text}
            onChange={(e) => setForm((prev) => ({ ...prev, announcement_text: e.target.value }))}
            className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label
              htmlFor="set-hero-badge"
              className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
            >
              Hero Eyebrow Badge
            </label>
            <input
              id="set-hero-badge"
              type="text"
              value={form.hero_badge}
              onChange={(e) => setForm((prev) => ({ ...prev, hero_badge: e.target.value }))}
              className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24]"
            />
          </div>

          <div>
            <label
              htmlFor="set-hero-cta"
              className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
            >
              Hero CTA Button Text
            </label>
            <input
              id="set-hero-cta"
              type="text"
              value={form.hero_cta_text}
              onChange={(e) => setForm((prev) => ({ ...prev, hero_cta_text: e.target.value }))}
              className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24]"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="set-hero-headline"
              className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
            >
              Hero Main Headline
            </label>
            <input
              id="set-hero-headline"
              type="text"
              value={form.hero_headline}
              onChange={(e) => setForm((prev) => ({ ...prev, hero_headline: e.target.value }))}
              className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24]"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="set-hero-subtext"
              className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
            >
              Hero Supporting Text
            </label>
            <textarea
              id="set-hero-subtext"
              rows={2}
              value={form.hero_subtext}
              onChange={(e) => setForm((prev) => ({ ...prev, hero_subtext: e.target.value }))}
              className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24]"
            />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24]">
              Hero Campaign Image
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <img
                src={form.hero_image_url || '/images/sample/hero-editorial.svg'}
                alt="Hero preview"
                className="h-24 w-40 object-cover border border-[#E5DDD0] bg-[#F0EAE1]"
              />
              <div className="flex-1 w-full space-y-2">
                <input
                  type="text"
                  value={form.hero_image_url}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, hero_image_url: e.target.value }))
                  }
                  className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2 text-xs text-[#1E1E24]"
                />
                <label className="inline-flex items-center gap-1.5 border border-[#D6CEC2] bg-[#FAF7F2] px-3 py-1.5 text-xs font-medium text-[#1E1E24] cursor-pointer hover:border-[#9E4769]">
                  <Upload className="h-3.5 w-3.5" />
                  Upload New Hero Image
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
                    onChange={handleHeroImageUpload}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Optional Meta Pixel & Social URLs */}
      <section className="bg-white border border-[#E5DDD0] p-6 space-y-5">
        <h2 className="font-serif text-xl font-medium text-[#1E1E24] border-b border-[#F0EAE1] pb-3">
          3. Optional Meta Pixel Attribution & Social Links
        </h2>

        <div className="bg-[#FAF7F2] border border-[#E5DDD0] p-4 text-xs text-[#5A5A66] flex items-start gap-2.5">
          <Shield className="h-4 w-4 text-[#9E4769] shrink-0 mt-0.5" />
          <p>
            <strong>Privacy & Attribution Safeguard:</strong> Meta Pixel remains inactive until you
            provide a valid Pixel ID and enable tracking below. When enabled, it tracks{' '}
            <code className="font-mono">PageView</code>,{' '}
            <code className="font-mono">ViewContent</code>,{' '}
            <code className="font-mono">AddToCart</code>,{' '}
            <code className="font-mono">InitiateCheckout</code>, and{' '}
            <code className="font-mono">WhatsAppOrderClick</code> without sending customer PII or
            firing false <code className="font-mono">Purchase</code> events.
          </p>
        </div>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.meta_pixel_enabled}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, meta_pixel_enabled: e.target.checked }))
            }
            className="h-4 w-4 accent-[#9E4769]"
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#1E1E24]">
            Enable Live Meta Pixel Tracking
          </span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="set-pixel-id"
              className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
            >
              Meta Pixel ID (Optional)
            </label>
            <input
              id="set-pixel-id"
              type="text"
              value={form.meta_pixel_id}
              onChange={(e) => setForm((prev) => ({ ...prev, meta_pixel_id: e.target.value }))}
              placeholder="e.g., 123456789012345"
              className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm font-mono text-[#1E1E24]"
            />
          </div>

          <div>
            <label
              htmlFor="set-ig-url"
              className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
            >
              Official Instagram URL (Optional)
            </label>
            <input
              id="set-ig-url"
              type="url"
              value={form.instagram_url}
              onChange={(e) => setForm((prev) => ({ ...prev, instagram_url: e.target.value }))}
              placeholder="https://instagram.com/..."
              className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24]"
            />
          </div>

          <div>
            <label
              htmlFor="set-fb-url"
              className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
            >
              Official Facebook URL (Optional)
            </label>
            <input
              id="set-fb-url"
              type="url"
              value={form.facebook_url}
              onChange={(e) => setForm((prev) => ({ ...prev, facebook_url: e.target.value }))}
              placeholder="https://facebook.com/..."
              className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24]"
            />
          </div>
        </div>
      </section>
    </form>
  );
};
