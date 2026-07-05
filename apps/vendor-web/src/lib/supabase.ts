import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || "placeholder";

if (!import.meta.env.VITE_SUPABASE_URL && !import.meta.env.SUPABASE_URL) {
  console.warn("⚠️ Missing Supabase credentials in .env. Auth will not work.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
