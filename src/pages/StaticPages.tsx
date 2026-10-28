import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MessageCircle, MapPin, ArrowRight } from 'lucide-react';
import { useStore } from '@/app/StoreContext';
import { DocumentHead } from '@/components/DocumentHead';
import { normalizeWhatsAppDigits } from '@/utils/format';

export const ContactPage: React.FC = () => {
  const { settings } = useStore();
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('Product & Size Inquiry');
  const [message, setMessage] = useState('');

  const whatsappDigits = normalizeWhatsAppDigits(settings.whatsapp_number);

  const handleSendWhatsAppInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    const text = `*Rang e Rosh — Customer Inquiry*\nTopic: ${topic}\nFrom: ${
      name.trim() || 'Customer'
    }\n---------------------------\n${message.trim()}`;
    const url = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <DocumentHead
        title="Contact Us | Rang e Rosh"
        description="Contact Rang e Rosh for ladies stitched suit inquiries, size guidance, WhatsApp ordering, and shipping support across Pakistan."
        canonicalPath="/contact"
      />

      <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#9E4769]">
          Client Concierge
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl font-medium text-[#1E1E24]">
          Get in Touch with Rang e Rosh
        </h1>
        <p className="text-sm sm:text-base text-[#5A5A66]">
          Whether you have a question about fabric details, size measurements, or an existing
          WhatsApp order, our team is ready to assist you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Direct Contact Channels */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-[#E5DDD0] p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <MessageCircle className="h-5 w-5 text-[#2D6A73] shrink-0 mt-1" />
              <div>
                <h2 className="font-serif text-xl font-medium text-[#1E1E24]">
                  General Contact & WhatsApp Orders
                </h2>
                <p className="text-xs text-[#6E6A63] mt-1">
                  For placing orders, size guidance, and general inquiries:
                </p>
                <a
                  href={`https://wa.me/${whatsappDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-base font-semibold text-[#9E4769] hover:underline"
                >
                  {settings.general_contact}
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E5DDD0] p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <Phone className="h-5 w-5 text-[#B8860B] shrink-0 mt-1" />
              <div>
                <h2 className="font-serif text-xl font-medium text-[#1E1E24]">
                  Shipping & Dispatch Desk
                </h2>
                <p className="text-xs text-[#6E6A63] mt-1">
                  For delivery coordination and dispatch updates:
                </p>
                <a
                  href={`tel:${settings.shipping_contact}`}
                  className="mt-2 inline-block text-base font-semibold text-[#1E1E24] hover:text-[#9E4769]"
                >
                  {settings.shipping_contact}
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E5DDD0] p-6 space-y-4">
            <div className="flex items-start gap-3.5">
              <Mail className="h-5 w-5 text-[#9E4769] shrink-0 mt-1" />
              <div>
                <h2 className="font-serif text-xl font-medium text-[#1E1E24]">Official Email</h2>
                <p className="text-xs text-[#6E6A63] mt-1">
                  For written inquiries and business correspondence:
                </p>
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="mt-2 inline-block text-sm font-semibold text-[#1E1E24] hover:text-[#9E4769] break-all"
                >
                  {settings.contact_email}
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E5DDD0] p-6 space-y-2">
            <div className="flex items-start gap-3.5">
              <MapPin className="h-5 w-5 text-[#3B0A45] shrink-0 mt-1" />
              <div>
                <h2 className="font-serif text-xl font-medium text-[#1E1E24]">Location</h2>
                <p className="text-sm text-[#5A5A66] mt-1">Pakistan (Nationwide Delivery)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Direct WhatsApp Inquiry Composer */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-[#E5DDD0] p-6 sm:p-10 space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-medium text-[#1E1E24]">
                Send a Direct WhatsApp Inquiry
              </h2>
              <p className="text-xs text-[#6E6A63] mt-1">
                Compose your question below to open a prefilled chat with Rang e Rosh on WhatsApp.
              </p>
            </div>

            <form onSubmit={handleSendWhatsAppInquiry} className="space-y-4">
              <div>
                <label
                  htmlFor="contact-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
                >
                  Your Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24] focus:border-[#9E4769] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="contact-topic"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
                >
                  Inquiry Topic
                </label>
                <select
                  id="contact-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24] focus:border-[#9E4769] focus:outline-none"
                >
                  <option value="Product & Size Inquiry">Product & Size Inquiry</option>
                  <option value="Order Status / Confirmation">Order Status / Confirmation</option>
                  <option value="Shipping & Delivery Inquiry">Shipping & Delivery Inquiry</option>
                  <option value="Exchange Request">Exchange Request</option>
                  <option value="Other Inquiry">Other Inquiry</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
                >
                  Message <span className="text-[#9E4769]">*</span>
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us which suit, size, or order reference you would like assistance with..."
                  className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24] focus:border-[#9E4769] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-[#1E1E24] text-white px-8 py-4 text-xs font-semibold tracking-[0.2em] uppercase hover:bg-[#9E4769] transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Open Inquiry in WhatsApp
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ShippingPolicyPage: React.FC = () => {
  const { settings } = useStore();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <DocumentHead
        title="Shipping & Delivery Policy | Rang e Rosh"
        description="Shipping and delivery information for Rang e Rosh orders across Pakistan."
        canonicalPath="/shipping-policy"
      />
      <div className="bg-white border border-[#E5DDD0] p-8 sm:p-12 space-y-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9E4769]">
          Client Policy
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#1E1E24]">
          Shipping & Delivery Policy
        </h1>

        <div className="space-y-4 text-sm text-[#4A4A55] leading-relaxed">
          <h2 className="font-serif text-xl font-medium text-[#1E1E24] pt-2">
            1. Order Verification & Confirmation
          </h2>
          <p>
            All orders placed on the Rang e Rosh website are initiated via WhatsApp ({settings.whatsapp_number}). Once you send your prepared order message on WhatsApp, our team verifies stock availability for your selected size and color and confirms your complete delivery address.
          </p>

          <h2 className="font-serif text-xl font-medium text-[#1E1E24] pt-2">
            2. Delivery Charges
          </h2>
          <p>
            Delivery charges are calculated based on your city and order weight/package details and are communicated to you directly on WhatsApp before your order is finalized. No hidden charges are added without your confirmation.
          </p>

          <h2 className="font-serif text-xl font-medium text-[#1E1E24] pt-2">
            3. Dispatch & Shipping Inquiries
          </h2>
          <p>
            Once an order is manually confirmed by Rang e Rosh and the customer on WhatsApp, our dispatch team prepares your parcel. For any delivery or shipping questions, please contact our dedicated Shipping Desk at{' '}
            <a href={`tel:${settings.shipping_contact}`} className="font-semibold text-[#9E4769]">
              {settings.shipping_contact}
            </a>{' '}
            or email{' '}
            <a href={`mailto:${settings.contact_email}`} className="font-semibold text-[#9E4769]">
              {settings.contact_email}
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export const ReturnsPolicyPage: React.FC = () => {
  const { settings } = useStore();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <DocumentHead
        title="Returns & Exchanges Policy | Rang e Rosh"
        description="Returns and exchanges information for Rang e Rosh ladies stitched suits."
        canonicalPath="/returns-policy"
      />
      <div className="bg-white border border-[#E5DDD0] p-8 sm:p-12 space-y-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9E4769]">
          Client Policy
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#1E1E24]">
          Returns & Exchanges Policy
        </h1>

        <div className="space-y-4 text-sm text-[#4A4A55] leading-relaxed">
          <h2 className="font-serif text-xl font-medium text-[#1E1E24] pt-2">
            1. Inspection Upon Delivery
          </h2>
          <p>
            Every Rang e Rosh stitched suit undergoes quality checks prior to dispatch. If you receive a damaged, defective, or incorrect item, please contact us on WhatsApp ({settings.general_contact}) or email ({settings.contact_email}) promptly upon receiving your parcel with clear photographs of the item and order reference.
          </p>

          <h2 className="font-serif text-xl font-medium text-[#1E1E24] pt-2">
            2. Condition of Returned / Exchanged Items
          </h2>
          <p>
            To be eligible for an approved exchange, garments must be unused, unwashed, unaltered, free from perfume or stains, and returned in their original packaging with tags intact.
          </p>

          <h2 className="font-serif text-xl font-medium text-[#1E1E24] pt-2">
            3. How to Request Assistance
          </h2>
          <p>
            Reach out to our team via WhatsApp at{' '}
            <strong className="text-[#1E1E24]">{settings.general_contact}</strong> or our shipping
            contact at <strong className="text-[#1E1E24]">{settings.shipping_contact}</strong> with
            your Order Reference (`RER-...`), and our team will guide you through the resolution
            process.
          </p>
        </div>
      </div>
    </div>
  );
};

export const PrivacyPolicyPage: React.FC = () => {
  const { settings } = useStore();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <DocumentHead
        title="Privacy Policy | Rang e Rosh"
        description="Privacy policy explaining how Rang e Rosh handles customer information, browser cart storage, and optional campaign analytics."
        canonicalPath="/privacy-policy"
      />
      <div className="bg-white border border-[#E5DDD0] p-8 sm:p-12 space-y-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9E4769]">
          Privacy & Data Protection
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#1E1E24]">
          Privacy Policy
        </h1>

        <div className="space-y-4 text-sm text-[#4A4A55] leading-relaxed">
          <h2 className="font-serif text-xl font-medium text-[#1E1E24] pt-2">
            1. Information You Provide During WhatsApp Checkout
          </h2>
          <p>
            When you prepare an order on our website, your name, phone number, city, and delivery address are formatted into a WhatsApp message so you can send it directly to Rang e Rosh. Version 1 of this website does not automatically store your personal delivery details in a remote database when you click the WhatsApp button.
          </p>

          <h2 className="font-serif text-xl font-medium text-[#1E1E24] pt-2">
            2. Local Browser Storage
          </h2>
          <p>
            We use browser `localStorage` to keep your selected shopping bag items intact when you refresh the page, and `sessionStorage` to remember standard campaign attribution parameters (`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`).
          </p>

          <h2 className="font-serif text-xl font-medium text-[#1E1E24] pt-2">
            3. Optional Advertising Attribution (Meta Pixel)
          </h2>
          <p>
            When enabled by Rang e Rosh, Meta Pixel may measure general shopping actions (`PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout`, and WhatsApp button clicks). We never transmit your name, phone number, or street address to Meta through checkout form events.
          </p>

          <h2 className="font-serif text-xl font-medium text-[#1E1E24] pt-2">
            4. Contact for Privacy Questions
          </h2>
          <p>
            For any questions regarding your privacy, contact us at{' '}
            <a href={`mailto:${settings.contact_email}`} className="font-semibold text-[#9E4769]">
              {settings.contact_email}
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  const { settings } = useStore();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
      <DocumentHead
        title="Terms & Conditions | Rang e Rosh"
        description="Terms and conditions for shopping with Rang e Rosh."
        canonicalPath="/terms"
      />
      <div className="bg-white border border-[#E5DDD0] p-8 sm:p-12 space-y-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9E4769]">
          Legal Terms
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#1E1E24]">
          Terms & Conditions
        </h1>

        <div className="space-y-4 text-sm text-[#4A4A55] leading-relaxed">
          <h2 className="font-serif text-xl font-medium text-[#1E1E24] pt-2">
            1. Order Placement & Manual Confirmation
          </h2>
          <p>
            Opening a WhatsApp link from our checkout page prepares an order request message. An order is considered confirmed only when Rang e Rosh and the customer have mutually agreed on product availability, delivery charges, and final order details via WhatsApp.
          </p>

          <h2 className="font-serif text-xl font-medium text-[#1E1E24] pt-2">
            2. Pricing & Currency
          </h2>
          <p>
            All prices are listed in Pakistani Rupees (`PKR` / `Rs.`). While we strive for accuracy, Rang e Rosh reserves the right to verify current prices and variant availability prior to manual order confirmation.
          </p>

          <h2 className="font-serif text-xl font-medium text-[#1E1E24] pt-2">
            3. Product Imagery & Colors
          </h2>
          <p>
            We make every effort to display suit colors and embroidery details accurately. Slight variations may occur due to lighting during photography or individual device screen settings.
          </p>

          <h2 className="font-serif text-xl font-medium text-[#1E1E24] pt-2">
            4. Contact Information
          </h2>
          <p>
            Rang e Rosh — Email: {settings.contact_email} | General Contact:{' '}
            {settings.general_contact} | Shipping Contact: {settings.shipping_contact}.
          </p>
        </div>
      </div>
    </div>
  );
};

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-24 text-center space-y-6">
      <DocumentHead title="404 — Page Not Found | Rang e Rosh" noIndex />
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#9E4769]">
        Error 404
      </p>
      <h1 className="font-serif text-4xl sm:text-5xl font-medium text-[#1E1E24]">
        Page Not Found
      </h1>
      <p className="text-sm sm:text-base text-[#6E6A63] max-w-md mx-auto">
        The page you are looking for might have been moved, renamed, or is temporarily unavailable.
      </p>
      <div className="pt-2 flex flex-wrap justify-center gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-[#1E1E24] text-white px-8 py-4 text-xs font-semibold tracking-widest uppercase hover:bg-[#9E4769] transition-colors"
        >
          Return Home
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 border border-[#1E1E24] bg-white text-[#1E1E24] px-8 py-4 text-xs font-semibold tracking-widest uppercase hover:bg-[#F0EAE1] transition-colors"
        >
          Browse Suits
        </Link>
      </div>
    </div>
  );
};
