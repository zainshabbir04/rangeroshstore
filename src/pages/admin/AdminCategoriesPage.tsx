import React, { useEffect, useState } from 'react';
import {
  PlusCircle,
  Edit3,
  Trash2,
  Upload,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  createCategory,
  deleteCategorySafely,
  fetchAdminCategories,
  updateCategory,
  uploadProductImageFile,
} from '@/services/catalogService';
import type { Category, CategoryInput } from '@/types';
import { generateSlug } from '@/utils/format';
import { useStore } from '@/app/StoreContext';

export const AdminCategoriesPage: React.FC = () => {
  const { refreshStoreData } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<CategoryInput>({
    name: '',
    slug: '',
    description: '',
    image_url: '/images/sample/category-festive.svg',
    is_active: true,
  });

  // Safe Delete & Reassignment Modal State
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [reassignCategoryId, setReassignCategoryId] = useState<string>('');
  const [deleting, setDeleting] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminCategories();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const resetForm = () => {
    setEditingCategory(null);
    setSlugManuallyEdited(false);
    setForm({
      name: '',
      slug: '',
      description: '',
      image_url: '/images/sample/category-festive.svg',
      is_active: true,
    });
  };

  const handleStartEdit = (category: Category) => {
    setEditingCategory(category);
    setSlugManuallyEdited(true);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      image_url: category.image_url,
      is_active: category.is_active,
    });
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const result = await uploadProductImageFile(
        file,
        `category-${form.slug || generateSlug(form.name) || 'cover'}`
      );
      setForm((prev) => ({ ...prev, image_url: result.publicUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload category cover image.');
    } finally {
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);
    setSaving(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, form);
        setFeedback(`Updated category "${form.name}".`);
      } else {
        await createCategory(form);
        setFeedback(`Created category "${form.name}".`);
      }
      resetForm();
      await loadCategories();
      await refreshStoreData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    setDeleting(true);
    setError(null);
    setFeedback(null);
    try {
      await deleteCategorySafely(
        categoryToDelete.id,
        reassignCategoryId || undefined
      );
      const deletedName = categoryToDelete.name;
      setCategoryToDelete(null);
      setReassignCategoryId('');
      await loadCategories();
      await refreshStoreData();
      setFeedback(`Deleted category "${deletedName}" safely.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Category deletion failed.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-[#E5DDD0] pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9E4769]">
          Collections & Navigation
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#1E1E24] mt-1">
          Manage Categories ({categories.length})
        </h1>
      </div>

      {error && (
        <div role="alert" className="border border-red-300 bg-red-50 p-4 text-xs text-red-800">
          {error}
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Create / Edit Category Form */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-[#E5DDD0] p-6 space-y-4 sticky top-8"
          >
            <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3">
              <h2 className="font-serif text-xl font-medium text-[#1E1E24]">
                {editingCategory ? `Edit: ${editingCategory.name}` : 'Create New Category'}
              </h2>
              {editingCategory && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-[#6E6A63] hover:text-[#1E1E24] inline-flex items-center gap-1"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
              )}
            </div>

            <div>
              <label
                htmlFor="cat-name"
                className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
              >
                Category Name <span className="text-[#9E4769]">*</span>
              </label>
              <input
                id="cat-name"
                type="text"
                required
                value={form.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    name: val,
                    slug: slugManuallyEdited ? prev.slug : generateSlug(val),
                  }));
                }}
                placeholder="e.g., Festive Pret"
                className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24] focus:border-[#9E4769] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="cat-slug"
                className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
              >
                Unique Slug <span className="text-[#9E4769]">*</span>
              </label>
              <input
                id="cat-slug"
                type="text"
                required
                value={form.slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true);
                  setForm((prev) => ({ ...prev, slug: e.target.value.toLowerCase() }));
                }}
                placeholder="festive-pret"
                className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm font-mono text-[#1E1E24] focus:border-[#9E4769] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="cat-desc"
                className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
              >
                Category Description
              </label>
              <textarea
                id="cat-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Short description shown on the collection banner"
                className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3.5 py-2.5 text-sm text-[#1E1E24] focus:border-[#9E4769] focus:outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24]">
                Category Cover Image
              </label>
              <div className="flex items-center gap-3">
                <img
                  src={form.image_url || '/images/sample/category-festive.svg'}
                  alt="Cover preview"
                  className="h-16 w-14 object-cover border border-[#E5DDD0] bg-[#F0EAE1]"
                />
                <div className="flex-1 space-y-1.5">
                  <input
                    type="text"
                    value={form.image_url}
                    onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))}
                    placeholder="/images/sample/category-festive.svg"
                    className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3 py-1.5 text-xs text-[#1E1E24]"
                  />
                  <label className="inline-flex items-center gap-1.5 border border-[#D6CEC2] bg-[#FAF7F2] px-3 py-1 text-[11px] font-medium text-[#1E1E24] cursor-pointer hover:border-[#9E4769]">
                    <Upload className="h-3.5 w-3.5" />
                    Upload Cover Image
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
                      onChange={handleCoverUpload}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2.5 pt-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 accent-[#9E4769]"
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#1E1E24]">
                Active on Public Navigation & Homepage
              </span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#1E1E24] text-white px-6 py-3 text-xs font-semibold uppercase tracking-widest hover:bg-[#9E4769] transition-colors disabled:opacity-50"
            >
              <PlusCircle className="h-4 w-4" />
              {saving
                ? 'Saving...'
                : editingCategory
                ? 'Save Category Changes'
                : 'Create Category'}
            </button>
          </form>
        </div>

        {/* Right: Categories List */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-[#E5DDD0] divide-y divide-[#E5DDD0]">
            {loading ? (
              <div className="p-12 text-center text-xs uppercase tracking-widest text-[#6E6A63]">
                Loading categories...
              </div>
            ) : categories.length === 0 ? (
              <div className="p-12 text-center text-sm text-[#6E6A63]">
                No categories configured yet.
              </div>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF7F2]/60"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={cat.image_url || '/images/sample/category-festive.svg'}
                      alt={cat.name}
                      className="h-18 w-14 object-cover border border-[#E5DDD0] bg-[#F0EAE1] shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif text-xl font-medium text-[#1E1E24]">
                          {cat.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${
                            cat.is_active
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-gray-100 text-gray-600 border-gray-300'
                          }`}
                        >
                          {cat.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="bg-[#FAF7F2] border border-[#E5DDD0] px-2 py-0.5 text-[11px] text-[#5A5A66]">
                          {cat.product_count ?? 0} product(s)
                        </span>
                      </div>
                      <p className="text-xs font-mono text-[#8C857B]">
                        /collections/{cat.slug}
                      </p>
                      {cat.description && (
                        <p className="text-xs text-[#5A5A66] line-clamp-2">{cat.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(cat)}
                      className="inline-flex items-center gap-1 border border-[#D6CEC2] bg-[#FAF7F2] px-3 py-1.5 text-xs font-medium text-[#1E1E24] hover:border-[#9E4769]"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryToDelete(cat);
                        const firstOther = categories.find((c) => c.id !== cat.id);
                        setReassignCategoryId(firstOther ? firstOther.id : '');
                      }}
                      className="p-1.5 border border-[#D6CEC2] bg-[#FAF7F2] text-red-700 hover:bg-red-50"
                      aria-label={`Delete category ${cat.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Safe Category Deletion Modal (Prevents Orphaned Products) */}
      {categoryToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E1E24]/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-category-modal-title"
        >
          <div className="bg-white border border-[#E5DDD0] max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h2
                  id="delete-category-modal-title"
                  className="font-serif text-2xl font-medium text-[#1E1E24]"
                >
                  Delete Category: {categoryToDelete.name}
                </h2>

                {(categoryToDelete.product_count ?? 0) > 0 ? (
                  <div className="space-y-3 text-xs text-[#4A4A55]">
                    <p className="text-amber-900 bg-amber-50 border border-amber-200 p-3">
                      <strong>Orphan Prevention Guard:</strong> This category currently has{' '}
                      <strong>{categoryToDelete.product_count} associated product(s)</strong>. To
                      prevent orphaned products, please select a category below to reassign those
                      products before deleting.
                    </p>

                    <div>
                      <label
                        htmlFor="reassign-category-select"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#1E1E24] mb-1.5"
                      >
                        Reassign Products To:
                      </label>
                      <select
                        id="reassign-category-select"
                        value={reassignCategoryId}
                        onChange={(e) => setReassignCategoryId(e.target.value)}
                        className="w-full border border-[#D6CEC2] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1E1E24]"
                      >
                        <option value="">Select target category...</option>
                        {categories
                          .filter((c) => c.id !== categoryToDelete.id)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#5A5A66]">
                    This category has 0 associated products and can be safely deleted.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5DDD0]">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setCategoryToDelete(null)}
                className="border border-[#D6CEC2] bg-[#FAF7F2] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#1E1E24]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  deleting ||
                  ((categoryToDelete.product_count ?? 0) > 0 && !reassignCategoryId)
                }
                onClick={handleConfirmDelete}
                className="bg-red-700 text-white px-5 py-2 text-xs font-semibold uppercase tracking-wider hover:bg-red-800 disabled:opacity-40"
              >
                {deleting ? 'Deleting...' : 'Confirm Safe Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
