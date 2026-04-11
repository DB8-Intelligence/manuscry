import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

let _client: SupabaseClient | null = null;

if (url && key) {
  _client = createClient(url, key);
} else {
  console.warn('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — database operations will fail');
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_client) {
      throw new Error('Supabase not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    }
    return Reflect.get(_client, prop);
  },
});
