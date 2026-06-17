// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// 🔒 Segurança: Lendo as chaves das variáveis de ambiente em vez de expor no código
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 🛡️ Função global para vigiar TUDO que entra e sai do banco (Anti-Zumbi)
const fetchWithZombieKiller = async (url: string | URL | Request, options?: RequestInit) => {
  const response = await fetch(url, options);
  
  // Se o Supabase barrar por limite estourado (402) ou requisições demais (429)
  if (response.status === 402 || response.status === 429) {
    console.error('🚨 [ANTI-ZUMBI] Loop ou Bloqueio detectado! Destruindo cache...');
    localStorage.clear();
    sessionStorage.clear();
    
    // Mata o service worker (PWA) antigo que estiver preso
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }
    
    // Redireciona violentamente limpando a memória do app
    window.location.replace('/');
  }
  
  return response;
};

// 🚀 Criação do cliente com as suas configurações originais + a blindagem
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: fetchWithZombieKiller, // 💉 Vacina injetada aqui!
  }
});