import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { BRAND_CONFIG, isSupabaseConfigured } from './config';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(BRAND_CONFIG.supabaseUrl, BRAND_CONFIG.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabaseInstance;
}

/**
 * Resolves a product image storage path to a public URL.
 * Supports local `/images/...` sample assets, data URLs, full https URLs, and Supabase Storage paths.
 */
export function resolveProductImageUrl(storagePath: string): string {
  if (!storagePath) {
    return '/images/sample/product-1.svg';
  }
  if (
    storagePath.startsWith('/') ||
    storagePath.startsWith('http://') ||
    storagePath.startsWith('https://') ||
    storagePath.startsWith('data:') ||
    storagePath.startsWith('blob:')
  ) {
    return storagePath;
  }

  const client = getSupabaseClient();
  if (!client) {
    return storagePath;
  }

  const { data } = client.storage.from(BRAND_CONFIG.storageBucket).getPublicUrl(storagePath);
  return data.publicUrl;
}
