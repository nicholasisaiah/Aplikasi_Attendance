import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

const isConfigured = 
  supabaseUrl && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://')) &&
  supabaseAnonKey && 
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

export const supabase = isConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;
export { isConfigured };
