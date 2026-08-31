import { createClient } from '@supabase/supabase-js';

// Get these from your .env file or hardcode them here for local dev if necessary
// But since the mobile app is in the same repo, we can copy the same env variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase URL or Anon Key! Add them to your .env file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
