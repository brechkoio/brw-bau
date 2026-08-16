import { defineBoot } from '#q-app';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.QCLI_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.QCLI_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing QCLI_SUPABASE_URL / QCLI_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in your Supabase project credentials.',
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

declare module 'vue' {
  interface ComponentCustomProperties {
    $supabase: SupabaseClient;
  }
}

export default defineBoot(({ app }) => {
  app.config.globalProperties.$supabase = supabase;
});
