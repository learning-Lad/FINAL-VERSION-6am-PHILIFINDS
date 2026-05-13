import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Added proper error handling to prevent silent query freezes
async function loadProfile(userId: string, email: string): Promise<User> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id,email,name,is_admin')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn("Profile fetch error (this is safe to ignore for new users):", error.message);
    }

    if (data) {
      return { id: data.id, email: data.email, name: data.name, isAdmin: data.is_admin };
    }
  } catch (err) {
    console.error("Critical error in loadProfile:", err);
  }

  // Safe fallback if the profile doesn't exist yet
  return { id: userId, email, name: email.split('@')[0], isAdmin: false };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check for an existing session when the app loads
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(await loadProfile(session.user.id, session.user.email!));
      }
      setLoading(false);
    });

    // 2. ONLY listen for logouts to avoid race conditions with the login function
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) return { ok: false, error: error.message };

    // 3. Profile fetching is now handled exclusively here!
    if (data.session?.user) {
      const profile = await loadProfile(data.session.user.id, data.session.user.email!);
      setUser(profile);
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
    
    // Fetch profile here as well for immediate login after signup
    if (data.session?.user) {
      const profile = await loadProfile(data.session.user.id, data.session.user.email!);
      setUser(profile);
    }

    return { ok: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
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