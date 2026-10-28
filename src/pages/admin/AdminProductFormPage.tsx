import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Upload,
  ArrowUp,
  ArrowDown,
  Star,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  createProduct,
  fetchAdminCategories,
  fetchAdminProductById,
  updateProduct,
  uploadProductImageFile,
} from '@/services/catalogService';
import type { Category, ProductInput } from '@/types';
import { generateSlug } from '@/utils/format';
import { resolveProductImageUrl } from '@/lib/supabase';
import { STANDARD_COLORS, STANDARD_SIZES } from '@/lib/config';
import { useStore } from '@/app/StoreContext';

export const AdminProductFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { refreshStoreData } = useStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [slugManuallyEdited, setSlugManuallyEdited] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [form, setForm] = useState<ProductInput>({
    name: '',
    slug: '',
    short_description: '',
    description: '',
    category_id: '',
    price: 7500,
    sale_price: null,
    sku: '',
    is_featured: false,
    is_active: true,
    is_published: false,
    variants: [
      { size: 'Small', color: 'Warm Ivory', sku: '', stock_quantity: null, is_available: true },
      { size: 'Medium', color: 'Warm Ivory', sku: '', stock_quantity: null, is_available: true },
      { size: 'Large', color: 'Warm Ivory', sku: '', stock_quantity: null, is_available: true },
    ],
    images: [],
  });

  useEffect(() => {
    let isMounted = true;
    async function init() {
      setLoading(true);
      setError(null);
      try {
        const fetchedCategories = await fetchAdminCategories();
        if (!isMounted) return;
        setCategories(fetchedCategories);

        if (isEditing && id) {
          const existing = await fetchAdminProductById(id);
          if (!isMounted) return;
          if (!existing) {
            setError('Product not found.');
            return;
          }
          setSlugManuallyEdited(true);
          setForm({
            name: existing.name,
            slug: existing.slug,
            short_description: existing.short_description,
            description: existing.description,
            category_id: existing.category_id,
            price: existing.price,
            sale_price: existing.sale_price,
            sku: existing.sku || '',
            is_featured: existing.is_featured,
            is_active: existing.is_active,
            is_published: existing.is_published,
            variants: existing.variants.map((v) => ({
              size: v.size || '',
              color: v.color || '',
              sku: v.sku || '',
              stock_quantity: v.stock_quantity,
              is_available: v.is_available,
            })),
            images: existing.images.map((img, idx) => ({
              storage_path: img.storage_path,
              alt_text: img.alt_text,
              display_order: idx,
              is_primary: img.is_primary,
            })),
          });
        } else if (fetchedCategories.length > 0) {
          setForm((prev) => ({ ...prev, category_id: fetchedCategories[0].id }));
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to initialize product form.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    void init();
    return () => {
      isMounted = false;
    };
  }, [id, isEditing]);

  const handleNameChange = (newName: string) => {
    setForm((prev) => ({
      ...prev,
      name: newName,
      slug: slugManuallyEdited ? prev.slug : generateSlug(newName),
    }));
  };

  // ---------------------------------------------------------------------------
  // VARIANT HANDLERS
  // ---------------------------------------------------------------------------
  const handleAddVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          size: 'Medium',
          color: 'Warm Ivory',
          sku: '',
          stock_quantity: null,
          is_available: true,
        },
      ],
    }));
  };

  const handleRemoveVariant = (index: number) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, idx) => idx !== index),
    }));
  };

  const handleVariantChange = (
    index: number,
    field: 'size' | 'color' | 'sku' | 'stock_quantity' | 'is_available',
    value: string | number | boolean | null
  ) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, idx) => (idx === index ? { ...v, [field]: value } : v)),
    }));
  };

  // ---------------------------------------------------------------------------
  // IMAGE UPLOAD & ORDERING HANDLERS
  // ---------------------------------------------------------------------------
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadError(null);

    const slugForUpload = form.slug || generateSlug(form.name) || 'suit';
    const fileArray = Array.from(files);

    try {
      for (const file of fileArray) {
        setUploadProgress(10);
        const result = await uploadProductImageFile(file, slugForUpload, (pct) =>
          setUploadProgress(pct)
        );
        setForm((prev) => {
          const isFirst = prev.images.length === 0;
          return {
            ...prev,
            images: [
              ...prev.images,
              {
                storage_path: result.storagePath,
                alt_text: prev.name || file.name.replace(/\.[^/.]+$/, ''),
                display_order: prev.images.length,
                is_primary: isFirst,
              },
            ],
          };
        });
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setUploadProgress(null);
      e.target.value = '';
    }
  };

  const handleReplaceImage = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    const slugForUpload = form.slug || generateSlug(form.name) || 'suit';

    try {
      setUploadProgress(15);
      const result = await uploadProductImageFile(file, slugForUpload, (pct) =>
        setUploadProgress(pct)
      );
      setForm((prev) => ({
        ...prev,
        images: prev.images.map((img, idx) =>
          idx === index
            ? {
                ...img,
                storage_path: result.storagePath,
              }
            : img
        ),
      }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Image replacement failed.');
    } finally {
      setUploadProgress(null);
      e.target.value = '';
    }
  };

  const handleAddSamplePlaceholderImage = (samplePath: string) => {
    setForm((prev) => {
      const isFirst = prev.images.length === 0;
      return {
        ...prev,
        images: [
          ...prev.images,
          {
            storage_path: samplePath,
            alt_text: prev.name ? `[Sample Photo] ${prev.name}` : 'Sample Suit Image',
            display_order: prev.images.length,
            is_primary: isFirst,
          },
        ],
      };
    });
  };

  const handleSetPrimaryImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((img, idx) => ({
        ...img,
        is_primary: idx === index,
      })),
    }));
  };

  const handleMoveImage = (index: number, direction: -1 | 1) => {
    setForm((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.images.length) return prev;
      const nextImages = [...prev.images];
      const temp = nextImages[index];
      nextImages[index] = nextImages[targetIndex];
      nextImages[targetIndex] = temp;
      return {
        ...prev,
        images: nextImages.map((img, idx) => ({ ...img, display_order: idx })),
      };
    });
  };

  const handleRemoveImage = (index: number) => {
    setForm((prev) => {
      const filtered = prev.images.filter((_, idx) => idx !== index);
      if (filtered.length > 0 && !filtered.some((i) => i.is_primary)) {
        filtered[0].is_primary = true;
      }
      return {
        ...prev,
        images: filtered.map((img, idx) => ({ ...img, display_order: idx })),
      };
    });
  };

  // ---------------------------------------------------------------------------
  // SUBMIT HANDLER
  // ---------------------------------------------------------------------------
  const handleSaveProduct = async (publishState?: boolean) => {
    setError(null);
    setSuccessMessage(null);
    setSaving(true);

    try {
      const payload: ProductInput = {
        ...form,
        is_published: publishState !== undefined ? publishState : form.is_published,
      };

      if (isEditing && id) {
        const updated = await updateProduct(id, payload);
        setForm((prev) => ({ ...prev, is_published: updated.is_published }));
        await refreshStoreData();
        setSuccessMessage(
          `Saved changes to "${updated.name}" (${updated.is_published ? 'Published' : 'Draft'}).`
        );
      } else {
        const created = await createProduct(payload);
        await refreshStoreData();
        navigate(`/admin/products/${created.id}/edit`, { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs uppercase tracking-widest text-[#6E6A63]">
        Loading product editor...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5DDD0] pb-6">
        <div>
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#6E6A63] hover:text-[#9E4769] mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Products
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#1E1E24]">
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveProduct(false)}
            className="border border-[#1E1E24] bg-white text-[#1E1E24] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider hover:bg-[#FAF7F2] disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleSaveProduct(true)}
            className="inline-flex items-center gap-2 bg-[#1E1E24] text-white px-6 py-2.5 text-xs font-semibold uppercase tracking-widest hover:bg-[#9E4769] transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : isEditing && form.is_published ? 'Save & Update' : 'Publish Product'}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 border border-red-300 bg-red-50 p-4 text-xs text-red-800"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-700" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="flex items-center gap-2.5 border border-emerald-300 bg-emerald-50 p-4 text-xs text-emerald-900"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8 Columns: Core Details, Variants, and Images */}
        <div className="lg:col-span-8 space-y-8">
          {/* 1. Core Information */}
          <section className="bg-white border border-[#E5DDD0] p-6 space-y-5">
            <h2 className="font-serif text-xl font-medium text-[#1E1E24] border-b border-[#F0EAE1] pb-3">
              1. Suit Name, Slug & Descriptions
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label
                  htmlFor="product-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
                >
                  Product Name <span className="text-[#9E4769]">*</span>
                </label>
                <input
                  id="product-name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Noor-e-Sahar Embroidered 3-Piece Suit"
                  className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24] focus:border-[#9E4769] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="product-slug"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
                >
                  Unique URL Slug <span className="text-[#9E4769]">*</span>
                </label>
                <input
                  id="product-slug"
                  type="text"
                  required
                  value={form.slug}
                  onChange={(e) => {
                    setSlugManuallyEdited(true);
                    setForm((prev) => ({ ...prev, slug: e.target.value.toLowerCase() }));
                  }}
                  placeholder="noor-e-sahar-embroidered-3pc"
                  className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm font-mono text-[#1E1E24] focus:border-[#9E4769] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="product-sku"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
                >
                  Master SKU <span className="text-[#8C857B] font-normal">(Optional)</span>
                </label>
                <input
                  id="product-sku"
                  type="text"
                  value={form.sku || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                  placeholder="e.g., RER-2026-009"
                  className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24] focus:border-[#9E4769] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="product-short-desc"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
                >
                  Short Summary Description
                </label>
                <input
                  id="product-short-desc"
                  type="text"
                  value={form.short_description}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, short_description: e.target.value }))
                  }
                  placeholder="One-sentence fabric and embroidery overview shown on product page"
                  className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24] focus:border-[#9E4769] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="product-full-desc"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
                >
                  Full Fabric, Cut & Care Description
                </label>
                <textarea
                  id="product-full-desc"
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Detailed description of shirt fabric, trouser cut, dupatta embroidery, and care instructions..."
                  className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24] focus:border-[#9E4769] focus:outline-none"
                />
              </div>
            </div>
          </section>

          {/* 2. Product Images Management */}
          <section className="bg-white border border-[#E5DDD0] p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0EAE1] pb-3">
              <div>
                <h2 className="font-serif text-xl font-medium text-[#1E1E24]">
                  2. Product Images & Gallery Order
                </h2>
                <p className="text-xs text-[#6E6A63]">
                  Upload JPEG, PNG, WebP, AVIF, or SVG images (automatically optimized to WebP).
                  Select the primary cover image and reorder as needed.
                </p>
              </div>

              <label className="inline-flex items-center gap-2 bg-[#1E1E24] text-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wider cursor-pointer hover:bg-[#9E4769] transition-colors shrink-0">
                <Upload className="h-4 w-4" />
                <span>Upload Images</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
                  multiple
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
            </div>

            {uploadProgress !== null && (
              <div className="bg-[#FAF7F2] border border-[#B8860B]/40 p-3 text-xs text-[#3B0A45]">
                Optimizing & uploading image... ({uploadProgress}%)
              </div>
            )}

            {uploadError && (
              <div role="alert" className="border border-red-300 bg-red-50 p-3 text-xs text-red-800">
                {uploadError}
              </div>
            )}

            {/* Quick Sample Placeholder Selector for Development */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E6A63] bg-[#FAF7F2] p-3 border border-[#E5DDD0]">
              <span className="font-semibold text-[#1E1E24]">Quick Add Sample Placeholder:</span>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() =>
                    handleAddSamplePlaceholderImage(`/images/sample/product-${num}.svg`)
                  }
                  className="border border-[#D6CEC2] bg-white px-2 py-1 text-[11px] hover:border-[#9E4769]"
                >
                  Sample #{num}
                </button>
              ))}
            </div>

            {form.images.length === 0 ? (
              <div className="border-2 border-dashed border-[#D6CEC2] p-8 text-center text-xs text-[#6E6A63]">
                No product images added yet. Upload a photograph above or pick a temporary sample
                placeholder.
              </div>
            ) : (
              <div className="space-y-3">
                {form.images.map((img, idx) => (
                  <div
                    key={`${img.storage_path}-${idx}`}
                    className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 border ${
                      img.is_primary
                        ? 'border-[#B8860B] bg-[#FAF7F2]'
                        : 'border-[#E5DDD0] bg-white'
                    }`}
                  >
                    <img
                      src={resolveProductImageUrl(img.storage_path)}
                      alt={img.alt_text || 'Preview'}
                      className="h-20 w-16 object-cover border border-[#E5DDD0] bg-[#F0EAE1] shrink-0"
                    />

                    <div className="flex-1 w-full space-y-2">
                      <div className="flex items-center gap-2">
                        {img.is_primary && (
                          <span className="bg-[#B8860B] text-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                            Primary Image
                          </span>
                        )}
                        <span className="text-xs text-[#7A756E]">Order #{idx + 1}</span>
                      </div>

                      <div>
                        <label
                          htmlFor={`img-alt-${idx}`}
                          className="sr-only"
                        >
                          Image Alt Text
                        </label>
                        <input
                          id={`img-alt-${idx}`}
                          type="text"
                          value={img.alt_text}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              images: prev.images.map((item, i) =>
                                i === idx ? { ...item, alt_text: e.target.value } : item
                              ),
                            }))
                          }
                          placeholder="Descriptive alt text for accessibility & SEO"
                          className="w-full border border-[#D6CEC2] bg-white px-3 py-1.5 text-xs text-[#1E1E24] focus:border-[#9E4769] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      {!img.is_primary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          className="border border-[#D6CEC2] bg-[#FAF7F2] px-2.5 py-1.5 text-[11px] font-medium text-[#1E1E24] hover:border-[#B8860B]"
                          title="Set as Primary Cover Image"
                        >
                          <Star className="h-3.5 w-3.5 inline mr-1 text-[#B8860B]" />
                          Make Primary
                        </button>
                      )}

                      <label className="border border-[#D6CEC2] bg-[#FAF7F2] px-2.5 py-1.5 text-[11px] font-medium text-[#1E1E24] cursor-pointer hover:border-[#9E4769]">
                        Replace
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
                          onChange={(e) => handleReplaceImage(idx, e)}
                          className="sr-only"
                        />
                      </label>

                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveImage(idx, -1)}
                        className="p-1.5 border border-[#D6CEC2] bg-white text-[#1E1E24] disabled:opacity-35"
                        aria-label="Move image up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        disabled={idx === form.images.length - 1}
                        onClick={() => handleMoveImage(idx, 1)}
                        className="p-1.5 border border-[#D6CEC2] bg-white text-[#1E1E24] disabled:opacity-35"
                        aria-label="Move image down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1.5 border border-[#D6CEC2] bg-white text-red-700 hover:bg-red-50"
                        aria-label="Remove image"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 3. Clothing Variants (Sizes, Colors, Optional SKU & Optional Stock) */}
          <section className="bg-white border border-[#E5DDD0] p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0EAE1] pb-3">
              <div>
                <h2 className="font-serif text-xl font-medium text-[#1E1E24]">
                  3. Clothing Variants (Sizes, Colors & Availability)
                </h2>
                <p className="text-xs text-[#6E6A63]">
                  Configure custom sizes and colors for this suit. Leave Stock Quantity blank if you
                  prefer manual availability checks without numeric stock tracking.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="inline-flex items-center gap-1.5 bg-[#1E1E24] text-white px-4 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-[#9E4769] shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Variant Row
              </button>
            </div>

            <datalist id="standard-sizes-datalist">
              {STANDARD_SIZES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <datalist id="standard-colors-datalist">
              {STANDARD_COLORS.map((c) => (
                <option key={c.name} value={c.name} />
              ))}
            </datalist>

            <div className="space-y-3">
              {form.variants.map((variant, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end bg-[#FAF7F2] border border-[#E5DDD0] p-3.5"
                >
                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#5A5A66] mb-1">
                      Size
                    </label>
                    <input
                      type="text"
                      list="standard-sizes-datalist"
                      value={variant.size || ''}
                      onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                      placeholder="Small, Medium, Large..."
                      className="w-full border border-[#D6CEC2] bg-white px-2.5 py-1.5 text-xs text-[#1E1E24]"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#5A5A66] mb-1">
                      Color
                    </label>
                    <input
                      type="text"
                      list="standard-colors-datalist"
                      value={variant.color || ''}
                      onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                      placeholder="e.g., Warm Ivory"
                      className="w-full border border-[#D6CEC2] bg-white px-2.5 py-1.5 text-xs text-[#1E1E24]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#5A5A66] mb-1">
                      Variant SKU
                    </label>
                    <input
                      type="text"
                      value={variant.sku || ''}
                      onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                      placeholder="Optional"
                      className="w-full border border-[#D6CEC2] bg-white px-2.5 py-1.5 text-xs text-[#1E1E24]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#5A5A66] mb-1">
                      Stock Qty
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={variant.stock_quantity ?? ''}
                      onChange={(e) =>
                        handleVariantChange(
                          index,
                          'stock_quantity',
                          e.target.value === '' ? null : Math.max(0, parseInt(e.target.value, 10))
                        )
                      }
                      placeholder="Optional"
                      className="w-full border border-[#D6CEC2] bg-white px-2.5 py-1.5 text-xs text-[#1E1E24]"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 pb-1">
                    <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={variant.is_available}
                        onChange={(e) =>
                          handleVariantChange(index, 'is_available', e.target.checked)
                        }
                        className="h-4 w-4 accent-[#9E4769]"
                      />
                      <span>Available</span>
                    </label>

                    {form.variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(index)}
                        className="p-1 text-red-700 hover:bg-red-50"
                        aria-label="Remove variant"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right 4 Columns: Pricing, Category & Publication Controls */}
        <div className="lg:col-span-4 space-y-6">
          {/* Pricing in PKR */}
          <section className="bg-white border border-[#E5DDD0] p-6 space-y-4">
            <h2 className="font-serif text-xl font-medium text-[#1E1E24] border-b border-[#F0EAE1] pb-3">
              Pricing (PKR / Rs.)
            </h2>

            <div>
              <label
                htmlFor="product-price"
                className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
              >
                Regular Price (Rs.) <span className="text-[#9E4769]">*</span>
              </label>
              <input
                id="product-price"
                type="number"
                min={0}
                step={50}
                required
                value={form.price}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, price: Number(e.target.value) }))
                }
                className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm font-semibold text-[#1E1E24] focus:border-[#9E4769] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="product-sale-price"
                className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
              >
                Optional Sale Price (Rs.)
              </label>
              <input
                id="product-sale-price"
                type="number"
                min={0}
                step={50}
                value={form.sale_price ?? ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    sale_price: e.target.value === '' ? null : Number(e.target.value),
                  }))
                }
                placeholder="Leave blank if no sale"
                className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24] focus:border-[#9E4769] focus:outline-none"
              />
              <p className="mt-1 text-[11px] text-[#7A756E]">
                Sale badge is displayed only when a valid sale price lower than regular price is
                configured.
              </p>
            </div>
          </section>

          {/* Category Assignment */}
          <section className="bg-white border border-[#E5DDD0] p-6 space-y-4">
            <h2 className="font-serif text-xl font-medium text-[#1E1E24] border-b border-[#F0EAE1] pb-3">
              Category
            </h2>

            <div>
              <label
                htmlFor="product-category"
                className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
              >
                Collection Category <span className="text-[#9E4769]">*</span>
              </label>
              <select
                id="product-category"
                required
                value={form.category_id}
                onChange={(e) => setForm((prev) => ({ ...prev, category_id: e.target.value }))}
                className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24] focus:border-[#9E4769] focus:outline-none"
              >
                <option value="">Select Category...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {!cat.is_active ? '(Inactive)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Publication & Visibility Controls */}
          <section className="bg-white border border-[#E5DDD0] p-6 space-y-4">
            <h2 className="font-serif text-xl font-medium text-[#1E1E24] border-b border-[#F0EAE1] pb-3">
              Visibility & Status
            </h2>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, is_published: e.target.checked }))
                }
                className="h-4 w-4 mt-0.5 accent-[#9E4769]"
              />
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24]">
                  Published on Storefront
                </span>
                <span className="block text-[11px] text-[#6E6A63]">
                  Uncheck to save as a private Draft hidden from public queries.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 mt-0.5 accent-[#9E4769]"
              />
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24]">
                  Active / Available for Ordering
                </span>
                <span className="block text-[11px] text-[#6E6A63]">
                  Uncheck to temporarily deactivate ordering for this suit.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, is_featured: e.target.checked }))
                }
                className="h-4 w-4 mt-0.5 accent-[#9E4769]"
              />
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24]">
                  Featured on Homepage
                </span>
                <span className="block text-[11px] text-[#6E6A63]">
                  Highlight this suit in the Featured Collection section on the homepage.
                </span>
              </div>
            </label>
          </section>
        </div>
      </div>
    </div>
  );
};
