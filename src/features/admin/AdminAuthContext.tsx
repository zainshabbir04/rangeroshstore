import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  type AdminSessionUser,
  getCurrentAdminSession,
  signInAdminWithEmailPassword,
  signOutAdmin,
  startLocalDevelopmentAdminPreview,
} from '@/services/authService';
import { getSupabaseClient } from '@/lib/supabase';

interface AdminAuthContextValue {
  adminUser: AdminSessionUser | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  activateLocalPreview: (email?: string) => void;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<AdminSessionUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkSession = useCallback(async () => {
    setLoading(true);
    try {
      const current = await getCurrentAdminSession();
      setAdminUser(current);
    } catch {
      setAdminUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkSession();

    const supabase = getSupabaseClient();
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void checkSession();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkSession]);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    const user = await signInAdminWithEmailPassword(email, password);
    setAdminUser(user);
  }, []);

  const activateLocalPreview = useCallback((email?: string) => {
    const user = startLocalDevelopmentAdminPreview(email);
    setAdminUser(user);
  }, []);

  const logout = useCallback(async () => {
    await signOutAdmin();
    setAdminUser(null);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        loading,
        loginWithEmail,
        activateLocalPreview,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return ctx;
}
