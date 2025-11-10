// supabase/functions/update-all-scores/index.ts - VERSÃO FINAL COM LÓGICA DE MATCH CORRETA

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interface para os dados da API-Football
interface ApiFixture {
  fixture: { id: number; status: { short: string; }; };
  teams: {
    home: { id: number; };
    away: { id: number; };
  };
  score: { fulltime: { home: number | null; away: number | null; }; };
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
    
    // Otimização para rodar apenas em dias de jogos (lógica já implementada e correta)
    // ... (o bloco de verificação de data/hora continua aqui) ...

    // Busca os dados da API
    const { data: apiFixtures, error: invokeError } = await supabaseAdmin.functions.invoke('fetch-scores');
    if (invokeError) throw invokeError;
    if (!apiFixtures) throw new Error("Não foi possível obter os dados da API-Football.");
    
    // Filtra apenas os jogos finalizados
    const finishedFixtures: ApiFixture[] = (apiFixtures as ApiFixture[]).filter(f => f.fixture.status.short === 'FT');
    
    if (finishedFixtures.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum jogo finalizado para atualizar na API." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- LÓGICA DE MATCH E ATUALIZAÇÃO CORRIGIDA ---

    let updatedCount = 0;

    // 1. Busca nosso mapeamento de times: { api_id -> nosso_uuid }
    const { data: localTeams, error: teamsError } = await supabaseAdmin
      .from('teams')
      .select('id, api_football_id')
      .not('api_football_id', 'is', null);
      
    if (teamsError) throw teamsError;
    const apiIdToUuidMap = new Map(localTeams.map(t => [t.api_football_id, t.id]));

    // 2. Para cada jogo finalizado da API, processamos
    for (const apiFixture of finishedFixtures) {
      const homeScore = apiFixture.score.fulltime.home;
      const awayScore = apiFixture.score.fulltime.away;

      if (homeScore === null || awayScore === null) continue;

      // 3. Traduz os IDs da API para os nossos IDs internos (UUIDs)
      const homeTeamUuid = apiIdToUuidMap.get(apiFixture.teams.home.id);
      const awayTeamUuid = apiIdToUuidMap.get(apiFixture.teams.away.id);

      // Só continua se ambos os times estiverem mapeados no nosso sistema
      if (homeTeamUuid && awayTeamUuid) {
        // 4. Encontra a partida correspondente no nosso banco que ainda não foi finalizada
        const { data: localMatch } = await supabaseAdmin
          .from('matches')
          .select('id')
          .eq('home_team_id', homeTeamUuid)
          .eq('away_team_id', awayTeamUuid)
          .eq('is_finished', false)
          .single();
        
        if (localMatch) {
          // 5. Atualiza o placar e dispara o cálculo de pontos
          await supabaseAdmin.from('matches').update({
            home_score: homeScore,
            away_score: awayScore,
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
    const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});