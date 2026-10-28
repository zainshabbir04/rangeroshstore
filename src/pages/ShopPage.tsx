import React, { useMemo, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Grid3X3, LayoutGrid } from 'lucide-react';
import { useStore } from '@/app/StoreContext';
import { DocumentHead } from '@/components/DocumentHead';
import { ProductCard, ProductCardSkeleton } from '@/components/ProductCard';
import type { SortOption } from '@/types';
import { getEffectivePrice } from '@/utils/format';

const PAGE_SIZE = 8;

interface ShopPageProps {
  mode?: 'all' | 'collection' | 'search';
}

export const ShopPage: React.FC<ShopPageProps> = ({ mode = 'all' }) => {
  const { slug: collectionSlug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, categories, loading, error } = useStore();

  const initialSearch = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>(
    mode === 'collection' && collectionSlug ? collectionSlug : 'all'
  );
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [gridColumns, setGridColumns] = useState<3 | 4>(4);

  // Sync collection slug when route param changes
  React.useEffect(() => {
    if (mode === 'collection' && collectionSlug) {
      setSelectedCategorySlug(collectionSlug);
    } else if (mode === 'all') {
      setSelectedCategorySlug('all');
    }
  }, [mode, collectionSlug]);

  // Sync search term from query string
  React.useEffect(() => {
    const q = searchParams.get('q') || '';
    setSearchTerm(q);
  }, [searchParams]);

  const activeCategory = useMemo(
    () =>
      categories.find(
        (c) => c.slug === (mode === 'collection' ? collectionSlug : selectedCategorySlug)
      ),
    [categories, mode, collectionSlug, selectedCategorySlug]
  );

  const filteredProducts = useMemo(() => {
    const effectiveCategorySlug =
      mode === 'collection' && collectionSlug ? collectionSlug : selectedCategorySlug;

    return products
      .filter((product) => {
        if (effectiveCategorySlug !== 'all') {
          const catSlug = product.category?.slug;
          if (catSlug !== effectiveCategorySlug) return false;
        }

        if (onlyAvailable) {
          const hasStock = product.variants.some(
            (v) => v.is_available && (v.stock_quantity === null || v.stock_quantity > 0)
          );
          if (!hasStock) return false;
        }

        if (searchTerm.trim().length > 0) {
          const query = searchTerm.toLowerCase().trim();
          const inName = product.name.toLowerCase().includes(query);
          const inShort = product.short_description.toLowerCase().includes(query);
          const inDesc = product.description.toLowerCase().includes(query);
          const inCat = product.category?.name.toLowerCase().includes(query) || false;
          const inColors = product.variants.some((v) =>
            (v.color || '').toLowerCase().includes(query)
          );
          const inSku = (product.sku || '').toLowerCase().includes(query);
          if (!inName && !inShort && !inDesc && !inCat && !inColors && !inSku) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') {
          return getEffectivePrice(a.price, a.sale_price) - getEffectivePrice(b.price, b.sale_price);
        }
        if (sortBy === 'price-desc') {
          return getEffectivePrice(b.price, b.sale_price) - getEffectivePrice(a.price, a.sale_price);
        }
        if (sortBy === 'featured') {
          if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [products, mode, collectionSlug, selectedCategorySlug, onlyAvailable, searchTerm, sortBy]);

  // If mode === 'collection' and category does not exist after loading
  if (!loading && mode === 'collection' && collectionSlug && !activeCategory) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <DocumentHead title="Collection Not Found" noIndex />
        <p className="text-xs uppercase tracking-[0.25em] text-[#9E4769] mb-2">404 Collection</p>
        <h1 className="font-serif text-4xl text-[#1E1E24] mb-4">Collection Not Found</h1>
        <p className="text-sm text-[#6E6A63] mb-8">
          The collection you are looking for is either inactive or does not exist.
        </p>
        <Link
          to="/shop"
          className="inline-block bg-[#1E1E24] text-white px-8 py-3.5 text-xs font-medium tracking-widest uppercase hover:bg-[#9E4769]"
        >
          Explore All Suits
        </Link>
      </div>
    );
  }

  const pageTitle =
    mode === 'collection' && activeCategory
      ? `${activeCategory.name} Collection`
      : mode === 'search'
      ? searchTerm
        ? `Search Results for "${searchTerm}"`
        : 'Search Catalog'
      : 'Shop All Ladies Stitched Suits';

  const pageDescription =
    mode === 'collection' && activeCategory
      ? activeCategory.description
      : 'Browse Rang e Rosh Pakistani ladies stitched suits by category, price, and availability.';

  const visibleProducts = filteredProducts.slice(0, visibleCount);

  const handleSearchInput = (value: string) => {
    setSearchTerm(value);
    setVisibleCount(PAGE_SIZE);
    if (mode === 'search') {
      if (value.trim()) {
        setSearchParams({ q: value }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <DocumentHead
        title={pageTitle}
        description={pageDescription}
        canonicalPath={
          mode === 'collection' && collectionSlug
            ? `/collections/${collectionSlug}`
            : mode === 'search'
            ? '/search'
            : '/shop'
        }
      />

      {/* Editorial Collection Header */}
      <div className="bg-gradient-to-r from-[#F3EDE2] via-[#F7F2E9] to-[#FAF7F2] border border-[#E5DDD0] p-6 sm:p-10 mb-8">
        <nav
          aria-label="Breadcrumb"
          className="text-xs text-[#7A756E] mb-3 flex items-center gap-2"
        >
          <Link to="/" className="hover:text-[#9E4769]">
            Home
          </Link>
          <span>/</span>
          {mode === 'collection' && (
            <>
              <Link to="/shop" className="hover:text-[#9E4769]">
                Collections
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-[#1E1E24] font-medium">{pageTitle}</span>
        </nav>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-semibold tracking-[0.26em] uppercase text-[#9E4769]">
              Rang e Rosh Ready-to-Wear
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-[#1E1E24] mt-1">
              {pageTitle}
            </h1>
            {pageDescription && (
              <p className="mt-3 text-sm sm:text-base text-[#5A5A66] max-w-2xl leading-relaxed">
                {pageDescription}
              </p>
            )}
          </div>

          {/* Quick Category Pills (when browsing /shop or /search) */}
          {mode !== 'collection' && categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategorySlug('all');
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.16em] uppercase border transition-all ${
                  selectedCategorySlug === 'all'
                    ? 'border-[#1E1E24] bg-[#1E1E24] text-white'
                    : 'border-[#D6CEC2] bg-white text-[#4A4A55] hover:border-[#9E4769]'
                }`}
              >
                All Suits
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategorySlug(cat.slug);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className={`px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.16em] uppercase border transition-all ${
                    selectedCategorySlug === cat.slug
                      ? 'border-[#1E1E24] bg-[#1E1E24] text-white'
                      : 'border-[#D6CEC2] bg-white text-[#4A4A55] hover:border-[#9E4769]'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-[#E5DDD0] p-4 sm:p-5 mb-8 space-y-4 shadow-2xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <label htmlFor="catalog-search" className="sr-only">
              Search suits by name, fabric, or color
            </label>
            <Search className="h-4 w-4 text-[#8C857B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="catalog-search"
              type="search"
              value={searchTerm}
              onChange={(e) => handleSearchInput(e.target.value)}
              placeholder="Search suit name, color, or fabric..."
              className="w-full border border-[#D6CEC2] bg-[#FAF7F2] pl-10 pr-9 py-2.5 text-sm text-[#1E1E24] placeholder:text-[#8C857B] focus:border-[#9E4769] focus:bg-white focus:outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => handleSearchInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7A756E] hover:text-[#1E1E24]"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category Filter (when not locked to a single collection route) */}
          <div className="md:col-span-3">
            <label htmlFor="catalog-category" className="sr-only">
              Filter by category
            </label>
            <select
              id="catalog-category"
              value={
                mode === 'collection' && collectionSlug ? collectionSlug : selectedCategorySlug
              }
              disabled={mode === 'collection'}
              onChange={(e) => {
                setSelectedCategorySlug(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24] focus:border-[#9E4769] focus:outline-none disabled:opacity-60"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Select */}
          <div className="md:col-span-4 flex items-center gap-3">
            <SlidersHorizontal className="h-4 w-4 text-[#7A756E] shrink-0 hidden sm:block" />
            <label htmlFor="catalog-sort" className="sr-only">
              Sort products
            </label>
            <select
              id="catalog-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24] focus:border-[#9E4769] focus:outline-none"
            >
              <option value="newest">Sort: Newest Arrivals</option>
              <option value="featured">Sort: Featured First</option>
              <option value="price-asc">Price: Low to High (PKR)</option>
              <option value="price-desc">Price: High to Low (PKR)</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#F0EAE1] text-xs text-[#5A5A66]">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="h-4 w-4 accent-[#9E4769]"
            />
            <span>Show in-stock suits only</span>
          </label>

          <div className="flex items-center gap-4">
            <span>
              Showing <strong>{visibleProducts.length}</strong> of{' '}
              <strong>{filteredProducts.length}</strong>{' '}
              {filteredProducts.length === 1 ? 'suit' : 'suits'}
            </span>

            {/* Desktop Grid Density Toggle */}
            <div className="hidden lg:flex items-center gap-1 border-l border-[#E5DDD0] pl-4">
              <button
                type="button"
                onClick={() => setGridColumns(3)}
                className={`p-1.5 border ${
                  gridColumns === 3
                    ? 'border-[#1E1E24] bg-[#1E1E24] text-white'
                    : 'border-[#E5DDD0] text-[#7A756E] hover:text-[#1E1E24]'
                }`}
                aria-label="3 column editorial grid view"
                title="3-Column Editorial View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setGridColumns(4)}
                className={`p-1.5 border ${
                  gridColumns === 4
                    ? 'border-[#1E1E24] bg-[#1E1E24] text-white'
                    : 'border-[#E5DDD0] text-[#7A756E] hover:text-[#1E1E24]'
                }`}
                aria-label="4 column standard grid view"
                title="4-Column Standard View"
              >
                <Grid3X3 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div role="alert" className="mb-8 border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Product Grid */}
      {loading ? (
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${
            gridColumns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
          } gap-6`}
        >
          {Array.from({ length: 8 }).map((_, idx) => (
            <ProductCardSkeleton key={idx} />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white border border-[#E5DDD0] p-12 text-center space-y-4">
          <p className="font-serif text-2xl text-[#1E1E24]">No matching suits found</p>
          <p className="text-sm text-[#6E6A63] max-w-md mx-auto">
            Try clearing your search filters or exploring all categories in our stitched collection.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategorySlug('all');
              setOnlyAvailable(false);
              setSearchParams({});
            }}
            className="inline-block bg-[#1E1E24] text-white px-6 py-3 text-xs font-medium tracking-widest uppercase hover:bg-[#9E4769]"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <>
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 ${
              gridColumns === 3 ? 'lg:grid-cols-3 gap-8' : 'lg:grid-cols-4 gap-6'
            }`}
          >
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {visibleCount < filteredProducts.length && (
            <div className="mt-12 text-center">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="border border-[#1E1E24] bg-white text-[#1E1E24] px-8 py-3.5 text-xs font-medium tracking-widest uppercase hover:bg-[#1E1E24] hover:text-white transition-colors"
              >
                Load More Suits ({filteredProducts.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
