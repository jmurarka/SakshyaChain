import { createClient } from '@supabase/supabase-js';
import { CONFIG } from './config.js';

let supabase = null;

try {
  if (CONFIG.SUPABASE_URL && CONFIG.SUPABASE_KEY) {
    supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
    console.log(`[Supabase] Initialized client for ${CONFIG.SUPABASE_URL}`);
  }
} catch (err) {
  console.warn('[Supabase] Could not initialize Supabase client:', err.message);
}

export { supabase };
