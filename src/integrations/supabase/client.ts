// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use as variáveis de ambiente, que são carregadas pelo Vite
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Adicione verificações básicas para garantir que as variáveis estão presentes
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error("Variáveis de ambiente SUPABASE_URL ou SUPABASE_ANON_KEY não estão configuradas!");
  // Você pode lançar um erro ou lidar com isso de outra forma, dependendo da sua necessidade
  // Para evitar erros de runtime, pode-se retornar um cliente mock ou null se necessário,
  // mas o ideal é garantir que as variáveis existam.
  throw new Error("Credenciais do Supabase ausentes. Verifique suas variáveis de ambiente.");
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});