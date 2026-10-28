import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  Phone,
  Mail,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Truck,
  ArrowUpRight,
} from 'lucide-react';
import { useStore } from '@/app/StoreContext';
import { useCart } from '@/features/cart/CartContext';
import { CartDrawer } from '@/features/cart/CartDrawer';
import { BRAND_CONFIG } from '@/lib/config';
import { captureUtmParameters, trackPageView } from '@/features/analytics/analytics';
import { normalizeWhatsAppDigits } from '@/utils/format';

const QUICK_SEARCH_TAGS = [
  'Hazel Red',
  'Black Karandi',
  'Orchid Purple',
  'Daria Green',
  'Zaitoon',
  'Rust',
];

export const StorefrontLayout: React.FC = () => {
  const { settings, categories, activePixelId } = useStore();
  const { itemCount, openCartDrawer } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchBarOpen, setSearchBarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Scroll to top, capture UTM parameters, and fire deduplicated PageView on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setMobileMenuOpen(false);
    captureUtmParameters(location.search);
    trackPageView(location.pathname, activePixelId);
  }, [location.pathname, location.search, activePixelId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    setSearchBarOpen(false);
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleQuickTagClick = (tag: string) => {
    setSearchQuery(tag);
    setSearchBarOpen(false);
    navigate(`/search?q=${encodeURIComponent(tag)}`);
  };

  const whatsappContactDigits = normalizeWhatsAppDigits(
    settings.whatsapp_number || BRAND_CONFIG.whatsappOrderRecipient
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#1E1E24]">
      {/* Skip to content link for keyboard accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-[#1E1E24] focus:text-white focus:px-4 focus:py-2 focus:text-xs focus:uppercase"
      >
        Skip to main content
      </a>

      {/* Configurable Luxury Announcement Bar */}
      {settings.announcement_enabled && settings.announcement_text && (
        <div
          role="region"
          aria-label="Store announcement"
          className="bg-[#2B0938] text-[#FAF7F2] px-4 py-2.5 text-center text-[11px] sm:text-xs tracking-[0.16em] font-medium border-b border-[#D4AF37]/35"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[#D4AF37] shrink-0 hidden sm:inline" />
            <p>{settings.announcement_text}</p>
            <Sparkles className="h-3.5 w-3.5 text-[#D4AF37] shrink-0 hidden sm:inline" />
          </div>
        </div>
      )}

      {/* Top Editorial Utility Strip (Desktop) */}
      <div className="hidden lg:block bg-[#F3EDE2] border-b border-[#E5DDD0] text-[11px] text-[#5A5A66]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-1.5 tracking-wider uppercase font-medium text-[#3B0A45]">
              <Truck className="h-3.5 w-3.5 text-[#B8860B]" />
              Nationwide Stitched Delivery Across Pakistan
            </span>
            <span className="text-[#D6CEC2]">|</span>
            <span>
              Shipping Desk:{' '}
              <a
                href={`tel:${settings.shipping_contact}`}
                className="font-medium text-[#1E1E24] hover:text-[#9E4769] transition-colors"
              >
                {settings.shipping_contact}
              </a>
            </span>
          </div>

          <div className="flex items-center gap-5">
            <a
              href={`https://wa.me/${whatsappContactDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[#2D6A73] hover:text-[#9E4769] font-medium tracking-wider uppercase transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp Concierge: {settings.general_contact}
            </a>
            <span className="text-[#D6CEC2]">|</span>
            <span className="font-semibold tracking-widest uppercase text-[#1E1E24]">
              PKR (Rs.)
            </span>
          </div>
        </div>
      </div>

      {/* Sticky Header & Navigation Masthead */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E5DDD0] shadow-[0_2px_20px_-12px_rgba(30,30,36,0.12)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 sm:h-24 items-center justify-between gap-4">
            {/* Left: Mobile Menu Button & Search Trigger */}
            <div className="flex items-center gap-2 sm:gap-4 lg:w-1/4">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2.5 text-[#1E1E24] hover:text-[#9E4769] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9E4769]"
                aria-label="Open navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                <Menu className="h-6 w-6" />
              </button>

              <button
                type="button"
                onClick={() => setSearchBarOpen((prev) => !prev)}
                className="inline-flex items-center gap-2.5 px-3 py-2 text-[#1E1E24] hover:text-[#9E4769] border border-transparent hover:border-[#E5DDD0] hover:bg-white/70 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9E4769]"
                aria-label="Toggle product search"
                aria-expanded={searchBarOpen}
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden md:inline text-[11px] tracking-[0.22em] uppercase font-medium">
                  Search Catalog
                </span>
              </button>
            </div>

            {/* Center: Brand Crest & Editorial Wordmark */}
            <div className="flex justify-center lg:w-2/4">
              <Link
                to="/"
                className="flex items-center gap-3.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9E4769] rounded-xs px-2 py-1"
                aria-label="Rang e Rosh Home"
              >
                <div className="relative shrink-0">
                  <img
                    src={BRAND_CONFIG.logoPath}
                    alt="Rang e Rosh Logo"
                    width={56}
                    height={56}
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover border-2 border-[#B8860B]/60 shadow-xs transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="text-left">
                  <span className="block font-serif text-2xl sm:text-3xl lg:text-[34px] tracking-[0.14em] text-[#1E1E24] leading-none">
                    RANG <span className="italic text-[#9E4769] font-normal">e</span> ROSH
                  </span>
                  <span className="block text-[9px] sm:text-[10px] tracking-[0.28em] uppercase text-[#7A756E] mt-1.5">
                    Ladies Stitched Suits
                  </span>
                </div>
              </Link>
            </div>

            {/* Right: Direct WhatsApp & Shopping Bag */}
            <div className="flex items-center justify-end gap-2 sm:gap-3 lg:w-1/4">
              <a
                href={`https://wa.me/${whatsappContactDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.18em] uppercase text-[#2D6A73] hover:text-[#9E4769] border border-[#2D6A73]/25 bg-white/80 hover:bg-white px-3 py-2 transition-colors"
                aria-label="Chat with Rang e Rosh on WhatsApp"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="hidden xl:inline">WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={openCartDrawer}
                className="relative inline-flex items-center gap-2.5 bg-[#1E1E24] text-white hover:bg-[#9E4769] px-3.5 sm:px-4 py-2.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9E4769]"
                aria-label={`Open shopping bag with ${itemCount} items`}
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline text-[11px] tracking-[0.2em] uppercase font-medium">
                  Bag
                </span>
                <span
                  aria-live="polite"
                  className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D4AF37] px-1.5 text-[11px] font-bold text-[#1E1E24]"
                >
                  {itemCount}
                </span>
              </button>
            </div>
          </div>

          {/* Desktop Category Navigation Bar */}
          <nav
            aria-label="Main Navigation"
            className="hidden lg:flex items-center justify-center gap-9 py-3 border-t border-[#ECE4D8] text-[11px] font-medium tracking-[0.22em] uppercase"
          >
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `py-1 transition-all border-b-2 ${
                  isActive
                    ? 'border-[#9E4769] text-[#9E4769] font-semibold'
                    : 'border-transparent text-[#1E1E24] hover:text-[#9E4769]'
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/shop"
              className={({ isActive }) =>
                `py-1 transition-all border-b-2 ${
                  isActive
                    ? 'border-[#9E4769] text-[#9E4769] font-semibold'
                    : 'border-transparent text-[#1E1E24] hover:text-[#9E4769]'
                }`
              }
            >
              Shop All Suits
            </NavLink>
            {categories.map((category) => (
              <NavLink
                key={category.id}
                to={`/collections/${category.slug}`}
                className={({ isActive }) =>
                  `py-1 transition-all border-b-2 ${
                    isActive
                      ? 'border-[#9E4769] text-[#9E4769] font-semibold'
                      : 'border-transparent text-[#1E1E24] hover:text-[#9E4769]'
                  }`
                }
              >
                {category.name}
              </NavLink>
            ))}
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `py-1 transition-all border-b-2 ${
                  isActive
                    ? 'border-[#9E4769] text-[#9E4769] font-semibold'
                    : 'border-transparent text-[#1E1E24] hover:text-[#9E4769]'
                }`
              }
            >
              Client Concierge
            </NavLink>
          </nav>
        </div>

        {/* Expandable Editorial Search Overlay Bar */}
        {searchBarOpen && (
          <div className="border-t border-[#E5DDD0] bg-white px-4 py-6 shadow-lg animate-editorial-fade">
            <div className="max-w-3xl mx-auto space-y-4">
              <form
                onSubmit={handleSearchSubmit}
                className="flex items-center gap-2"
                role="search"
              >
                <label htmlFor="header-search-input" className="sr-only">
                  Search ladies stitched suits
                </label>
                <div className="relative flex-1">
                  <Search className="h-4 w-4 text-[#8C857B] absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    id="header-search-input"
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by suit name (Hazel, Anna, Orchid, Daria), fabric, or color..."
                    autoFocus
                    className="w-full border border-[#D6CEC2] bg-[#FAF7F2] pl-11 pr-4 py-3 text-sm text-[#1E1E24] placeholder:text-[#8C857B] focus:border-[#9E4769] focus:bg-white focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#1E1E24] text-white px-7 py-3 text-xs font-semibold tracking-[0.2em] uppercase hover:bg-[#9E4769] transition-colors"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setSearchBarOpen(false)}
                  className="p-2.5 text-[#6E6A63] hover:text-[#1E1E24]"
                  aria-label="Close search bar"
                >
                  <X className="h-5 w-5" />
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[#7A756E] uppercase tracking-wider text-[10px] font-semibold mr-1">
                  Popular Searches:
                </span>
                {QUICK_SEARCH_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleQuickTagClick(tag)}
                    className="border border-[#E5DDD0] bg-[#FAF7F2] hover:border-[#9E4769] hover:text-[#9E4769] px-2.5 py-1 text-[11px] text-[#4A4A55] transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
        >
          <div
            className="fixed inset-0 bg-[#1E1E24]/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-4/5 max-w-xs bg-[#FAF7F2] shadow-2xl border-r border-[#E5DDD0] flex flex-col justify-between p-6 overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-[#E5DDD0]">
                <div className="flex items-center gap-2.5">
                  <img
                    src={BRAND_CONFIG.logoPath}
                    alt="Rang e Rosh"
                    className="h-9 w-9 rounded-full object-cover border border-[#B8860B]"
                  />
                  <div>
                    <span className="block font-serif text-xl tracking-wider text-[#1E1E24] leading-none">
                      Rang e Rosh
                    </span>
                    <span className="block text-[9px] uppercase tracking-[0.2em] text-[#9E4769] mt-0.5">
                      Stitched Pret
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-[#5A5A66] hover:text-[#1E1E24]"
                  aria-label="Close navigation menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="mt-6 flex flex-col space-y-2.5 text-xs font-semibold tracking-[0.18em] uppercase">
                <NavLink
                  to="/"
                  end
                  className="py-2.5 border-b border-[#EFE8DD] text-[#1E1E24] hover:text-[#9E4769]"
                >
                  Home
                </NavLink>
                <NavLink
                  to="/shop"
                  className="py-2.5 border-b border-[#EFE8DD] text-[#1E1E24] hover:text-[#9E4769]"
                >
                  Shop All Suits
                </NavLink>
                <div className="pt-2 pb-1 text-[10px] tracking-[0.22em] text-[#8C857B]">
                  Curated Collections
                </div>
                {categories.map((category) => (
                  <NavLink
                    key={category.id}
                    to={`/collections/${category.slug}`}
                    className="py-2 border-b border-[#EFE8DD] text-[#4A4A55] hover:text-[#9E4769] pl-3 font-medium"
                  >
                    {category.name}
                  </NavLink>
                ))}
                <NavLink
                  to="/search"
                  className="py-2.5 border-b border-[#EFE8DD] text-[#1E1E24] hover:text-[#9E4769]"
                >
                  Search Catalog
                </NavLink>
                <NavLink
                  to="/cart"
                  className="py-2.5 border-b border-[#EFE8DD] text-[#1E1E24] hover:text-[#9E4769]"
                >
                  Shopping Bag ({itemCount})
                </NavLink>
                <NavLink
                  to="/contact"
                  className="py-2.5 border-b border-[#EFE8DD] text-[#1E1E24] hover:text-[#9E4769]"
                >
                  Contact & Styling Help
                </NavLink>
              </nav>
            </div>

            <div className="pt-6 border-t border-[#E5DDD0] space-y-2.5 text-xs text-[#6E6A63]">
              <p className="font-semibold text-[#1E1E24] uppercase tracking-wider text-[11px]">
                Direct WhatsApp Concierge
              </p>
              <p>General & Orders: {settings.general_contact}</p>
              <p>Shipping Desk: {settings.shipping_contact}</p>
              <p className="break-all">{settings.contact_email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      {/* Slide-out Shopping Cart Drawer */}
      <CartDrawer />

      {/* Luxury Editorial Footer */}
      <footer className="bg-[#18151C] text-[#FAF7F2] border-t-2 border-[#B8860B]/40 mt-20">
        {/* Top Footer Brand Banner */}
        <div className="border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center md:text-left">
              <img
                src={BRAND_CONFIG.logoPath}
                alt="Rang e Rosh Logo"
                width={56}
                height={56}
                className="h-14 w-14 rounded-full object-cover border border-[#D4AF37]"
              />
              <div>
                <p className="font-serif text-2xl sm:text-3xl tracking-[0.14em] text-white">
                  Rang e Rosh
                </p>
                <p className="text-[11px] tracking-[0.24em] uppercase text-[#D4AF37] mt-0.5">
                  Colours That Reflect Your Elegance
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href={`https://wa.me/${whatsappContactDigits}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#18151C] px-5 py-3 text-xs font-semibold tracking-[0.18em] uppercase hover:bg-white transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Order via WhatsApp
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 border border-white/25 text-white px-5 py-3 text-xs font-medium tracking-[0.18em] uppercase hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
              >
                Explore Collection
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Column 1: Brand Craftsmanship */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold tracking-[0.24em] uppercase text-[#D4AF37]">
                The House of Rang e Rosh
              </h3>
              <p className="text-sm text-[#CFC9BF] leading-relaxed">
                Curated Pakistani ladies stitched suits crafted with attention to fabric quality,
                intricate neckline & sleeve embroidery, and graceful ready-to-wear silhouettes.
              </p>
              <p className="text-xs text-[#9E988E]">
                Every order is personally verified on WhatsApp prior to dispatch across Pakistan.
              </p>
            </div>

            {/* Column 2: Collections & Shop Links */}
            <div>
              <h3 className="text-xs font-semibold tracking-[0.24em] uppercase text-[#D4AF37] mb-4">
                Stitched Collections
              </h3>
              <ul className="space-y-2.5 text-sm text-[#CFC9BF]">
                <li>
                  <Link to="/shop" className="hover:text-[#D4AF37] transition-colors">
                    Shop All Ladies Suits
                  </Link>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      to={`/collections/${cat.slug}`}
                      className="hover:text-[#D4AF37] transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link to="/search" className="hover:text-[#D4AF37] transition-colors">
                    Search Catalog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Policies & Information */}
            <div>
              <h3 className="text-xs font-semibold tracking-[0.24em] uppercase text-[#D4AF37] mb-4">
                Client Care & Policies
              </h3>
              <ul className="space-y-2.5 text-sm text-[#CFC9BF]">
                <li>
                  <Link to="/contact" className="hover:text-[#D4AF37] transition-colors">
                    Contact & WhatsApp Ordering
                  </Link>
                </li>
                <li>
                  <Link to="/shipping-policy" className="hover:text-[#D4AF37] transition-colors">
                    Shipping & Delivery Policy
                  </Link>
                </li>
                <li>
                  <Link to="/returns-policy" className="hover:text-[#D4AF37] transition-colors">
                    Returns & Exchanges Policy
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="hover:text-[#D4AF37] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-[#D4AF37] transition-colors">
                    Terms & Conditions
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Official Contact Details */}
            <div>
              <h3 className="text-xs font-semibold tracking-[0.24em] uppercase text-[#D4AF37] mb-4">
                Official Contact Desk
              </h3>
              <ul className="space-y-3.5 text-sm text-[#CFC9BF]">
                <li className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-[#D4AF37] shrink-0 mt-1" />
                  <div>
                    <span className="block text-[10px] uppercase tracking-[0.18em] text-[#9E988E]">
                      Official Email
                    </span>
                    <a
                      href={`mailto:${settings.contact_email}`}
                      className="hover:text-[#D4AF37] break-all"
                    >
                      {settings.contact_email}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-[#D4AF37] shrink-0 mt-1" />
                  <div>
                    <span className="block text-[10px] uppercase tracking-[0.18em] text-[#9E988E]">
                      General & WhatsApp Orders
                    </span>
                    <a
                      href={`tel:${settings.general_contact}`}
                      className="hover:text-[#D4AF37]"
                    >
                      {settings.general_contact}
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-[#D4AF37] shrink-0 mt-1" />
                  <div>
                    <span className="block text-[10px] uppercase tracking-[0.18em] text-[#9E988E]">
                      Shipping & Dispatch Contact
                    </span>
                    <a
                      href={`tel:${settings.shipping_contact}`}
                      className="hover:text-[#D4AF37]"
                    >
                      {settings.shipping_contact}
                    </a>
                  </div>
                </li>
              </ul>

              {/* Social media links shown ONLY when real URLs are provided in settings */}
              {(settings.instagram_url || settings.facebook_url) && (
                <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-4 text-xs uppercase tracking-widest">
                  {settings.instagram_url && (
                    <a
                      href={settings.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#D4AF37] hover:underline"
                    >
                      Instagram
                    </a>
                  )}
                  {settings.facebook_url && (
                    <a
                      href={settings.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#D4AF37] hover:underline"
                    >
                      Facebook
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9E988E]">
            <p>
              © {new Date().getFullYear()} {BRAND_CONFIG.brandName}. All rights reserved. Currency:
              PKR ({BRAND_CONFIG.currencySymbol}).
            </p>
            <div className="flex items-center gap-4">
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 text-[#9E988E] hover:text-[#D4AF37] transition-colors"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin Portal
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
