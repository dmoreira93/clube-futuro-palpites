// supabase/functions/fetch-scores/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('API_FOOTBALL_KEY');
    if (!apiKey) {
      throw new Error("API_FOOTBALL_KEY não encontrada nos Secrets do Supabase.");
    }

    // Exemplo: buscando jogos do dia. Ajuste os parâmetros conforme necessário.
    const today = new Date().toISOString().split('T')[0];
    const apiUrl = `https://v3.football.api-sports.io/fixtures?date=${today}`;

    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-apisports-key': apiKey,
      },
    });

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      console.error("Erro da API-Football:", errorBody);
      throw new Error(`Erro na chamada para a API-Football: ${apiResponse.statusText}`);
    }

    const data = await apiResponse.json();

    return new Response(JSON.stringify(data), {
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