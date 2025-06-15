// supabase/functions/update-all-scores/index.ts - VERSÃO COMPLETA E CORRIGIDA PARA API-FOOTBALL

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interface para os dados que esperamos da API-Football (simplificado)
interface ApiFootballFixture {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string; // ISO format date-time
    timestamp: number; // Unix timestamp
    periods: {
      first: number | null;
      second: number | null;
    };
    venue: {
      id: number | null;
      name: string | null;
      city: string | null;
    };
    status: {
      long: string; // Ex: "Match Finished", "Halftime", "Not Started"
      short: string; // Ex: "FT", "HT", "NS"
      elapsed: number | null;
    };
  };
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    round: string;
  };
  teams: {
    home: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
    away: {
      id: number;
      name: string;
      logo: string;
      winner: boolean | null;
    };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
  score: {
    halftime: {
      home: number | null;
      away: number | null;
    };
    fulltime: {
      home: number | null;
      away: number | null;
    };
    extratime: {
      home: number | null;
      away: number | null;
    };
    penalty: {
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

    // 1. Otimização: Verifica se há jogos para hoje que ainda não terminaram.
    const today = new Date();
    // Ajuste para o fuso horário de Maringá (-03) se 'match_date' for armazenado localmente
    const offsetMaringa = -3; // UTC-3
    const startOfDayMaringa = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0 - offsetMaringa, 0, 0, 0);
    const endOfDayMaringa = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23 - offsetMaringa, 59, 59, 999);

    const { data: activeMatchesToday, error: checkError } = await supabaseAdmin
      .from('matches')
      .select('id, home_team_api_id, away_team_api_id') // Selecione também os IDs da API para mapeamento
      .eq('is_finished', false)
      .gte('match_date', startOfDayMaringa.toISOString())
      .lte('match_date', endOfDayMaringa.toISOString());

    if (checkError) throw checkError;

    if (!activeMatchesToday || activeMatchesToday.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum jogo ativo para monitorar hoje. Pulando a chamada da API." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Se houver jogos, busca os dados da API externa (API-Football)
    const { data: apiFixtures, error: invokeError } = await supabaseAdmin.functions.invoke('fetch-scores');
    if (invokeError) throw invokeError;
    if (!apiFixtures) {
      throw new Error("Não foi possível obter os dados da API-Football.");
    }
    
    // 3. Filtra apenas os jogos que já terminaram (status 'FT' - Full Time)
    const finishedFixtures: ApiFootballFixture[] = (apiFixtures as ApiFootballFixture[]).filter(fixture => 
      fixture.fixture.status.short === 'FT' && 
      fixture.goals.home !== null && 
      fixture.goals.away !== null
    );
    
    if (finishedFixtures.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum jogo finalizado para atualizar na API-Football." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Lógica de atualização
    let updatedCount = 0;
    let pointsCalculatedCount = 0;

    for (const fixture of finishedFixtures) {
      const homeScore = fixture.goals.home;
      const awayScore = fixture.goals.away;

      if (homeScore === null || awayScore === null) {
        console.warn(`Placar nulo para a partida API-Football ID: ${fixture.fixture.id}`);
        continue;
      }

      // Mapeamento dos IDs dos times da API-Football para seus IDs no seu DB
      const homeTeamApiId = fixture.teams.home.id;
      const awayTeamApiId = fixture.teams.away.id;

      // Encontra a partida no nosso banco de dados usando os IDs da API dos times
      const { data: localMatch, error: matchError } = await supabaseAdmin
        .from('matches')
        .select('id')
        .eq('home_team_api_id', homeTeamApiId) // Coluna no seu DB para o ID do time da casa na API externa
        .eq('away_team_api_id', awayTeamApiId) // Coluna no seu DB para o ID do time visitante na API externa
        .eq('is_finished', false)
        .single();
        
      if (matchError || !localMatch) {
          // Se não encontrar o jogo ou já estiver finalizado no DB, pule
          if (matchError && matchError.code !== 'PGRST116') { // PGRST116 é "No rows found"
              console.error(`Erro ao buscar partida local com IDs API-Football (${homeTeamApiId}, ${awayTeamApiId}):`, matchError.message);
          }
          continue;
      }
      
      const { error: updateError } = await supabaseAdmin
        .from('matches')
        .update({
          home_score: homeScore,
          away_score: awayScore,
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

    return new Response(JSON.stringify({ message: `${updatedCount} partidas atualizadas e pontos para ${pointsCalculatedCount} partidas processados usando API-Football.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});