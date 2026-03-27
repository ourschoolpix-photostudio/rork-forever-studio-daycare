import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = 'https://bnirywkoktzfdwadnsdd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJuaXJ5d2tva3R6ZmR3YWRuc2RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5Nzg0MjIsImV4cCI6MjA3ODU1NDQyMn0.H5cQmL3Y7dcV1L6-TyVkEPmAxgeKivN7AQRBhJ9_brc';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Missing configuration!');
  throw new Error('Supabase URL and Anon Key are required');
}

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    console.log('[Supabase] Initializing client for platform:', Platform.OS);
    console.log('[Supabase] URL:', supabaseUrl);
    console.log('[Supabase] Key length:', supabaseAnonKey?.length);
    
    try {
      const options: any = {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          storage: undefined,
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'apikey': supabaseAnonKey,
          },
        },
      };

      if (Platform.OS === 'web') {
        console.log('[Supabase] Using native fetch for web');
        options.global.fetch = fetch.bind(globalThis);
      }

      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, options);
      console.log('[Supabase] Client initialized successfully');
    } catch (err) {
      console.error('[Supabase] Failed to initialize client:', err);
      throw err;
    }
  }
  return supabaseInstance;
};

export const supabase = getSupabaseClient();
