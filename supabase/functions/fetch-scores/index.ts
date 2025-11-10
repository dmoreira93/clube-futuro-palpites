// supabase/functions/fetch-scores/index.ts - VERSÃO COM VALIDAÇÃO DE ERRO NO JSON

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

    // --- VALIDAÇÃO ADICIONAL ADICIONADA AQUI ---
    // Verifica se o objeto de resposta contém um campo 'errors' com conteúdo
    if (data.errors && Object.keys(data.errors).length > 0) {
      // Se houver erros, lança uma exceção com a mensagem da API
      throw new Error(JSON.stringify(data.errors));
    }
    // --- FIM DA VALIDAÇÃO ---

    return new Response(JSON.stringify(data.response || []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});