import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ShoppingBag,
  Share2,
  Check,
  AlertCircle,
  MessageCircle,
  Plus,
  Minus,
  ShieldCheck,
  Truck,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  Ruler,
  Sparkles,
} from 'lucide-react';
import { useStore } from '@/app/StoreContext';
import { useCart } from '@/features/cart/CartContext';
import { fetchPublicProductBySlug } from '@/services/catalogService';
import type { Product } from '@/types';
import { DocumentHead } from '@/components/DocumentHead';
import { ProductCard } from '@/components/ProductCard';
import { formatPKR, getDiscountPercentage, getEffectivePrice } from '@/utils/format';
import { resolveProductImageUrl } from '@/lib/supabase';
import { trackViewContent } from '@/features/analytics/analytics';

function getColorSwatchHex(colorName: string): string {
  const c = colorName.toLowerCase();
  if (c.includes('cranberry') || c.includes('red') || c.includes('crimson')) return '#8B1E2F';
  if (c.includes('black') || c.includes('jet')) return '#1C1C21';
  if (c.includes('rust') || c.includes('terracotta') || c.includes('copper')) return '#A44A28';
  if (c.includes('zaitoon') || c.includes('olive') || c.includes('lime')) return '#8A9A32';
  if (c.includes('orchid') || c.includes('purple') || c.includes('plum')) return '#4A2559';
  if (c.includes('emerald') || c.includes('daria') || c.includes('green')) return '#1D5B43';
  if (c.includes('ivory') || c.includes('pearl') || c.includes('cream')) return '#F3ECE1';
  if (c.includes('rose') || c.includes('pink')) return '#B85D79';
  return '#7A756E';
}

