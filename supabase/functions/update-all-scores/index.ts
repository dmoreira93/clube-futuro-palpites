// supabase/functions/update-all-scores/index.ts - VERSÃO COMPLETA E CORRIGIDA

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interface para os dados que esperamos da TheSportsDB
interface TheSportsDBEvent {
  idEvent: string;
  idHomeTeam: string;
  idAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strStatus: string; // Ex: "Match Finished"
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
    const startOfDay = new Date(today.setUTCHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setUTCHours(23, 59, 59, 999)).toISOString();

    const { data: activeMatchesToday, error: checkError } = await supabaseAdmin
      .from('matches')
      .select('id')
      .eq('is_finished', false)
      .gte('match_date', startOfDay)
      .lte('match_date', endOfDay);

    if (checkError) throw checkError;

    if (!activeMatchesToday || activeMatchesToday.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum jogo ativo para monitorar hoje. Pulando a chamada da API." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Se houver jogos, busca os dados da API externa
    const { data: apiEvents, error: invokeError } = await supabaseAdmin.functions.invoke('fetch-scores');
    if (invokeError) throw invokeError;
    if (!apiEvents) {
      throw new Error("Não foi possível obter os dados da TheSportsDB.");
    }
    
    // 3. Filtra apenas os jogos que já terminaram
    const finishedEvents: TheSportsDBEvent[] = (apiEvents as TheSportsDBEvent[]).filter(e => e.strStatus === 'Match Finished');
    
    if (finishedEvents.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum jogo finalizado para atualizar na API." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Lógica de atualização (agora completa)
    let updatedCount = 0;
    let pointsCalculatedCount = 0;

    for (const event of finishedEvents) {
      const homeScore = parseInt(event.intHomeScore, 10);
      const awayScore = parseInt(event.intAwayScore, 10);

      if (isNaN(homeScore) || isNaN(awayScore)) continue;

      // Encontra a partida no nosso banco de dados usando o ID da API que mapeamos na tabela 'teams'
      const { data: localMatch, error: matchError } = await supabaseAdmin
        .from('matches')
        .select('id')
        .eq('home_team_api_id', event.idHomeTeam) // Assumindo que você tem uma coluna para o ID da API do time da casa
        .eq('away_team_api_id', event.idAwayTeam) // E uma para o time visitante
        .eq('is_finished', false)
        .single();
        
      if (matchError || !localMatch) continue;
      
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