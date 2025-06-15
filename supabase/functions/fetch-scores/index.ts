// supabase/functions/fetch-scores/index.ts - VERSÃO CORRIGIDA PARA SPORTMONKS
// AJUSTE PARA O PARÂMETRO 'INCLUDE' DA V3 DA SPORTMONKS

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
    const apiKey = Deno.env.get('SPORTMONKS_API_KEY');

    if (!apiKey) {
      throw new Error('SPORTMONKS_API_KEY não configurada nos Secrets do Supabase.');
    }

    const today = new Date().toISOString().split('T')[0];
    
    // ATENÇÃO AQUI: Removendo 'include=scores,participants' pois não é um parâmetro válido para 'fixtures' na v3 ou tem outra forma de ser incluído.
    // Os dados essenciais (scores, teams) geralmente vêm diretamente no objeto do fixture na v3.
    // Se eles não vierem, você pode precisar de um 'include' mais genérico como 'related' ou 'odds' dependendo do seu plano.
    // Vamos começar sem o include, pois a maioria dos dados básicos já vem por padrão.
    const apiUrl = `https://api.sportmonks.com/v3/football/fixtures?api_token=${apiKey}&local_date=${today}`;
    // Se você ainda precisar de dados mais específicos (como escalações completas, etc.),
    // você precisará consultar a documentação da Sportmonks V3 para ver quais 'includes' são válidos para fixtures.
    // Por exemplo, alguns dados vêm em 'sportmonks.api.v3.football.fixtures.index.response.data.participants' diretamente.
    // E os scores em 'sportmonks.api.v3.football.fixtures.index.response.data.scores'.

    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(`Erro na chamada para a Sportmonks: ${apiResponse.status} - ${errorText}`);
    }

    const data = await apiResponse.json();

    const fixtures = data.data || [];

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