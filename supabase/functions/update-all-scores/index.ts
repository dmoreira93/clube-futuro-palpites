// supabase/functions/update-all-scores/index.ts - VERSÃO OTIMIZADA

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

// Interface para os dados que esperamos da API-Football
interface ApiFixture {
  fixture: {
    id: number;
    status: {
      short: string; // 'FT' para 'Full Time' (Finalizado)
    };
  };
  teams: {
    home: { id: number; name: string; };
    away: { id: number; name: string; };
  };
  score: {
    fulltime: {
      home: number | null;
      away: number | null;
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // --- VERIFICAÇÃO INICIAL ADICIONADA AQUI ---
    // 1. Verifica se há jogos para hoje que ainda não terminaram.
    const { data: activeMatchesToday, error: checkError } = await supabaseAdmin
      .from('matches')
      .select('id')
      .eq('is_finished', false)
      .eq('match_date', new Date().toISOString().split('T')[0]); // Compara apenas a data

    if (checkError) throw checkError;

    // 2. Se não houver jogos ativos para hoje, encerra a execução.
    if (!activeMatchesToday || activeMatchesToday.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum jogo ativo para monitorar hoje. Pulando a chamada da API." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // --- FIM DA VERIFICAÇÃO ---

    // 3. Se houver jogos, a função continua normalmente...
    const { data: fixturesResponse, error: invokeError } = await supabaseAdmin.functions.invoke('fetch-scores');
    if (invokeError) throw invokeError;
    if (!fixturesResponse || !fixturesResponse.response) {
      throw new Error("Não foi possível obter os dados da API-Football.");
    }

    const apiFixtures: ApiFixture[] = fixturesResponse.response;

    const finishedFixtures = apiFixtures.filter(f => f.fixture.status.short === 'FT');
    if (finishedFixtures.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum jogo finalizado para atualizar." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const apiFixtureIds = finishedFixtures.map(f => f.fixture.id);
    const { data: localMatches, error: dbError } = await supabaseAdmin
      .from('matches')
      .select('id, api_football_id')
      .in('api_football_id', apiFixtureIds)
      .eq('is_finished', false);

    if (dbError) throw dbError;
    
    let updatedCount = 0;
    let pointsCalculatedCount = 0;

    if (localMatches && localMatches.length > 0) {
      for (const localMatch of localMatches) {
        const correspondingApiFixture = finishedFixtures.find(f => f.fixture.id === localMatch.api_football_id);
        
        if (correspondingApiFixture && correspondingApiFixture.score.fulltime.home !== null) {
          const { error: updateError } = await supabaseAdmin
            .from('matches')
            .update({
              home_score: correspondingApiFixture.score.fulltime.home,
              away_score: correspondingApiFixture.score.fulltime.away,
              is_finished: true,
            })
            .eq('id', localMatch.id);

          if (updateError) {
            console.error(`Erro ao atualizar partida ${localMatch.id}:`, updateError.message);
          } else {
            updatedCount++;
            const { error: rpcError } = await supabaseAdmin.rpc('update_user_points_for_match', { match_id_param: localMatch.id });
            if (rpcError) {
                console.error(`Erro ao calcular pontos para a partida ${localMatch.id}:`, rpcError.message);
            } else {
                pointsCalculatedCount++;
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ message: `${updatedCount} partidas atualizadas e pontos para ${pointsCalculatedCount} partidas processados.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});