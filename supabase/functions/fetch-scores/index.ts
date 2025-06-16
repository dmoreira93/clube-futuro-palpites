// supabase/functions/fetch-scores/index.ts - VERSÃO CORRETA PARA API-FOOTBALL

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (_req) => {
  if (_req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('API_FOOTBALL_KEY');
    if (!apiKey) {
      throw new Error("A chave da API (API_FOOTBALL_KEY) não foi encontrada nos secrets.");
    }

    const today = new Date().toISOString().split('T')[0];
    // Você pode ajustar a liga (league=) e a temporada (season=) se necessário
    const apiUrl = `https://v3.football.api-sports.io/fixtures?date=${today}&league=1&season=2025`;

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

    return new Response(JSON.stringify(data.response || []), {
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