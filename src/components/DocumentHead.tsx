import React, { useEffect } from 'react';
import { BRAND_CONFIG } from '@/lib/config';
import type { Product } from '@/types';
import { getEffectivePrice } from '@/utils/format';
import { resolveProductImageUrl } from '@/lib/supabase';

interface DocumentHeadProps {
  title: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: 'website' | 'product';
  noIndex?: boolean;
  productJsonLd?: Product | null;
}

export const DocumentHead: React.FC<DocumentHeadProps> = ({
  title,
  description = 'Explore Rang e Rosh Pakistani Ladies Stitched Suits & Luxury Pret — festive, formal, and everyday ensembles crafted with timeless elegance.',
  canonicalPath = '/',
  ogImage = '/images/logo.jpg',
  ogType = 'website',
  noIndex = false,
  productJsonLd = null,
}) => {
  useEffect(() => {
    const fullTitle = title.includes(BRAND_CONFIG.brandName)
      ? title
      : `${title} | ${BRAND_CONFIG.brandName}`;
    document.title = fullTitle;

    const setMetaTag = (selector: string, attrName: 'name' | 'property', attrValue: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMetaTag('meta[name="description"]', 'name', 'description', description);
    setMetaTag('meta[name="robots"]', 'name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', fullTitle);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', ogType);

    const resolvedImage = ogImage.startsWith('http')
      ? ogImage
      : `${BRAND_CONFIG.siteUrl}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`;
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', resolvedImage);

    const canonicalUrl = `${BRAND_CONFIG.siteUrl}${canonicalPath.startsWith('/') ? '' : '/'}${canonicalPath}`;
    setMetaTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);

    let canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // Structured Product JSON-LD (Strict accuracy: never invents reviews, ratings, or shipping promises)
    const scriptId = 'rer-product-jsonld';
    let jsonLdScript = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (productJsonLd && productJsonLd.is_published && productJsonLd.is_active) {
      const effectivePrice = getEffectivePrice(productJsonLd.price, productJsonLd.sale_price);
      const hasAvailableVariant = productJsonLd.variants.some(
        (v) => v.is_available && (v.stock_quantity === null || v.stock_quantity > 0)
      );
      const primaryImg =
        productJsonLd.images.find((i) => i.is_primary) || productJsonLd.images[0];
      const imgUrl = primaryImg ? resolveProductImageUrl(primaryImg.storage_path) : '/images/logo.jpg';
      const absoluteImgUrl = imgUrl.startsWith('http')
        ? imgUrl
        : `${BRAND_CONFIG.siteUrl}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;

      const structuredData = {
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: productJsonLd.name,
        description: productJsonLd.short_description || productJsonLd.description,
        image: [absoluteImgUrl],
        sku: productJsonLd.sku || productJsonLd.id,
        brand: {
          '@type': 'Brand',
          name: BRAND_CONFIG.brandName,
        },
        offers: {
          '@type': 'Offer',
          url: canonicalUrl,
          priceCurrency: BRAND_CONFIG.currencyCode,
          price: effectivePrice,
          availability: hasAvailableVariant
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
        },
      };

      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.id = scriptId;
        jsonLdScript.type = 'application/ld+json';
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.textContent = JSON.stringify(structuredData);
    } else if (jsonLdScript) {
      jsonLdScript.remove();
    }

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [title, description, canonicalPath, ogImage, ogType, noIndex, productJsonLd]);

  return null;
};
