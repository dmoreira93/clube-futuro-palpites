// supabase/functions/fetch-scores/index.ts - VERSÃO CORRIGIDA PARA API-FOOTBALL

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
    const rapidApiKey = Deno.env.get('API_FOOTBALL_KEY');
    const rapidApiHost = 'api-football-v1.p.rapidapi.com'; // Host da API-Football na RapidAPI

    if (!rapidApiKey) {
      throw new Error('API_FOOTBALL_KEY não configurada nos Secrets do Supabase.');
    }

    // Formata a data para o padrão YYYY-MM-DD, que é o esperado pela API-Football
    const today = new Date().toISOString().split('T')[0];
    
    // URL específica da API-Football para buscar jogos do dia
    // Você pode adicionar um parâmetro 'timezone' se quiser resultados no seu fuso horário local
    // Ex: `&timezone=America/Sao_Paulo`
    const apiUrl = `https://api-football-v1.p.rapidapi.com/v3/fixtures?date=${today}`;

    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': rapidApiHost,
        'Content-Type': 'application/json', // Boa prática
      },
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`Erro na chamada para a API-Football: ${apiResponse.status} - ${errorText}`);
      throw new Error(`Erro na chamada para a API-Football: ${apiResponse.statusText}`);
    }

    const data = await apiResponse.json();

    // A API-Football retorna os resultados na propriedade `response`
    const fixtures = data.response || [];

    return new Response(JSON.stringify(fixtures), {
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