const STITCHED_SIZE_GUIDE = [
  { size: 'XS', chest: '18.5"', waist: '17.5"', hip: '19.5"', length: '38–40"', trouser: '37"' },
  { size: 'Small', chest: '19.5"', waist: '18.5"', hip: '20.5"', length: '39–41"', trouser: '38"' },
  { size: 'Medium', chest: '20.5"', waist: '19.5"', hip: '21.5"', length: '40–42"', trouser: '38.5"' },
  { size: 'Large', chest: '22.0"', waist: '21.0"', hip: '23.0"', length: '41–43"', trouser: '39"' },
  { size: 'XL', chest: '23.5"', waist: '22.5"', hip: '24.5"', length: '41–43"', trouser: '39.5"' },
  { size: 'XXL', chest: '25.0"', waist: '24.0"', hip: '26.0"', length: '42–43"', trouser: '40"' },
];

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { products, activePixelId } = useStore();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);
  const [lightboxOpen, setLightboxOpen] = useState<boolean>(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      if (!slug) return;
      setLoading(true);
      setError(null);
      setSelectedImageIndex(0);
      setSelectedSize(null);
      setSelectedColor(null);
      setQuantity(1);
      setValidationMessage(null);
      setLightboxOpen(false);

      try {
        const fetched = await fetchPublicProductBySlug(slug);
        if (!isMounted) return;
        setProduct(fetched);

        if (fetched) {
          // Pre-select size or color only if the product has a single option
          const distinctSizes = Array.from(
            new Set(fetched.variants.map((v) => v.size).filter(Boolean))
          ) as string[];
          const distinctColors = Array.from(
            new Set(fetched.variants.map((v) => v.color).filter(Boolean))
          ) as string[];

          if (distinctSizes.length === 1) {
            setSelectedSize(distinctSizes[0]);
          }
          if (distinctColors.length === 1) {
            setSelectedColor(distinctColors[0]);
          }

          trackViewContent(
            {
              id: fetched.id,
              name: fetched.name,
              price: getEffectivePrice(fetched.price, fetched.sale_price),
              categoryName: fetched.category?.name,
            },
            activePixelId
          );
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Unable to load product details.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadProduct();
    return () => {
      isMounted = false;
    };
  }, [slug, activePixelId]);

  const distinctSizes = useMemo(() => {
    if (!product) return [] as string[];
    return Array.from(new Set(product.variants.map((v) => v.size).filter(Boolean))) as string[];
  }, [product]);

  const distinctColors = useMemo(() => {
    if (!product) return [] as string[];
    return Array.from(new Set(product.variants.map((v) => v.color).filter(Boolean))) as string[];
  }, [product]);

  const requiresSize = distinctSizes.length > 0;
  const requiresColor = distinctColors.length > 0;

  // Find matching variant for current selection
  const selectedVariant = useMemo(() => {
    if (!product) return null;
    if (requiresSize && !selectedSize) return null;
    if (requiresColor && !selectedColor) return null;

    return (
      product.variants.find(
        (v) =>
          (!requiresSize || v.size === selectedSize) &&
          (!requiresColor || v.color === selectedColor)
      ) || null
    );
  }, [product, requiresSize, requiresColor, selectedSize, selectedColor]);

  const isSelectedVariantOrderable = Boolean(
    product &&
      product.is_active &&
      product.is_published &&
      selectedVariant &&
      selectedVariant.is_available &&
      (selectedVariant.stock_quantity === null || selectedVariant.stock_quantity > 0)
  );

  const anyVariantAvailable = useMemo(() => {
    if (!product || !product.is_active || !product.is_published) return false;
    return product.variants.some(
      (v) => v.is_available && (v.stock_quantity === null || v.stock_quantity > 0)
    );
  }, [product]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const sameCategory = products.filter(
      (p) => p.id !== product.id && p.category_id === product.category_id
    );
    const others = products.filter(
      (p) => p.id !== product.id && p.category_id !== product.category_id
    );
    return [...sameCategory, ...others].slice(0, 4);
  }, [products, product]);

  const handleAddToCart = () => {
    setValidationMessage(null);
    if (!product) return;

    if (!anyVariantAvailable) {
      setValidationMessage('This suit is currently sold out and unavailable for ordering.');
      return;
    }

    if (requiresSize && !selectedSize) {
      setValidationMessage('Please select a clothing size before adding to your shopping bag.');
      return;
    }

    if (requiresColor && !selectedColor) {
      setValidationMessage('Please select a color option before adding to your shopping bag.');
      return;
    }

    if (!selectedVariant) {
      setValidationMessage(
        'The selected size and color combination is not available for this ensemble.'
      );
      return;
    }

    if (
      !selectedVariant.is_available ||
      (selectedVariant.stock_quantity !== null && selectedVariant.stock_quantity <= 0)
    ) {
      setValidationMessage('This specific variant is currently out of stock.');
      return;
    }

    if (quantity < 1) {
      setValidationMessage('Please select a valid quantity (at least 1).');
      return;
    }

    if (selectedVariant.stock_quantity !== null && quantity > selectedVariant.stock_quantity) {
      setValidationMessage(
        `Only ${selectedVariant.stock_quantity} unit(s) available for this variant.`
      );
      return;
    }

    addToCart(product, selectedVariant, quantity);
  };

  const handleShareUrl = async () => {
    const shareUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 aspect-[3/4] bg-[#EAE2D7]" />
          <div className="lg:col-span-5 space-y-6">
            <div className="h-4 w-1/4 bg-[#E5DDD0]" />
            <div className="h-10 w-3/4 bg-[#E5DDD0]" />
            <div className="h-6 w-1/3 bg-[#E5DDD0]" />
            <div className="h-24 w-full bg-[#E5DDD0]" />
            <div className="h-12 w-full bg-[#E5DDD0]" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-5">
        <DocumentHead title="Product Unavailable | Rang e Rosh" noIndex />
        <p className="text-xs uppercase tracking-[0.25em] text-[#9E4769]">Catalog Notice</p>
        <h1 className="font-serif text-4xl text-[#1E1E24]">Suit Unavailable or Not Found</h1>
        <p className="text-sm text-[#6E6A63] max-w-md mx-auto">
          {error ||
            'This ensemble may have been unpublished, archived, or the link may be incorrect.'}
        </p>
        <div className="pt-2">
          <Link
            to="/shop"
            className="inline-block bg-[#1E1E24] text-white px-8 py-3.5 text-xs font-medium tracking-widest uppercase hover:bg-[#9E4769]"
          >
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  const images =
    product.images.length > 0
      ? product.images
      : [
          {
            id: 'fallback',
            product_id: product.id,
            storage_path: '/images/sample/product-1.svg',
            alt_text: product.name,
            display_order: 0,
            is_primary: true,
          },
        ];

  const activeImage = images[selectedImageIndex] || images[0];
  const effectivePrice = getEffectivePrice(product.price, product.sale_price);
  const discountPercent = getDiscountPercentage(product.price, product.sale_price);
  const isSample = product.name.toLowerCase().includes('[sample]');

  const handlePrevImage = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-14">
      <DocumentHead
        title={product.name.replace(/\s*\[Sample\]/i, '')}
        description={product.short_description || product.description}
        canonicalPath={`/product/${product.slug}`}
        ogImage={resolveProductImageUrl(activeImage.storage_path)}
        ogType="product"
        productJsonLd={product}
      />

      {/* Breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className="text-xs text-[#7A756E] mb-8 flex flex-wrap items-center gap-2"
      >
        <Link to="/" className="hover:text-[#9E4769]">
          Home
        </Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-[#9E4769]">
          Shop
        </Link>
        {product.category && (
          <>
            <span>/</span>
            <Link to={`/collections/${product.category.slug}`} className="hover:text-[#9E4769]">
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-[#1E1E24] font-medium">
          {product.name.replace(/\s*\[Sample\]/i, '')}
        </span>
      </nav>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* Left: Editorial Image Gallery with Side Thumbnails */}
        <div className="lg:col-span-7 lg:sticky lg:top-28">
          <div className="flex flex-col-reverse sm:flex-row gap-4">
            {/* Vertical Thumbnail Strip (Desktop) / Horizontal Strip (Mobile) */}
            {images.length > 1 && (
              <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto sm:max-h-[640px] sm:w-20 shrink-0 pb-1 sm:pb-0">
                {images.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative aspect-[3/4] w-16 sm:w-full shrink-0 overflow-hidden border transition-all ${
                      selectedImageIndex === idx
                        ? 'border-[#9E4769] ring-2 ring-[#9E4769]/35 opacity-100'
                        : 'border-[#E5DDD0] opacity-65 hover:opacity-100'
                    }`}
                    aria-label={`View image ${idx + 1}: ${img.alt_text || product.name}`}
                  >
                    <img
                      src={resolveProductImageUrl(img.storage_path)}
                      alt={img.alt_text || `${product.name} view ${idx + 1}`}
                      className="h-full w-full object-cover object-top"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main High-Resolution Portrait Stage */}
            <div className="relative flex-1 aspect-[3/4] w-full overflow-hidden bg-white border border-[#E5DDD0] shadow-xs group">
              <img
                src={resolveProductImageUrl(activeImage.storage_path)}
                alt={activeImage.alt_text || product.name}
                width={900}
                height={1200}
                onClick={() => setLightboxOpen(true)}
                className="h-full w-full object-cover object-top cursor-zoom-in transition-transform duration-500"
              />

              {isSample && (
                <span className="absolute top-4 left-4 bg-[#FAF7F2]/95 border border-[#B8860B]/50 px-3 py-1 text-[11px] font-medium tracking-widest uppercase text-[#3B0A45]">
                  Sample Catalog Item
                </span>
              )}

              {/* Image Counter & Fullscreen Zoom Trigger */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                {images.length > 1 && (
                  <span className="bg-[#18151C]/75 backdrop-blur-xs text-white px-2.5 py-1 text-[11px] font-medium tracking-widest">
                    {selectedImageIndex + 1} / {images.length}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="bg-white/90 hover:bg-white text-[#1E1E24] p-2 border border-[#E5DDD0] shadow-2xs transition-colors"
                  aria-label="Open fullscreen image zoom"
                  title="Zoom Image"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>

              {/* Prev / Next Gallery Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-[#1E1E24] hover:text-white text-[#1E1E24] p-2.5 border border-[#E5DDD0] shadow-sm transition-colors"
                    aria-label="Previous product photo"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-[#1E1E24] hover:text-white text-[#1E1E24] p-2.5 border border-[#E5DDD0] shadow-sm transition-colors"
                    aria-label="Next product photo"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Product Information & Variant Selection */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-white border border-[#E5DDD0] p-6 sm:p-8 shadow-2xs">
          <div className="space-y-6">
            {/* Category & Share */}
            <div className="flex items-center justify-between gap-4">
              {product.category ? (
                <Link
                  to={`/collections/${product.category.slug}`}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.22em] uppercase text-[#9E4769] hover:underline"
                >
                  <Sparkles className="h-3 w-3 text-[#B8860B]" />
                  {product.category.name}
                </Link>
              ) : (
                <span className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[#9E4769]">
                  Rang e Rosh Stitched Suit
                </span>
              )}

              <button
                type="button"
                onClick={handleShareUrl}
                className="inline-flex items-center gap-1.5 text-xs text-[#6E6A63] hover:text-[#1E1E24] border border-[#E5DDD0] bg-[#FAF7F2] px-3 py-1.5 transition-colors"
                aria-label="Copy shareable product link"
              >
                {copiedShareLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-700" />
                    <span>Link Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5" />
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>

            {/* Product Name */}
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-[34px] font-medium text-[#1E1E24] leading-[1.18]">
              {product.name.replace(/\s*\[Sample\]/i, '')}
            </h1>

            {/* Pricing & Availability Badge */}
            <div className="flex flex-wrap items-baseline gap-4 pb-5 border-b border-[#E5DDD0]">
              <span className="font-serif text-3xl font-semibold text-[#1E1E24]">
                {formatPKR(effectivePrice)}
              </span>
              {discountPercent !== null && (
                <>
                  <span className="text-base text-[#8C857B] line-through">
                    {formatPKR(product.price)}
                  </span>
                  <span className="bg-[#9E4769] text-white px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider">
                    Save {discountPercent}%
                  </span>
                </>
              )}
              <span
                className={`ml-auto text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 border ${
                  anyVariantAvailable
                    ? 'border-[#2D6A73]/30 bg-[#2D6A73]/10 text-[#2D6A73]'
                    : 'border-red-300 bg-red-50 text-red-800'
                }`}
              >
                {anyVariantAvailable ? 'Available' : 'Out of Stock'}
              </span>
            </div>

            {/* Short Description */}
            {product.short_description && (
              <p className="text-sm text-[#4A4A55] leading-relaxed">
                {product.short_description}
              </p>
            )}

            {/* Size Selection with Interactive Size Guide */}
            {requiresSize && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs uppercase tracking-wider">
                  <span className="font-semibold text-[#1E1E24]">
                    Select Size:{' '}
                    <span className="text-[#9E4769]">{selectedSize || 'Required'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setSizeGuideOpen((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[#6E6A63] hover:text-[#9E4769] underline underline-offset-4"
                  >
                    <Ruler className="h-3.5 w-3.5" />
                    {sizeGuideOpen ? 'Hide Size Chart' : 'Size Chart'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2.5" role="group" aria-label="Select size">
                  {distinctSizes.map((size) => {
                    const isSizeAvailable = product.variants.some(
                      (v) =>
                        v.size === size &&
                        (!selectedColor || v.color === selectedColor) &&
                        v.is_available &&
                        (v.stock_quantity === null || v.stock_quantity > 0)
                    );
                    const isSelected = selectedSize === size;

                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          setSelectedSize(size);
                          setValidationMessage(null);
                        }}
                        className={`min-w-15 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border transition-all ${
                          isSelected
                            ? 'border-[#1E1E24] bg-[#1E1E24] text-white shadow-2xs'
                            : isSizeAvailable
                            ? 'border-[#D6CEC2] bg-[#FAF7F2] text-[#1E1E24] hover:border-[#9E4769] hover:bg-white'
                            : 'border-[#E5DDD0] bg-[#F5F1EA] text-[#A39C93] line-through'
                        }`}
                        aria-pressed={isSelected}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>

                {/* Collapsible Pakistani Stitched Size Guide */}
                {sizeGuideOpen && (
                  <div className="border border-[#E5DDD0] bg-[#FAF7F2] p-3.5 text-xs space-y-2 animate-editorial-fade">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold uppercase tracking-wider text-[#1E1E24] text-[11px]">
                        Standard Stitched Measurements (Inches)
                      </span>
                      <button
                        type="button"
                        onClick={() => setSizeGuideOpen(false)}
                        className="text-[#7A756E] hover:text-[#1E1E24]"
                        aria-label="Close size chart"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="border-b border-[#E5DDD0] text-[#7A756E]">
                            <th className="py-1.5 pr-2">Size</th>
                            <th className="py-1.5 px-2">Chest</th>
                            <th className="py-1.5 px-2">Waist</th>
                            <th className="py-1.5 px-2">Hip</th>
                            <th className="py-1.5 px-2">Shirt Length</th>
                            <th className="py-1.5 pl-2">Trouser</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EFE8DD] text-[#1E1E24]">
                          {STITCHED_SIZE_GUIDE.map((row) => (
                            <tr key={row.size}>
                              <td className="py-1.5 pr-2 font-semibold">{row.size}</td>
                              <td className="py-1.5 px-2">{row.chest}</td>
                              <td className="py-1.5 px-2">{row.waist}</td>
                              <td className="py-1.5 px-2">{row.hip}</td>
                              <td className="py-1.5 px-2">{row.length}</td>
                              <td className="py-1.5 pl-2">{row.trouser}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Color Selection with Visual Swatches */}
            {requiresColor && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs uppercase tracking-wider">
                  <span className="font-semibold text-[#1E1E24]">
                    Select Color:{' '}
                    <span className="text-[#9E4769]">{selectedColor || 'Required'}</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2.5" role="group" aria-label="Select color">
                  {distinctColors.map((color) => {
                    const isColorAvailable = product.variants.some(
                      (v) =>
                        v.color === color &&
                        (!selectedSize || v.size === selectedSize) &&
                        v.is_available &&
                        (v.stock_quantity === null || v.stock_quantity > 0)
                    );
                    const isSelected = selectedColor === color;

                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setSelectedColor(color);
                          setValidationMessage(null);
                        }}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium tracking-wider border transition-all ${
                          isSelected
                            ? 'border-[#1E1E24] bg-[#1E1E24] text-white shadow-2xs'
                            : isColorAvailable
                            ? 'border-[#D6CEC2] bg-[#FAF7F2] text-[#1E1E24] hover:border-[#9E4769] hover:bg-white'
                            : 'border-[#E5DDD0] bg-[#F5F1EA] text-[#A39C93] line-through'
                        }`}
                        aria-pressed={isSelected}
                      >
                        <span
                          aria-hidden="true"
                          className="h-3.5 w-3.5 rounded-full border border-white/50 shadow-2xs shrink-0"
                          style={{ backgroundColor: getColorSwatchHex(color) }}
                        />
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected Variant Status & SKU */}
            {selectedVariant && (
              <div className="text-xs text-[#5A5A66] bg-[#FAF7F2] px-4 py-2.5 border border-[#E5DDD0] flex flex-wrap items-center justify-between gap-2">
                <span>
                  Variant Status:{' '}
                  <strong
                    className={isSelectedVariantOrderable ? 'text-[#2D6A73]' : 'text-red-700'}
                  >
                    {isSelectedVariantOrderable
                      ? selectedVariant.stock_quantity !== null
                        ? `In Stock (${selectedVariant.stock_quantity} available)`
                        : 'Available for Order'
                      : 'Unavailable / Out of Stock'}
                  </strong>
                </span>
                {(selectedVariant.sku || product.sku) && (
                  <span className="text-[#7A756E]">
                    SKU: {selectedVariant.sku || product.sku}
                  </span>
                )}
              </div>
            )}

            {/* Quantity & Add to Cart */}
            <div className="pt-2 space-y-4">
              {validationMessage && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 border border-red-300 bg-red-50 p-3.5 text-xs text-red-800"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-700" />
                  <span>{validationMessage}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Quantity Selector */}
                <div className="inline-flex items-center justify-between border border-[#D6CEC2] bg-[#FAF7F2] px-2 sm:w-36">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={!anyVariantAvailable || quantity <= 1}
                    className="p-3 text-[#1E1E24] hover:text-[#9E4769] disabled:opacity-40"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-semibold text-[#1E1E24]" aria-live="polite">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) =>
                        selectedVariant?.stock_quantity !== null &&
                        selectedVariant?.stock_quantity !== undefined
                          ? Math.min(selectedVariant.stock_quantity, q + 1)
                          : q + 1
                      )
                    }
                    disabled={
                      !anyVariantAvailable ||
                      (selectedVariant?.stock_quantity !== null &&
                        selectedVariant?.stock_quantity !== undefined &&
                        quantity >= selectedVariant.stock_quantity)
                    }
                    className="p-3 text-[#1E1E24] hover:text-[#9E4769] disabled:opacity-40"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Add to Bag Button */}
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!anyVariantAvailable}
                  className="flex-1 inline-flex items-center justify-center gap-2.5 bg-[#1E1E24] text-white px-8 py-4 text-xs font-semibold tracking-[0.2em] uppercase hover:bg-[#9E4769] transition-colors disabled:bg-[#C8BFAF] disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {anyVariantAvailable ? 'Add to Shopping Bag' : 'Currently Unavailable'}
                </button>
              </div>
            </div>

            {/* Order Process Notice */}
            <div className="border border-[#E5DDD0] bg-[#FAF7F2] p-4 space-y-2.5 text-xs text-[#5A5A66]">
              <div className="flex items-start gap-2.5">
                <MessageCircle className="h-4 w-4 text-[#2D6A73] shrink-0 mt-0.5" />
                <p>
                  <strong className="text-[#1E1E24]">WhatsApp Order Confirmation:</strong> Add your
                  selected suit to the bag and proceed to WhatsApp checkout. Our team personally
                  confirms stock availability and delivery charges with you on WhatsApp.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <Truck className="h-4 w-4 text-[#B8860B] shrink-0 mt-0.5" />
                <p>
                  <strong className="text-[#1E1E24]">Nationwide Delivery:</strong> Delivered across
                  Pakistan. Shipping inquiries: +923200300552.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-[#9E4769] shrink-0 mt-0.5" />
                <p>
                  <strong className="text-[#1E1E24]">Authentic Rang e Rosh Design:</strong> Crafted
                  in Pakistan.
                </p>
              </div>
            </div>

            {/* Full Description */}
            <div className="pt-5 border-t border-[#E5DDD0] space-y-3">
              <h2 className="font-serif text-xl font-medium text-[#1E1E24]">
                Design & Fabric Details
              </h2>
              <div className="text-sm text-[#4A4A55] leading-relaxed whitespace-pre-line">
                {product.description}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Image Lightbox Modal */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#18151C]/90 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Fullscreen product photo viewer"
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-5 right-5 bg-white/15 hover:bg-white text-white hover:text-[#1E1E24] p-2.5 transition-colors"
            aria-label="Close fullscreen viewer"
          >
            <X className="h-6 w-6" />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 bg-white/15 hover:bg-white text-white hover:text-[#1E1E24] p-3 transition-colors"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 bg-white/15 hover:bg-white text-white hover:text-[#1E1E24] p-3 transition-colors"
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}

          <div className="max-h-[90vh] max-w-3xl overflow-hidden border border-white/20 bg-[#FAF7F2]">
            <img
              src={resolveProductImageUrl(activeImage.storage_path)}
              alt={activeImage.alt_text || product.name}
              className="max-h-[85vh] w-auto object-contain mx-auto"
            />
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-20 pt-14 border-t border-[#E5DDD0]">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-semibold tracking-[0.24em] uppercase text-[#9E4769]">
                Complete Your Wardrobe
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#1E1E24] mt-1">
                You May Also Like
              </h2>
            </div>
            <Link
              to="/shop"
              className="text-xs font-semibold tracking-[0.18em] uppercase text-[#1E1E24] hover:text-[#9E4769] border-b border-[#1E1E24] pb-1"
            >
              View All Suits
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
