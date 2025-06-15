// supabase/functions/fetch-scores/index.ts - VERSÃO CORRIGIDA PARA SPORTMONKS

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
    // Obtenha sua chave da Sportmonks dos Secrets do Deno (Supabase)
    const apiKey = Deno.env.get('SPORTMONKS_API_KEY');

    if (!apiKey) {
      throw new Error('SPORTMONKS_API_KEY não configurada nos Secrets do Supabase.');
    }

    // Formata a data para o padrão YYYY-MM-DD (Sportmonks usa este formato)
    const today = new Date().toISOString().split('T')[0];
    
    // URL base da Sportmonks para futebol (pode variar ligeiramente dependendo do seu plano e versão da API)
    // Estamos buscando 'fixtures' (partidas) para uma data específica e incluindo 'scores' e 'participants'
    // 'local_date' é o parâmetro para filtrar por data
    // 'include' permite adicionar dados relacionados na mesma requisição
    const apiUrl = `https://api.sportmonks.com/v3/football/fixtures?api_token=${apiKey}&local_date=${today}&include=scores,participants`;

    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(`Erro na chamada para a Sportmonks: ${apiResponse.status} - ${errorText}`);
    }

    const data = await apiResponse.json();

    // A Sportmonks retorna um objeto com a propriedade `data` que contém o array de fixtures.
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