import { createClient } from '@supabase/supabase-js';

// Strip any literal \n or actual newlines that can sneak in via CI env vars
const clean = (val) => (val || '').replace(/\\n/g, '').replace(/\n/g, '').trim();

const supabaseUrl = clean(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = clean(import.meta.env.VITE_SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentia