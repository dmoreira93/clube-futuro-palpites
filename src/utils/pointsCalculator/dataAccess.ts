// src/lib/dataAccess.ts

import { supabase } from "@/integrations/supabase/client";
import {
  MatchResult,
  Prediction, // Este tipo provavelmente será MatchPrediction
  ScoringCriteria,
  PointsResult,
  SupabaseMatchPrediction, // Já deve estar definido em useParticipantsRanking.ts ou types.ts
  SupabaseMatchResultFromMatches, // Já deve estar definido
  User, // Você provavelmente já tem um tipo User
  SupabaseTeam, // Se você tiver um tipo para times
} from "./types"; // Certifique-se de que esses tipos estão disponíveis

// --- Funções de Busca Existentes ---

/**
 * Busca o resultado da partida (apenas partidas finalizadas)
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
 */
export async function fetchPredictions(matchId: string): Promise<Prediction[]> {
  try {
    const { data, error } = await supabase
      .from('predictions') // <--- VERIFIQUE se esta é a tabela correta para palpites individuais
      .select('id, match_id, user_id, home_score, away_score')
      .eq('match_id', matchId);

    if (error || !data) {
      console.error('Erro ao buscar palpites para a partida (fetchPredictions):', error);
      return [];
    }

    return data as Prediction[];
  } catch (error) {
    console.error('Erro ao buscar palpites para a partida (fetchPredictions):', error);
    return [];
  }
}

/**
 * Busca os critérios de pontuação do banco de dados
 */
export async function fetchScoringCriteria(): Promise<ScoringCriteria | null> {
  try {
    const { data, error } = await supabase
      .from('scoring_criteria')
      .select('name, points')
      .order('name')
      .limit(3); // Supondo que você só precisa dos 3 principais critérios

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
 */
export async function saveUserPoints(pointsResult: PointsResult): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_points')
      .upsert(pointsResult, { onConflict: 'prediction_id' }); // Supondo que você queira atualizar se o prediction_id já existe

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
 * Esta função deve ser chamada após calcular e salvar os pontos de uma partida.
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

    // 2. Contar partidas jogadas (onde o usuário fez palpite e a partida foi pontuada)
    const { count: matchesPlayedCount, error: matchesCountError } = await supabase
      .from('user_points') // Assumindo que user_points registra uma entrada para cada palpite pontuado
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
      .eq('points_type', 'EXACT_SCORE'); // Supondo que 'EXACT_SCORE' é um PointsType

    if (exactScoresError) {
      console.error('Erro ao contar acertos exatos para estatísticas:', exactScoresError);
      return false;
    }

    const accuracyPercentage = matchesPlayedCount > 0
      ? Math.round((exactScoresCount || 0) / matchesPlayedCount * 100)
      : 0;

    // 4. Atualizar ou inserir na tabela 'user_stats'
    const { data: existingStats, error: fetchStatsError } = await supabase
      .from('user_stats')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (fetchStatsError && fetchStatsError.code !== 'PGRST116') { // PGRST116 = No rows found
      console.error('Erro ao buscar estatísticas existentes:', fetchStatsError);
      return false;
    }

    if (existingStats) {
      // Atualizar
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
      // Inserir
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


// --- NOVAS FUNÇÕES PARA PALPITES DO DIA ---

/**
 * Busca todas as partidas para uma data específica.
 * @param dateString Uma string de data no formato 'YYYY-MM-DD'.
 */
export async function fetchMatchesForDate(dateString: string): Promise<SupabaseMatchResultFromMatches[] | null> {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*, home_team:home_team_id(*), away_team:away_team_id(*)')
      .gte('match_date', `${dateString}T00:00:00Z`)
      .lte('match_date', `${dateString}T23:59:59Z`)
      .order('match_date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar partidas para a data:', error);
      return null;
    }

    return data as SupabaseMatchResultFromMatches[];
  } catch (error) {
    console.error('Erro ao buscar partidas para a data:', error);
    return null;
  }
}

/**
 * Busca todos os palpites para um array de IDs de partida.
 * @param matchIds Array de IDs de partida.
 */
export async function fetchMatchPredictionsForMatches(matchIds: string[]): Promise<SupabaseMatchPrediction[] | null> {
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
      return null;
    }

    return data as SupabaseMatchPrediction[];
  } catch (error) {
    console.error('Erro ao buscar palpites para partidas:', error);
    return null;
  }
}

/**
 * Busca todos os usuários customizados.
 */
export async function fetchUsersCustom(): Promise<User[] | null> {
  try {
    const { data, error } = await supabase
      .from('users_custom')
      .select('id, name, username, avatar_url');

    if (error) {
      console.error('Erro ao buscar usuários customizados:', error);
      return null;
    }

    return data as User[];
  } catch (error) {
    console.error('Erro ao buscar usuários customizados:', error);
    return null;
  }
}