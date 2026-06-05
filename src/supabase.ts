import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Mock client se as chaves não estiverem configuradas
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : ({
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      },
      from: () => ({
        select: () => ({
          order: async () => ({ data: [], error: { message: "Supabase não configurado. Adicione as chaves em Environment Variables." } }),
          single: async () => ({ data: null, error: { message: "Supabase não configurado" } }),
          eq: () => ({ single: async () => ({ data: null, error: { message: "Supabase não configurado" } }) })
        }),
        insert: () => ({
          select: async () => ({ data: null, error: { message: "Supabase não configurado" } })
        }),
        update: () => ({
          eq: async () => ({ data: null, error: { message: "Supabase não configurado" } })
        }),
        upsert: () => ({
          select: async () => ({ data: null, error: { message: "Supabase não configurado" } })
        }),
        delete: () => ({
          eq: async () => ({ data: null, error: { message: "Supabase não configurado" } })
        }),
      })
    } as any);
