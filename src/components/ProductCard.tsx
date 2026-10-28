import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Sparkles } from 'lucide-react';
import type { Product } from '@/types';
import { formatPKR, getDiscountPercentage, getEffectivePrice } from '@/utils/format';
import { resolveProductImageUrl } from '@/lib/supabase';
import { STANDARD_COLORS } from '@/lib/config';

interface ProductCardProps {
  product: Product;
}

function getColorHex(colorName: string): string {
  const found = STANDARD_COLORS.find(
    (c) => c.name.toLowerCase() === colorName.trim().toLowerCase()
  );
  if (found) return found.hex;
  const lower = colorName.toLowerCase();
  if (lower.includes('red') || lower.includes('cranberry')) return '#7A1C24';
  if (lower.includes('black')) return '#18181B';
  if (lower.includes('rust') || lower.includes('mustard')) return '#C87D4B';
  if (lower.includes('emerald')) return '#134E3A';
  if (lower.includes('green')) return '#3B4D2B';
  if (lower.includes('purple') || lower.includes('orchid') || lower.includes('plum'))
    return '#3A1F47';
  if (lower.includes('rose') || lower.includes('pink')) return '#9E4769';
  return '#E5DDD0';
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const primaryImage =
    product.images.find((img) => img.is_primary) ||
    product.images[0] || {
      storage_path: '/images/sample/product-1.svg',
      alt_text: product.name,
    };

  const secondaryImage = product.images.find((img) => img.id !== primaryImage.id);

  const effectivePrice = getEffectivePrice(product.price, product.sale_price);
  const discountPercent = getDiscountPercentage(product.price, product.sale_price);

  const availableVariants = product.variants.filter(
    (v) => v.is_available && (v.stock_quantity === null || v.stock_quantity > 0)
  );
  const isAvailable = product.is_active && product.is_published && availableVariants.length > 0;

  const uniqueSizes = Array.from(
    new Set(availableVariants.map((v) => v.size).filter(Boolean))
  ) as string[];

  const uniqueColors = Array.from(
    new Set(product.variants.map((v) => v.color).filter(Boolean))
  ) as string[];

  const isSampleItem = product.name.toLowerCase().includes('[sample]');
  const cleanTitle = product.name.replace(/\s*\[Sample\]/i, '');

  return (
    <article className="group flex flex-col bg-white border border-[#E5DDD0]/90 transition-all duration-500 hover:border-[#B8860B]/60 hover:shadow-[0_14px_34px_-12px_rgba(24,24,29,0.1)]">
      {/* Editorial Portrait Image Frame */}
      <Link
        to={`/product/${product.slug}`}
        className="relative block aspect-[3/4] overflow-hidden bg-[#F2ECE2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9E4769]"
        aria-label={`View details for ${product.name}`}
      >
        <img
          src={resolveProductImageUrl(primaryImage.storage_path)}
          alt={primaryImage.alt_text || product.name}
          loading="lazy"
          width={700}
          height={933}
          className={`h-full w-full object-cover object-top transition-all duration-700 ease-out group-hover:scale-[1.04] ${
            secondaryImage ? 'group-hover:opacity-0' : ''
          }`}
        />
        {secondaryImage && (
          <img
            src={resolveProductImageUrl(secondaryImage.storage_path)}
            alt={secondaryImage.alt_text || `${product.name} alternate view`}
            loading="lazy"
            width={700}
            height={933}
            className="absolute inset-0 h-full w-full object-cover object-top opacity-0 transition-all duration-700 ease-out group-hover:scale-[1.04] group-hover:opacity-100"
          />
        )}

        {/* Top Left Status Pill Badges */}
        <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 z-10">
          {discountPercent !== null && isAvailable && (
            <span className="inline-block bg-[#9E4769] px-3 py-1 text-[10px] font-semibold tracking-[0.2em] uppercase text-white shadow-2xs">
              -{discountPercent}% Sale
            </span>
          )}
          {!isAvailable && (
            <span className="inline-block bg-[#18181D]/90 backdrop-blur-xs px-3 py-1 text-[10px] font-semibold tracking-[0.2em] uppercase text-white">
              Sold Out
            </span>
          )}
          {isSampleItem ? (
            <span className="inline-block bg-[#FAF7F2]/95 border border-[#B8860B]/50 px-2.5 py-0.5 text-[9px] font-semibold tracking-[0.2em] uppercase text-[#2E0836]">
              Sample Slot
            </span>
          ) : (
            product.is_featured &&
            isAvailable && (
              <span className="inline-flex items-center gap-1 bg-[#18181D]/85 backdrop-blur-xs px-2.5 py-1 text-[9px] font-medium tracking-[0.22em] uppercase text-[#FAF7F2]">
                <Sparkles className="h-2.5 w-2.5 text-[#D4AF37]" />
                Signature Pret
              </span>
            )
          )}
        </div>

        {/* Image Count Pill */}
        {product.images.length > 1 && (
          <span className="absolute top-3.5 right-3.5 bg-white/85 backdrop-blur-xs px-2 py-0.5 text-[10px] font-medium text-[#18181D] border border-[#E5DDD0]/80">
            {product.images.length} Photos
          </span>
        )}

        {/* Slide-up Editorial Quick Action Drawer */}
        <div className="absolute inset-x-3 bottom-3 translate-y-4 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
          <div className="bg-[#FAF7F2]/95 backdrop-blur-md border border-[#D4AF37]/40 px-4 py-3 text-center shadow-lg">
            <span className="inline-flex items-center justify-center gap-2 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#18181D]">
              <Eye className="h-3.5 w-3.5 text-[#9E4769]" />
              {isAvailable ? 'Select Size & View Suit' : 'Explore Details'}
            </span>
          </div>
        </div>
      </Link>

      {/* Card Body */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            {product.category ? (
              <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#9E4769]">
                {product.category.name}
              </span>
            ) : (
              <span className="text-[10px] font-semibold tracking-[0.22em] uppercase text-[#8C857B]">
                Rang e Rosh
              </span>
            )}

            {/* Color Swatch Dots */}
            {uniqueColors.length > 0 && (
              <div className="flex items-center gap-1.5" aria-label={`Colors: ${uniqueColors.join(', ')}`}>
                {uniqueColors.slice(0, 3).map((color) => (
                  <span
                    key={color}
                    title={color}
                    style={{ backgroundColor: getColorHex(color) }}
                    className="h-3 w-3 rounded-full border border-[#18181D]/25 shadow-2xs"
                  />
                ))}
                <span className="text-[10px] text-[#6E6A63] truncate max-w-24">
                  {uniqueColors[0]}
                </span>
              </div>
            )}
          </div>

          <h3 className="font-serif text-xl font-medium leading-snug text-[#18181D] group-hover:text-[#9E4769] transition-colors line-clamp-2">
            <Link to={`/product/${product.slug}`} className="focus:outline-none focus:underline">
              {cleanTitle}
            </Link>
          </h3>
        </div>

        <div className="mt-4 pt-3 border-t border-[#F0EAE1] space-y-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-xl font-semibold text-[#18181D]">
                {formatPKR(effectivePrice)}
              </span>
              {discountPercent !== null && (
                <span className="text-xs text-[#8C857B] line-through">
                  {formatPKR(product.price)}
                </span>
              )}
            </div>

            <span
              className={`text-[10px] font-semibold uppercase tracking-widest ${
                isAvailable ? 'text-[#215760]' : 'text-[#9E4769]'
              }`}
            >
              {isAvailable ? 'Ready to Ship' : 'Sold Out'}
            </span>
          </div>

          {uniqueSizes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              {uniqueSizes.slice(0, 6).map((sz) => (
                <span
                  key={sz}
                  className="inline-block border border-[#E5DDD0] bg-[#FAF7F2] px-2 py-0.5 text-[10px] font-medium text-[#4A4A55] tracking-wider uppercase group-hover:border-[#D6CEC2]"
                >
                  {sz}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export const ProductCardSkeleton: React.FC = () => (
  <div
    className="flex flex-col bg-white border border-[#E5DDD0] animate-pulse"
    aria-hidden="true"
  >
    <div className="aspect-[3/4] w-full bg-[#EAE2D7]" />
    <div className="p-5 space-y-3">
      <div className="h-3 w-1/3 bg-[#E5DDD0] rounded-xs" />
      <div className="h-6 w-4/5 bg-[#E5DDD0] rounded-xs" />
      <div className="pt-3 border-t border-[#F0EAE1] flex justify-between">
        <div className="h-5 w-1/3 bg-[#E5DDD0] rounded-xs" />
        <div className="h-4 w-1/4 bg-[#E5DDD0] rounded-xs" />
      </div>
    </div>
  </div>
);
