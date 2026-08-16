import { defineBoot } from '#q-app';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env and fill in your Supabase project credentials.',
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabasePublishableKey);

declare module 'vue' {
  interface ComponentCustomProperties {
    $supabase: SupabaseClient;
  }
}

export default defineBoot(({ app }) => {
  app.config.globalProperties.$supabase = supabase;
});
