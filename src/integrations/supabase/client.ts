// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// --- ADICIONE ESTAS DUAS LINHAS ---
console.log("DEBUG: SUPABASE_URL lida no client.ts:", SUPABASE_URL);
console.log("DEBUG: SUPABASE_PUBLISHABLE_KEY lida no client.ts (primeiros 5 chars):", SUPABASE_PUBLISHABLE_KEY ? SUPABASE_PUBLISHABLE_KEY.substring(0, 5) + '...' : 'undefined/null');
// --- FIM DA ADIÇÃO ---

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error("Variáveis de ambiente SUPABASE_URL ou SUPABASE_ANON_KEY não estão configuradas!");
  throw new Error("Credenciais do Supabase ausentes. Verifique suas variáveis de ambiente.");
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});