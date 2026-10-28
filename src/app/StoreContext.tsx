import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Category, Product, StoreSettings } from '@/types';
import {
  fetchPublicCategories,
  fetchPublicProducts,
  fetchPublicStoreSettings,
} from '@/services/catalogService';
import { INITIAL_STORE_SETTINGS } from '@/services/sampleCatalog';
import { getActivePixelId } from '@/features/analytics/analytics';

interface StoreContextValue {
  settings: StoreSettings;
  categories: Category[];
  products: Product[];
  loading: boolean;
  error: string | null;
  activePixelId: string | null;
  refreshStoreData: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_STORE_SETTINGS);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStoreData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedSettings, fetchedCategories, fetchedProducts] = await Promise.all([
        fetchPublicStoreSettings(),
        fetchPublicCategories(),
        fetchPublicProducts(),
      ]);
      setSettings(fetchedSettings);
      setCategories(fetchedCategories);
      setProducts(fetchedProducts);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to load store catalog.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshStoreData();
  }, [refreshStoreData]);

  const activePixelId = getActivePixelId(settings.meta_pixel_enabled, settings.meta_pixel_id);

  return (
    <StoreContext.Provider
      value={{
        settings,
        categories,
        products,
        loading,
        error,
        activePixelId,
        refreshStoreData,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return ctx;
}
