import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (fields: { name?: string; avatarUrl?: string }) => Promise<{ ok: boolean; error?: string }>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function loadProfile(userId: string, email: string): Promise<User> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,email,name,avatar_url,is_admin')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('Profile fetch error (safe to ignore for new users):', error.message);
    }

    if (data) {
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        avatarUrl: data.avatar_url ?? null,
        isAdmin: data.is_admin,
      };
    }
  } catch (err) {
    console.error('Critical error in loadProfile:', err);
  }

  return { id: userId, email, name: email.split('@')[0], avatarUrl: null, isAdmin: false };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(await loadProfile(session.user.id, session.user.email!));
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setUser(null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    if (data.session?.user) {
      setUser(await loadProfile(data.session.user.id, data.session.user.email!));
    }
    return { ok: true };
  };

  const signup = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { ok: false, error: error.message };
    if (data.session?.user) {
      setUser(await loadProfile(data.session.user.id, data.session.user.email!));
    }
    return { ok: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Update name and/or avatar in the profiles table, then refresh local state
  const updateProfile = async (fields: { name?: string; avatarUrl?: string }) => {
    if (!user) return { ok: false, error: 'Not logged in' };

    const updates: Record<string, string> = { updated_at: new Date().toISOString() };
    if (fields.name !== undefined) updates.name = fields.name;
    if (fields.avatarUrl !== undefined) updates.avatar_url = fields.avatarUrl;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) return { ok: false, error: error.message };

    // Optimistically update local user state so UI reflects immediately
    setUser((prev) =>
      prev
        ? {
            ...prev,
            name: fields.name ?? prev.name,
            avatarUrl: fields.avatarUrl ?? prev.avatarUrl,
          }
        : prev
    );

    return { ok: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        updateProfile,
        isAuthenticated: !!user,
        isAdmin: user?.isAdmin ?? false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}