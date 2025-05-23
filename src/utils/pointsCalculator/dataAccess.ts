// src/utils/pointsCalculator/dataAccess.ts

import { supabase } from "@/integrations/supabase/client";
import {
  MatchResult,
  Prediction,
  ScoringCriteria,
  PointsResult,
  SupabaseMatchPrediction,
  SupabaseMatchResultFromMatches,
  User, // Certifique-se de que este tipo 'User' inclui 'is_admin: boolean'
} from "./types";

/**
 * Busca o resultado da partida (apenas partidas finalizadas)
 * Permanece retornando `null` pois é um item único.
 */
export async function fetchMatchResult(matchId: string): Promise<MatchResult | null> {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('id, home_score, away_score')
      .eq('id', matchId)
      .eq('is_finished', true)
      .single();

    if (error || !data) {
      console.error('Erro ao buscar resultado da partida:', error);
      return null;
    }

    return data as MatchResult;
  } catch (error) {
    console.error('Erro ao buscar resultado da partida:', error);
    return null;
  }
}

/**
 * Busca todos os palpites para UMA partida específica.
 * Já retornava `[]` em caso de erro, está correto.
 */
export async function fetchPredictions(matchId: string): Promise<Prediction[]> {
  try {
    const { data, error } = await supabase
      .from('match_predictions')
      .select('id, match_id, user_id, home_score, away_score')
      .eq('match_id', matchId);

    if (error || !data) {
      console.error('Erro ao buscar palpites para a partida (fetchPredictions):', error);
      return []; // Já estava correto
    }

    return data as Prediction[];
  } catch (error) {
    console.error('Erro ao buscar palpites para a partida (fetchPredictions):', error);
    return []; // Já estava correto
  }
}

/**
 * Busca os critérios de pontuação do banco de dados
 * Permanece retornando `null` pois é um objeto de critérios, não uma lista.
 */
export async function fetchScoringCriteria(): Promise<ScoringCriteria | null> {
  try {
    const { data, error } = await supabase
      .from('scoring_criteria')
      .select('name, points')
      .order('name')
      .limit(3);

    if (error) {
      console.error('Erro ao buscar critérios de pontuação:', error);
      return null;
    }

    const criteria: ScoringCriteria = {
      exactScore: data?.find(c => c.name === 'Placar exato')?.points || 10,
      winner: data?.find(c => c.name === 'Acertar vencedor')?.points || 5,
      partialScore: data?.find(c => c.name === 'Acertar um placar')?.points || 3,
    };

    return criteria;
  } catch (error) {
    console.error('Erro ao buscar critérios de pontuação:', error);
    return null;
  }
}

/**
 * Salva os pontos de um usuário para uma partida.
 * Retorna boolean, está correto.
 */
export async function saveUserPoints(pointsResult: PointsResult): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_points')
      .upsert(pointsResult, { onConflict: 'prediction_id' });

    if (error) {
      console.error('Erro ao salvar pontos do usuário:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Erro ao salvar pontos do usuário:', error);
    return false;
  }
}

/**
 * Atualiza as estatísticas gerais de um usuário (total de pontos, partidas jogadas, etc.).
 * Retorna boolean, está correto.
 */
