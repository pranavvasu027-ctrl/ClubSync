import { createClient } from '@supabase/supabase-js';

// Environment variables with fallback to the live ClubSync Supabase project
const defaultUrl = 'https://havgcjhhflxcuxmshpnh.supabase.co';
const defaultAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhdmdjamhoZmx4Y3V4bXNocG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5MDY1MTQsImV4cCI6MjEwMjQ4MjUxNH0.cFEEiIXT2Bp893Vn5zqUVGcHvBFBADJBPwQ5yodv0Fo';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || defaultUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || defaultAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

