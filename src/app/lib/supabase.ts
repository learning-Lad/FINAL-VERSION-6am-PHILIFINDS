import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anon);

if (!supabaseConfigured) {
  
  console.error(
    '[PhiliFinds] Missing Supabase env vars. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file (see INTEGRATION.md).'
  );
}

export const supabase = createClient(url ?? 'http://localhost:54321', anon ?? 'public-anon-placeholder', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Database = {
  profiles: {
    id: string;
    email: string;
    name: string;
    is_admin: boolean;
    created_at: string;
  };
  trips: {
    id: string;
    user_id: string;
    destination: string;
    budget: 'budget' | 'mid-range' | 'luxury';
    group_size: number;
    duration: number;
    activities: string[];
    itinerary: any | null;
    created_at: string;
  };
  emergency_contacts: {
    id: string;
    name: string;
    number: string;
    category: string;
    description: string | null;
    created_at: string;
  };
};