export async function updateUserStats(userId: string): Promise<boolean> {
  try {
    // 1. Calcular o total de pontos
    const { data: userPointsData, error: pointsError } = await supabase
      .from('user_points')
      .select('points')
      .eq('user_id', userId);

    if (pointsError) {
      console.error('Erro ao buscar pontos do usuário para estatísticas:', pointsError);
      return false;
    }

    const totalPoints = userPointsData ? userPointsData.reduce((sum, current) => sum + current.points, 0) : 0;

    // 2. Contar partidas jogadas (onde o usuário fez palpite e foi pontuado)
    const { count: matchesPlayedCount, error: matchesCountError } = await supabase
      .from('user_points')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (matchesCountError) {
      console.error('Erro ao contar partidas jogadas para estatísticas:', matchesCountError);
      return false;
    }

    // 3. Calcular porcentagem de acerto (exemplo: acertos exatos)
    const { count: exactScoresCount, error: exactScoresError } = await supabase
      .from('user_points')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('points_type', 'EXACT_SCORE');

    if (exactScoresError) {
      console.error('Erro ao contar acertos exatos para estatísticas:', exactScoresError);
      return false;
    }

    const accuracyPercentage = matchesPlayedCount > 0
      ? Math.round(((exactScoresCount || 0) / matchesPlayedCount) * 100)
      : 0;

    // 4. Inserir ou atualizar na tabela 'user_stats'
    const { data: existingStats, error: fetchStatsError } = await supabase
      .from('user_stats')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (fetchStatsError && fetchStatsError.code !== 'PGRST116') {
      console.error('Erro ao buscar estatísticas existentes para atualização:', fetchStatsError);
      return false;
    }

    if (existingStats) {
      const { error: updateError } = await supabase
        .from('user_stats')
        .update({
          total_points: totalPoints,
          matches_played: matchesPlayedCount,
          accuracy_percentage: accuracyPercentage,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingStats.id);

      if (updateError) {
        console.error('Erro ao atualizar estatísticas do usuário:', updateError);
        return false;
      }
    } else {
      const { error: insertError } = await supabase
        .from('user_stats')
        .insert({
          user_id: userId,
          total_points: totalPoints,
          matches_played: matchesPlayedCount,
          accuracy_percentage: accuracyPercentage,
        });

      if (insertError) {
        console.error('Erro ao inserir estatísticas do usuário:', insertError);
        return false;
      }
    }
    return true;
  } catch (error) {
    console.error('Erro geral ao atualizar estatísticas do usuário:', error);
    return false;
  }
}

/**
 * Busca todas as partidas para uma data específica, incluindo dados dos timess e do grupo.
 * @param dateString Uma string de data no formato 'YYYY-MM-DD'.
 * Corrigido para retornar `[]` em caso de erro.
 */
export async function fetchMatchesForDate(dateString: string): Promise<SupabaseMatchResultFromMatches[]> { // Tipo de retorno alterado
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*, home_team:home_team_id(*, group:group_id(name)), away_team:away_team_id(*, group:group_id(name))')
      .gte('match_date', `${dateString}T00:00:00Z`)
      .lte('match_date', `${dateString}T23:59:59Z`)
      .order('match_date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar partidas para a data:', error);
      return []; // <-- CORRIGIDO
    }

    return data as SupabaseMatchResultFromMatches[];
  } catch (error) {
    console.error('Erro ao buscar partidas para a data:', error);
    return []; // <-- CORRIGIDO
  }
}

/**
 * Busca todos os palpites para um array de IDs de partida.
 * Usado para coletar todos os palpites para os jogos do dia.
 * @param matchIds Array de IDs de partida.
 * Corrigido para retornar `[]` em caso de erro.
 */
export async function fetchMatchPredictionsForMatches(matchIds: string[]): Promise<SupabaseMatchPrediction[]> { // Tipo de retorno alterado
  try {
    if (matchIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('match_predictions')
      .select('*')
      .in('match_id', matchIds);

    if (error) {
      console.error('Erro ao buscar palpites para partidas:', error);
      return []; // <-- CORRIGIDO
    }

    return data as SupabaseMatchPrediction[];
  } catch (error) {
    console.error('Erro ao buscar palpites para partidas:', error);
    return []; // <-- CORRIGIDO
  }
}

/**
 * Busca todos os usuários customizados.
 * Usado para exibir a lista de participantes e seus palpites.
 * Corrigido para retornar `[]` em caso de erro.
 */
export async function fetchUsersCustom(): Promise<User[]> { // Tipo de retorno alterado
  try {
    const { data, error } = await supabase
      .from('users_custom')
      .select('id, name, username, avatar_url, is_admin');

    if (error) {
      console.error('Erro ao buscar usuários customizados:', error);
      return []; // <-- CORRIGIDO
    }

    return data as User[];
  } catch (error) {
    console.error('Erro ao buscar usuários customizados:', error);
    return []; // <-- CORRIGIDO
  }
}