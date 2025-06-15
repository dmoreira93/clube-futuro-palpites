// supabase/functions/update-all-scores/index.ts - VERSÃO CORRIGIDA PARA SPORTMONKS

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interface para os dados que esperamos da Sportmonks (simplificado para o exemplo)
// A estrutura real da Sportmonks é mais complexa, mas vamos focar nos pontos chave
interface SportmonksFixture {
  id: number; // ID da partida na Sportmonks
  sport_id: number;
  league_id: number;
  season_id: number;
  // ... outros campos ...
  time: {
    status: string; // Ex: "FT", "HT", "LIVE", "NS" (Not Started)
    starting_at: {
      date_time: string; // Ex: "2025-06-15 15:00:00"
      date: string; // Ex: "2025-06-15"
      time: string; // Ex: "15:00:00"
    };
  };
  scores?: Array<{ // O array 'scores' pode conter diferentes tipos de placares (fulltime, halftime, etc.)
    score: {
      home: number;
      away: number;
    };
    description: string; // Ex: "Full Time"
    id: number;
    participant_id: number;
    type_id: number;
    fixture_id: number;
    // ... outros campos ...
  }>;
  participants?: Array<{ // Times envolvidos na partida
    id: number; // ID do time na Sportmonks
    name: string;
    // ... outros campos ...
    pivot: {
      fixture_id: number;
      participant_id: number;
      position_id: number; // 1 para casa, 2 para fora
      // ... outros campos ...
    };
  }>;
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
    // Sportmonks usa UTC para os dados, mas seu banco pode ter match_date em fuso horário local.
    // É importante garantir que a comparação de datas seja consistente.
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

    // 2. Se houver jogos, busca os dados da API externa (Sportmonks)
    const { data: apiFixtures, error: invokeError } = await supabaseAdmin.functions.invoke('fetch-scores');
    if (invokeError) throw invokeError;
    if (!apiFixtures) {
      throw new Error("Não foi possível obter os dados da Sportmonks.");
    }
    
    // 3. Filtra apenas os jogos que já terminaram (status 'FT' - Full Time)
    const finishedFixtures: SportmonksFixture[] = (apiFixtures as SportmonksFixture[]).filter(fixture => 
      fixture.time?.status === 'FT' && fixture.scores && fixture.scores.length > 0
    );
    
    if (finishedFixtures.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum jogo finalizado para atualizar na API Sportmonks." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Lógica de atualização
    let updatedCount = 0;
    let pointsCalculatedCount = 0;

    for (const fixture of finishedFixtures) {
      // Sportmonks pode ter múltiplos 'scores'. Busque o 'Full Time' score.
      const fullTimeScore = fixture.scores?.find(score => score.description === 'Full Time');

      if (!fullTimeScore) {
        console.warn(`Placar de tempo integral não encontrado para a partida Sportmonks ID: ${fixture.id}`);
        continue;
      }

      const homeScore = fullTimeScore.score.home;
      const awayScore = fullTimeScore.score.away;

      if (typeof homeScore !== 'number' || typeof awayScore !== 'number') {
        console.warn(`Placar inválido para a partida Sportmonks ID: ${fixture.id}`);
        continue;
      }

      // Mapeamento dos IDs dos times da Sportmonks para seus IDs no seu DB
      // Você precisa encontrar o ID da equipe da casa e visitante na resposta 'participants'
      const homeTeamIdSportmonks = fixture.participants?.find(p => p.pivot.position_id === 1)?.id; // position_id 1 = Home
      const awayTeamIdSportmonks = fixture.participants?.find(p => p.pivot.position_id === 2)?.id; // position_id 2 = Away

      if (!homeTeamIdSportmonks || !awayTeamIdSportmonks) {
        console.error(`IDs dos times da Sportmonks não encontrados para a partida: ${fixture.id}`);
        continue;
      }

      // Encontra a partida no nosso banco de dados usando os IDs da API dos times
      const { data: localMatch, error: matchError } = await supabaseAdmin
        .from('matches')
        .select('id')
        .eq('home_team_api_id', homeTeamIdSportmonks) // Coluna no seu DB para o ID do time da casa na API externa
        .eq('away_team_api_id', awayTeamIdSportmonks) // Coluna no seu DB para o ID do time visitante na API externa
        .eq('is_finished', false)
        .single();
        
      if (matchError || !localMatch) {
          // Se não encontrar o jogo ou já estiver finalizado no DB, pule
          if (matchError && matchError.code !== 'PGRST116') { // PGRST116 é "No rows found"
              console.error(`Erro ao buscar partida local com IDs Sportmonks (${homeTeamIdSportmonks}, ${awayTeamIdSportmonks}):`, matchError.message);
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

    return new Response(JSON.stringify({ message: `${updatedCount} partidas atualizadas e pontos para ${pointsCalculatedCount} partidas processados usando Sportmonks.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});