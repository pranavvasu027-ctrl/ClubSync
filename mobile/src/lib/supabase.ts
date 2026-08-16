import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://havgcjhhflxcuxmshpnh.supabase.co';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_KASec8tzMHeYHNVN5nzFdA_aJuHNk7E';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
