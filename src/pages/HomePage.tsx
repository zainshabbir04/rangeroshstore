import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  MessageCircle,
  Sparkles,
  Phone,
  Shield,
  Scissors,
  Truck,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { useStore } from '@/app/StoreContext';
import { DocumentHead } from '@/components/DocumentHead';
import { ProductCard, ProductCardSkeleton } from '@/components/ProductCard';
import { BRAND_CONFIG } from '@/lib/config';
import { formatPKR, normalizeWhatsAppDigits } from '@/utils/format';

export const HomePage: React.FC = () => {
  const { settings, categories, products, loading, error } = useStore();
  const [activeTab, setActiveTab] = useState<string>('all');

  const featuredProducts = useMemo(() => {
    const base = products.filter((p) => p.is_featured);
    return base.length > 0 ? base : products;
  }, [products]);

  const displayProducts = useMemo(() => {
    if (activeTab === 'all') {
      return featuredProducts.slice(0, 8);
    }
    return featuredProducts
      .filter((p) => p.category?.slug === activeTab)
      .slice(0, 8);
  }, [featuredProducts, activeTab]);

  const whatsappDigits = normalizeWhatsAppDigits(
    settings.whatsapp_number || BRAND_CONFIG.whatsappOrderRecipient
  );

  return (
    <>
      <DocumentHead
        title="Rang e Rosh | Pakistani Ladies Stitched Suits & Luxury Pret"
        description="Discover Rang e Rosh ladies stitched suits in Pakistan — signature embroidered pret, luxury ensembles, and everyday stitched collections."
        canonicalPath="/"
      />

      {/* 1. ASYMMETRIC EDITORIAL HERO SHOWCASE */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F2ECE1] via-[#F6F1E8] to-[#FAF7F2] border-b border-[#E5DDD0]">
        {/* Subtle decorative background frame */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-35 bg-[radial-gradient(#B8860B_0.75px,transparent_0.75px)] [background-size:28px_28px]"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-22">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Editorial Typography & CTAs */}
            <div className="lg:col-span-6 space-y-6 text-left animate-editorial-fade">
              {settings.hero_badge && (
                <div className="inline-flex items-center gap-2 bg-white/90 border border-[#B8860B]/45 px-4 py-1.5 shadow-2xs">
                  <Sparkles className="h-3.5 w-3.5 text-[#B8860B]" />
                  <span className="text-[11px] font-semibold tracking-[0.24em] uppercase text-[#3B0A45]">
                    {settings.hero_badge}
                  </span>
                </div>
              )}

              <h1 className="font-serif text-4xl sm:text-5xl xl:text-[62px] font-medium tracking-tight text-[#1E1E24] leading-[1.08]">
                {settings.hero_headline}
              </h1>

              <div className="w-20 gold-hairline" />

              <p className="text-base sm:text-lg text-[#4A4A55] leading-relaxed max-w-xl">
                {settings.hero_subtext}
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  to={settings.hero_cta_link || '/shop'}
                  className="inline-flex items-center gap-3 bg-[#1E1E24] text-white px-8 py-4 text-xs font-semibold tracking-[0.22em] uppercase hover:bg-[#9E4769] transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9E4769]"
                >
                  {settings.hero_cta_text || 'Shop Now'}
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  to="/collections/luxury-embroidered"
                  className="inline-flex items-center gap-2 border border-[#1E1E24] bg-white/80 text-[#1E1E24] px-6 py-4 text-xs font-semibold tracking-[0.2em] uppercase hover:bg-[#1E1E24] hover:text-white transition-colors"
                >
                  Luxury Formals
                </Link>
              </div>

              {/* Editorial Key Highlights */}
              <div className="pt-6 border-t border-[#E2D9C8] grid grid-cols-3 gap-4 max-w-lg">
                <div>
                  <span className="block font-serif text-2xl sm:text-3xl font-semibold text-[#1E1E24]">
                    2-Piece
                  </span>
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-[#6E6A63]">
                    Stitched Ensembles
                  </span>
                </div>
                <div className="border-l border-[#E2D9C8] pl-4">
                  <span className="block font-serif text-2xl sm:text-3xl font-semibold text-[#1E1E24]">
                    XS – XXL
                  </span>
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-[#6E6A63]">
                    Tailored Sizing
                  </span>
                </div>
                <div className="border-l border-[#E2D9C8] pl-4">
                  <span className="block font-serif text-2xl sm:text-3xl font-semibold text-[#9E4769]">
                    PKR
                  </span>
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-[#6E6A63]">
                    Direct WhatsApp Order
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Dual-Portrait Editorial Composition */}
            <div className="lg:col-span-6">
              <div className="relative mx-auto max-w-xl">
                <div className="grid grid-cols-12 gap-4 items-end">
                  {/* Main Hero Portrait */}
                  <div className="col-span-8 sm:col-span-8 relative group">
                    <div className="aspect-[3/4] w-full overflow-hidden bg-white border-2 border-[#B8860B]/45 shadow-xl">
                      <img
                        src={settings.hero_image_url || '/images/catalog/hazel/hazel-1.jpg'}
                        alt="Rang e Rosh Featured Ladies Stitched Suits Campaign"
                        fetchPriority="high"
                        width={800}
                        height={1066}
                        className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <Link
                      to="/product/hazel-cranberry-red-embroidered-2pc"
                      className="absolute bottom-3 left-3 right-3 bg-[#FAF7F2]/95 backdrop-blur-xs border border-[#E5DDD0] p-3 flex items-center justify-between text-xs hover:border-[#9E4769] transition-colors"
                    >
                      <div>
                        <span className="block text-[9px] uppercase tracking-[0.2em] text-[#9E4769] font-semibold">
                          Signature Pret
                        </span>
                        <span className="font-serif text-sm font-medium text-[#1E1E24] line-clamp-1">
                          Hazel — Cranberry Red 2-Pc
                        </span>
                      </div>
                      <span className="font-semibold text-[#1E1E24] shrink-0 ml-2">
                        {formatPKR(7490)}
                      </span>
                    </Link>
                  </div>

                  {/* Secondary Editorial Inset Portrait */}
                  <div className="col-span-4 sm:col-span-4 space-y-3">
                    <Link
                      to="/product/orchid-purple-embroidered-culottes-2pc"
                      className="group block overflow-hidden bg-white border border-[#E5DDD0] shadow-md"
                    >
                      <div className="aspect-[3/4] overflow-hidden">
                        <img
                          src="/images/catalog/orchid-purple/orchid-1.webp"
                          alt="Orchid Purple Embroidered Ensemble"
                          width={400}
                          height={533}
                          className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-2.5 bg-white">
                        <span className="block text-[9px] uppercase tracking-[0.16em] text-[#9E4769] font-semibold">
                          Luxury Formal
                        </span>
                        <span className="block font-serif text-xs font-medium text-[#1E1E24] truncate">
                          Orchid Purple
                        </span>
                        <span className="block text-[11px] font-semibold text-[#5A5A66] mt-0.5">
                          {formatPKR(11450)}
                        </span>
                      </div>
                    </Link>

                    <Link
                      to="/product/daria-emerald-green-embroidered-2pc"
                      className="group block overflow-hidden bg-white border border-[#E5DDD0] shadow-md"
                    >
                      <div className="aspect-[4/4] overflow-hidden">
                        <img
                          src="/images/catalog/daria-green/daria-1.png"
                          alt="Daria Emerald Green Embroidered Pret"
                          width={400}
                          height={400}
                          className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-2.5 bg-white">
                        <span className="block text-[9px] uppercase tracking-[0.16em] text-[#2D6A73] font-semibold">
                          Pret Essentials
                        </span>
                        <span className="block font-serif text-xs font-medium text-[#1E1E24] truncate">
                          Daria Green
                        </span>
                        <span className="block text-[11px] font-semibold text-[#5A5A66] mt-0.5">
                          {formatPKR(8450)}
                        </span>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CRAFTSMANSHIP & CLIENT PROMISE RIBBON */}
      <section className="bg-white border-b border-[#E5DDD0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-full bg-[#FAF7F2] border border-[#E5DDD0] flex items-center justify-center shrink-0">
                <Scissors className="h-4 w-4 text-[#9E4769]" />
              </div>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1E1E24]">
                  Fine Tailored Stitching
                </h2>
                <p className="text-xs text-[#6E6A63] mt-0.5">
                  Ready-to-wear silhouettes in sizes XS to XXL
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-full bg-[#FAF7F2] border border-[#E5DDD0] flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-[#B8860B]" />
              </div>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1E1E24]">
                  Intricate Embroidery
                </h2>
                <p className="text-xs text-[#6E6A63] mt-0.5">
                  Detailed botanical & geometric threadwork
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-full bg-[#FAF7F2] border border-[#E5DDD0] flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4 text-[#2D6A73]" />
              </div>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1E1E24]">
                  Personal Order Confirmation
                </h2>
                <p className="text-xs text-[#6E6A63] mt-0.5">
                  Direct verification via WhatsApp before dispatch
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-full bg-[#FAF7F2] border border-[#E5DDD0] flex items-center justify-center shrink-0">
                <Truck className="h-4 w-4 text-[#3B0A45]" />
              </div>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1E1E24]">
                  Nationwide Delivery
                </h2>
                <p className="text-xs text-[#6E6A63] mt-0.5">
                  Dedicated shipping desk: {settings.shipping_contact}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SHOP BY CATEGORY (CURATED COLLECTIONS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.26em] uppercase text-[#9E4769] mb-2">
              Curated Silks, Karandi & Embroidered Pret
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-[#1E1E24]">
              Shop by Category
            </h2>
          </div>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-[#1E1E24] hover:text-[#9E4769] border-b border-[#1E1E24] hover:border-[#9E4769] pb-1.5 self-start sm:self-auto transition-colors"
          >
            View All Collections
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {categories.length === 0 && !loading ? (
          <div className="border border-[#E5DDD0] bg-white p-8 text-center text-sm text-[#6E6A63]">
            No active categories found. Categories can be configured in the Admin Dashboard.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/collections/${category.slug}`}
                className="group relative block overflow-hidden border border-[#E5DDD0] bg-white aspect-[3/4] shadow-2xs hover:shadow-xl transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9E4769]"
              >
                <img
                  src={category.image_url || '/images/catalog/hazel/hazel-1.jpg'}
                  alt={category.name}
                  loading="lazy"
                  width={600}
                  height={800}
                  className="h-full w-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#18151C]/90 via-[#18151C]/25 to-transparent" />
                <div className="absolute inset-3 border border-white/20 pointer-events-none transition-colors duration-500 group-hover:border-[#D4AF37]/60" />

                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <span className="inline-block bg-[#D4AF37]/20 border border-[#D4AF37]/50 backdrop-blur-xs px-2.5 py-0.5 text-[10px] tracking-[0.22em] uppercase text-[#FAF7F2] font-medium">
                    {category.product_count !== undefined
                      ? `${category.product_count} ${category.product_count === 1 ? 'Ensemble' : 'Ensembles'}`
                      : 'Explore'}
                  </span>
                  <h3 className="font-serif text-2xl font-medium mt-2.5 group-hover:text-[#D4AF37] transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-xs text-[#E5DDD0]/85 line-clamp-2 mt-1 leading-relaxed">
                    {category.description}
                  </p>
                  <span className="mt-3.5 inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#D4AF37]">
                    Discover Collection
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 4. FEATURED COLLECTION / 8-SUIT SHOWCASE WITH INTERACTIVE FILTER PILLS */}
      <section className="bg-[#F4EDE2] border-y border-[#E5DDD0] py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-[#9E4769] mb-2">
                Signature Ladies Stitched Suits
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-[#1E1E24]">
                Featured Collection
              </h2>
            </div>

            {/* Interactive Category Filter Pills */}
            <div
              className="flex flex-wrap items-center gap-2"
              role="tablist"
              aria-label="Filter featured collection by category"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'all'}
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase border transition-all ${
                  activeTab === 'all'
                    ? 'border-[#1E1E24] bg-[#1E1E24] text-white'
                    : 'border-[#D6CEC2] bg-white text-[#4A4A55] hover:border-[#9E4769] hover:text-[#9E4769]'
                }`}
              >
                All ({featuredProducts.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === cat.slug}
                  onClick={() => setActiveTab(cat.slug)}
                  className={`px-4 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase border transition-all ${
                    activeTab === cat.slug
                      ? 'border-[#1E1E24] bg-[#1E1E24] text-white'
                      : 'border-[#D6CEC2] bg-white text-[#4A4A55] hover:border-[#9E4769] hover:text-[#9E4769]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-8 border border-red-300 bg-red-50 p-4 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7">
              {Array.from({ length: 8 }).map((_, idx) => (
                <ProductCardSkeleton key={idx} />
              ))}
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="bg-white border border-[#E5DDD0] p-12 text-center space-y-3">
              <p className="font-serif text-2xl text-[#1E1E24]">
                No ensembles found in this category filter
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className="inline-block bg-[#1E1E24] text-white px-6 py-2.5 text-xs font-semibold tracking-widest uppercase hover:bg-[#9E4769]"
              >
                Show All Featured Suits
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-7">
              {displayProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link
              to="/shop"
              className="inline-flex items-center gap-3 border border-[#1E1E24] bg-white text-[#1E1E24] px-9 py-4 text-xs font-semibold tracking-[0.22em] uppercase hover:bg-[#1E1E24] hover:text-white transition-colors"
            >
              Browse Complete Catalog ({products.length} Suits)
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. EDITORIAL LOOKBOOK SPOTLIGHT (ANNA BLACK KARANDI & ZAITOON GREEN) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold tracking-[0.26em] uppercase text-[#9E4769]">
            Season Editorial Lookbook
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-[#1E1E24] mt-2">
            Statement Contrasts & Botanical Threadwork
          </h2>
          <p className="text-sm sm:text-base text-[#5A5A66] mt-3">
            Explore our signature 2-piece stitched ensembles designed for effortless transition
            from daytime gatherings to evening dinners.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Spotlight Card 1: Anna Black Karandi */}
          <div className="group bg-white border border-[#E5DDD0] overflow-hidden grid grid-cols-1 sm:grid-cols-12 shadow-2xs hover:shadow-lg transition-all">
            <div className="sm:col-span-6 aspect-[3/4] overflow-hidden bg-[#F5F0E6]">
              <img
                src="/images/catalog/anna/anna-1.jpg"
                alt="Anna — Black Karandi Embroidered 2-Piece Suit"
                loading="lazy"
                width={500}
                height={666}
                className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="sm:col-span-6 p-6 sm:p-8 flex flex-col justify-between bg-white">
              <div className="space-y-3">
                <span className="inline-block text-[10px] font-semibold tracking-[0.22em] uppercase text-[#9E4769]">
                  Signature Karandi Pret
                </span>
                <h3 className="font-serif text-2xl font-medium text-[#1E1E24] leading-snug">
                  Anna — Black Karandi Embroidered 2-Piece
                </h3>
                <p className="text-xs sm:text-sm text-[#5A5A66] leading-relaxed">
                  Jet-black textured karandi canvas adorned with striking ivory floral embroidery
                  along the split V-neckline, placket, and sleeves.
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-[#F0EAE1] space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs uppercase tracking-wider text-[#7A756E]">
                    Stitched 2-Piece
                  </span>
                  <span className="font-serif text-2xl font-semibold text-[#1E1E24]">
                    {formatPKR(7490)}
                  </span>
                </div>
                <Link
                  to="/product/anna-black-karandi-embroidered-2pc"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#1E1E24] text-white px-5 py-3 text-[11px] font-semibold tracking-[0.2em] uppercase hover:bg-[#9E4769] transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Inspect 9 Photos & Sizes
                </Link>
              </div>
            </div>
          </div>

          {/* Spotlight Card 2: Zaitoon Green */}
          <div className="group bg-white border border-[#E5DDD0] overflow-hidden grid grid-cols-1 sm:grid-cols-12 shadow-2xs hover:shadow-lg transition-all">
            <div className="sm:col-span-6 aspect-[3/4] overflow-hidden bg-[#F5F0E6]">
              <img
                src="/images/catalog/nishat-green/nishat-1.jpg"
                alt="Zaitoon Green — Vibrant Embroidered Shirt & Pants (2-Piece)"
                loading="lazy"
                width={500}
                height={666}
                className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <div className="sm:col-span-6 p-6 sm:p-8 flex flex-col justify-between bg-white">
              <div className="space-y-3">
                <span className="inline-block text-[10px] font-semibold tracking-[0.22em] uppercase text-[#2D6A73]">
                  Festive Botanical Pret
                </span>
                <h3 className="font-serif text-2xl font-medium text-[#1E1E24] leading-snug">
                  Zaitoon Green — Embroidered Shirt & Pants
                </h3>
                <p className="text-xs sm:text-sm text-[#5A5A66] leading-relaxed">
                  Luminous chartreuse-olive stitched ensemble featuring delicate crimson and blush
                  floral threadwork across the kameez and tailored trousers.
                </p>
              </div>

              <div className="pt-6 mt-6 border-t border-[#F0EAE1] space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs uppercase tracking-wider text-[#7A756E]">
                    Stitched 2-Piece
                  </span>
                  <span className="font-serif text-2xl font-semibold text-[#1E1E24]">
                    {formatPKR(8999)}
                  </span>
                </div>
                <Link
                  to="/product/zaitoon-green-embroidered-2pc"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#1E1E24] text-white px-5 py-3 text-[11px] font-semibold tracking-[0.2em] uppercase hover:bg-[#9E4769] transition-colors"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Inspect 6 Photos & Sizes
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. BRAND INTRODUCTION & 8 PILLARS OF RANG E ROSH */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 lg:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center bg-white border border-[#E5DDD0] p-8 sm:p-12 lg:p-16 shadow-2xs">
          <div className="lg:col-span-5 flex flex-col items-center text-center border-b lg:border-b-0 lg:border-r border-[#E5DDD0] pb-8 lg:pb-0 lg:pr-10">
            <img
              src="/images/brand/logo-live.jpg"
              alt="Rang e Rosh — Colours That Reflect Your Elegance"
              width={420}
              height={420}
              loading="lazy"
              className="w-full max-w-xs rounded-xs object-cover border border-[#B8860B]/50 shadow-sm mb-5"
            />
            <span className="text-xs tracking-[0.25em] uppercase text-[#9E4769] font-semibold">
              Colours That Reflect Your Elegance
            </span>
            <h2 className="font-serif text-3xl text-[#1E1E24] mt-1.5">
              {settings.editorial_title || 'The House of Rang e Rosh'}
            </h2>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <p className="font-serif text-2xl sm:text-3xl text-[#1E1E24] leading-snug italic">
              “Colours That Reflect Your Elegance — celebrating graceful eastern silhouettes with
              fine stitching, luxurious fabrics, and personal customer care.”
            </p>
            <p className="text-sm sm:text-base text-[#5A5A66] leading-relaxed">
              {settings.editorial_body}
            </p>

            {/* 8 Pillars from Logo Live.jpeg */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#F0EAE1]">
              {[
                'Premium Quality',
                'Elegant Designs',
                'Soft & Comfortable',
                'Beautiful Prints',
                'Fine Stitching',
                'Luxurious Fabric',
                'Timeless Style',
                'Made For You',
              ].map((pillar) => (
                <div
                  key={pillar}
                  className="bg-[#FAF7F2] border border-[#E5DDD0] px-3 py-2.5 text-center"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#3B0A45]">
                    {pillar}
                  </span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#F0EAE1]">
              <div className="flex items-start gap-3">
                <MessageCircle className="h-5 w-5 text-[#9E4769] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1E1E24]">
                    Personal WhatsApp Ordering
                  </h3>
                  <p className="text-xs text-[#6E6A63] mt-1">
                    Every order is reviewed and confirmed directly with you on WhatsApp for peace of
                    mind.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-[#B8860B] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1E1E24]">
                    Tailored Stitched Suits
                  </h3>
                  <p className="text-xs text-[#6E6A63] mt-1">
                    Select your exact size and color variant before adding any ensemble to your
                    shopping bag.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PERSONAL SHOPPING ASSISTANCE SECTION */}
      <section className="bg-[#2B0938] text-[#FAF7F2] py-16 border-t border-[#B8860B]/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
          <span className="text-xs tracking-[0.26em] uppercase text-[#D4AF37] font-semibold">
            Client Concierge
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-white">
            Need Size Guidance or Delivery Assistance?
          </h2>
          <p className="text-sm sm:text-base text-[#E5DDD0] max-w-2xl mx-auto">
            Our team is available on WhatsApp and phone to assist you with fabric details, size
            measurements, and shipping inquiries across Pakistan.
          </p>
          <div className="pt-3 flex flex-wrap justify-center gap-4">
            <a
              href={`https://wa.me/${whatsappDigits}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#18151C] px-7 py-3.5 text-xs font-semibold tracking-widest uppercase hover:bg-white transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Message on WhatsApp ({settings.general_contact})
            </a>
            <a
              href={`tel:${settings.shipping_contact}`}
              className="inline-flex items-center gap-2 border border-[#D4AF37]/60 text-white px-7 py-3.5 text-xs font-medium tracking-widest uppercase hover:bg-white/10 transition-colors"
            >
              <Phone className="h-4 w-4" />
              Shipping Desk ({settings.shipping_contact})
            </a>
          </div>
        </div>
      </section>
    </>
  );
};
