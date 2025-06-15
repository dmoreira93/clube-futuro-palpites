// supabase/functions/fetch-scores/index.ts - VERSÃO CORRIGIDA PARA THESPORTSDB

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // A chave "123" para usuários gratuitos da TheSportsDB.
    // Se você fizer upgrade no futuro, pode salvar sua chave pessoal nos Secrets.
    const apiKey = Deno.env.get('API_FOOTBALL_KEY') || '123';

    // Formata a data para o padrão YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    // URL específica da TheSportsDB para buscar jogos do dia
    const apiUrl = `https://www.thesportsdb.com/api/v1/json/${apiKey}/eventsday.php?d=${today}`;

    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
    });

    if (!apiResponse.ok) {
      throw new Error(`Erro na chamada para a TheSportsDB: ${apiResponse.statusText}`);
    }

    const data = await apiResponse.json();

    // A TheSportsDB pode retornar um objeto com a propriedade `events: null` se não houver jogos.
    const events = data.events || [];

    return new Response(JSON.stringify(events), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});