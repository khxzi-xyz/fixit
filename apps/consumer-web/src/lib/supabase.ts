import { createClient } from "@supabase/supabase-js";
import { Preferences } from "@capacitor/preferences";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || "placeholder";

if (!import.meta.env.VITE_SUPABASE_URL && !import.meta.env.SUPABASE_URL) {
  console.warn("⚠️ Missing Supabase credentials in .env. Auth will not work.");
}

// Custom storage adapter for Capacitor
const capacitorStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const { value } = await Preferences.get({ key });
      return value;
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await Preferences.set({ key, value });
    } catch {}
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await Preferences.remove({ key });
    } catch {}
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: capacitorStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
