import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Mock client se as chaves não estiverem configuradas
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : ({
      from: () => ({
        select: () => ({
          order: async () => ({ data: [], error: { message: "Supabase não configurado. Adicione as chaves em Environment Variables." } })
        }),
        insert: () => ({
          select: async () => ({ data: null, error: { message: "Supabase não configurado" } })
        }),
        update: () => ({
          eq: async () => ({ data: null, error: { message: "Supabase não configurado" } })
        }),
        delete: () => ({
          eq: async () => ({ data: null, error: { message: "Supabase não configurado" } })
        }),
      })
    } as any);
