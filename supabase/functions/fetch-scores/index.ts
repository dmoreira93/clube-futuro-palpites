// supabase/functions/fetch-scores/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Cabeçalhos para permitir que seu site acesse esta função (CORS)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Em produção, troque '*' pela URL do seu site
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Trata a requisição OPTIONS (pré-voo do CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Pega a chave secreta da API-Football que salvamos no painel do Supabase
    const apiKey = Deno.env.get('API_FOOTBALL_KEY');
    if (!apiKey) {
      throw new Error("A chave da API (API_FOOTBALL_KEY) não foi encontrada nos secrets.");
    }

    // 2. Monta a chamada para a API-Football
    // Exemplo: buscando jogos do dia do Mundial de Clubes (league=1, season=2025)
    // Você deve ajustar os parâmetros conforme a documentação da API-Football.
    const today = new Date().toISOString().split('T')[0]; // Pega a data de hoje no formato YYYY-MM-DD
    const apiUrl = `https://v3.football.api-sports.io/fixtures?date=${today}&league=1&season=2025`;

    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-apisports-key': apiKey,
      },
    });

    if (!apiResponse.ok) {
      throw new Error(`Erro na API-Football: ${apiResponse.statusText}`);
    }

    const data = await apiResponse.json();

    // 3. Retorna os dados da API-Football como resposta da nossa função
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    // Em caso de erro, retorna uma mensagem de erro clara
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});