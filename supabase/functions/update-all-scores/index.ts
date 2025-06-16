// supabase/functions/update-all-scores/index.ts - VERSÃO CORRETA PARA API-FOOTBALL

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApiFixture {
  fixture: {
    id: number;
    status: {
      short: string; // 'FT' para 'Full Time' (Finalizado)
    };
  };
  score: {
    fulltime: {
      home: number | null;
      away: number | null;
    };
  };
}

serve(async (_req) => {
  if (_req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999)).toISOString();

    const { data: todaysGames, error: checkError } = await supabaseAdmin
      .from('matches')
      .select('match_date, is_finished')
      .gte('match_date', startOfDay)
      .lte('match_date', endOfDay);

    if (checkError) throw checkError;

    if (!todaysGames || todaysGames.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum jogo agendado para hoje. Encerrando." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const allGamesFinished = todaysGames.every(game => game.is_finished);
    if (allGamesFinished) {
      return new Response(JSON.stringify({ message: "Todos os jogos de hoje já foram finalizados. Encerrando." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const firstGameStartTime = new Date(Math.min(...todaysGames.map(game => new Date(game.match_date).getTime())));
    if (now < firstGameStartTime) {
      return new Response(JSON.stringify({ message: `Aguardando o início do primeiro jogo às ${firstGameStartTime.toLocaleTimeString('pt-BR')}. Encerrando.` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: apiFixtures, error: invokeError } = await supabaseAdmin.functions.invoke('fetch-scores');
    if (invokeError) throw invokeError;
    if (!apiFixtures) throw new Error("Não foi possível obter os dados da API-Football.");

    const finishedFixtures: ApiFixture[] = (apiFixtures as ApiFixture[]).filter(f => f.fixture.status.short === 'FT');
    
    if (finishedFixtures.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum jogo finalizado para atualizar na API." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    let updatedCount = 0;
    const apiFixtureIds = finishedFixtures.map(f => f.fixture.id);

    const { data: localMatches, error: dbError } = await supabaseAdmin
      .from('matches')
      .select('id, api_football_id')
      .in('api_football_id', apiFixtureIds)
      .eq('is_finished', false);

    if (dbError) throw dbError;

    if (localMatches && localMatches.length > 0) {
      for (const localMatch of localMatches) {
        const correspondingApiFixture = finishedFixtures.find(f => f.fixture.id === localMatch.api_football_id);
        
        if (correspondingApiFixture && correspondingApiFixture.score.fulltime.home !== null) {
          await supabaseAdmin.from('matches').update({
            home_score: correspondingApiFixture.score.fulltime.home,
            away_score: correspondingApiFixture.score.fulltime.away,
            is_finished: true,
          }).eq('id', localMatch.id);
          
          await supabaseAdmin.rpc('update_user_points_for_match', { match_id_param: localMatch.id });
          updatedCount++;
        }
      }
    }

    return new Response(JSON.stringify({ message: `${updatedCount} partidas atualizadas e pontuadas.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});