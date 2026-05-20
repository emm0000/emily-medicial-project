import { createClient } from '@supabase/supabase-js';

// Get the URL and ensure it doesn't end with /rest/v1/ as Supabase client adds that automatically
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
if (supabaseUrl.endsWith('/rest/v1/')) {
  supabaseUrl = supabaseUrl.replace('/rest/v1/', '');
}

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY_HERE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
