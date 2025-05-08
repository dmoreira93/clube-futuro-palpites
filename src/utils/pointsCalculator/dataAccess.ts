
import { supabase } from "@/integrations/supabase/client";
import { MatchResult, Prediction, ScoringCriteria, PointsResult } from "./types";

/**
 * Busca o resultado da partida
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
 * Busca todos os palpites para uma partida
 */
export async function fetchPredictions(matchId: string): Promise<Prediction[]> {
  try {
    const { data, error } = await supabase
      .from('predictions')
      .select('id, match_id, user_id, home_score, away_score')
      .eq('match_id', matchId);
    
    if (error || !data) {
      console.error('Erro ao buscar palpites:', error);
      return [];
    }
    
    return data as Prediction[];
  } catch (error) {
    console.error('Erro ao buscar palpites:', error);
    return [];
  }
}

/**
 * Busca os critérios de pontuação do banco de dados
 */
export async function fetchScoringCriteria(): Promise<{
  exactScore: number;
  winner: number;
  partialScore: number;
}> {
  try {
    const { data, error } = await supabase
      .from('scoring_criteria')
      .select('name, points');
    
    if (error) {
      console.error('Erro ao buscar critérios de pontuação:', error);
      // Valores padrão
      return { exactScore: 10, winner: 7, partialScore: 2 };
    }
    
    if (!data || data.length === 0) {
      console.warn('Nenhum critério de pontuação encontrado, usando valores padrão');
      return { exactScore: 10, winner: 7, partialScore: 2 };
    }
    
    // Log para debug
    console.log('Critérios de pontuação encontrados:', data);
    
    const exactScoreCriteria = data.find(c => c.name === 'exact_score');
    const winnerCriteria = data.find(c => c.name === 'correct_winner');
    const partialScoreCriteria = data.find(c => c.name === 'partial_score');
    
    // Verificar se todos os critérios foram encontrados
    if (!exactScoreCriteria || !winnerCriteria || !partialScoreCriteria) {
      console.warn('Alguns critérios de pontuação não foram encontrados, usando valores padrão para os ausentes');
    }
    
    return {
      exactScore: exactScoreCriteria?.points || 10,
      winner: winnerCriteria?.points || 7,
      partialScore: partialScoreCriteria?.points || 2
    };
  } catch (error) {
    console.error('Erro ao buscar critérios de pontuação:', error);
    return { exactScore: 10, winner: 7, partialScore: 2 };
  }
}

/**
 * Salva os pontos calculados no banco de dados
 */
export async function saveUserPoints(pointsResult: PointsResult): Promise<boolean> {
  try {
    // Verificar se já existem pontos registrados para este usuário e partida
    const { data: existingPoints } = await supabase
      .from('user_points')
      .select('id')
      .eq('user_id', pointsResult.userId)
      .eq('match_id', pointsResult.matchId)
      .single();
    
    if (existingPoints) {
      // Atualizar pontos existentes
      const { error: updateError } = await supabase
        .from('user_points')
        .update({
          points: pointsResult.points,
          points_type: pointsResult.pointsType,
          prediction_id: pointsResult.predictionId,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPoints.id);
      
      if (updateError) {
        console.error('Erro ao atualizar pontos:', updateError);
        return false;
      }
    } else {
      // Inserir novos pontos
      const { error: insertError } = await supabase
        .from('user_points')
        .insert({
          user_id: pointsResult.userId,
          match_id: pointsResult.matchId,
          prediction_id: pointsResult.predictionId,
          points: pointsResult.points,
          points_type: pointsResult.pointsType
        });
      
      if (insertError) {
        console.error('Erro ao inserir pontos:', insertError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar pontos:', error);
    return false;
  }
}

/**
 * Atualiza as estatísticas do usuário
 */
export async function updateUserStats(userId: string): Promise<boolean> {
  try {
    // Buscar todos os pontos do usuário
    const { data: userPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('points, match_id')
      .eq('user_id', userId);
    
    if (pointsError) {
      console.error('Erro ao buscar pontos do usuário:', pointsError);
      return false;
    }
    
    // Calcular estatísticas
    const totalPoints = userPoints?.reduce((sum, point) => sum + (point.points || 0), 0) || 0;
    const uniqueMatches = new Set(userPoints?.map(point => point.match_id));
    const matchesPlayed = uniqueMatches.size;
    
    // Calcular aproveitamento (porcentagem de pontos obtidos em relação ao máximo possível)
    const maxPossiblePoints = matchesPlayed * 10; // Assumindo que 10 é a pontuação máxima por partida
    const accuracyPercentage = maxPossiblePoints > 0 
      ? Math.round((totalPoints / maxPossiblePoints) * 100)
      : 0;

    // Verificar se já existe um registro de estatísticas para este usuário
    const { data: existingStats } = await supabase
      .from('user_stats')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingStats) {
      // Atualizar estatísticas existentes
      const { error: updateError } = await supabase
        .from('user_stats')
        .update({
          total_points: totalPoints,
          matches_played: matchesPlayed,
          accuracy_percentage: accuracyPercentage,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingStats.id);
      
      if (updateError) {
        console.error('Erro ao atualizar estatísticas:', updateError);
        return false;
      }
    } else {
      // Inserir novas estatísticas
      const { error: insertError } = await supabase
        .from('user_stats')
        .insert({
          user_id: userId,
          total_points: totalPoints,
          matches_played: matchesPlayed,
          accuracy_percentage: accuracyPercentage
        });
      
      if (insertError) {
        console.error('Erro ao inserir estatísticas:', insertError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error);
    return false;
  }
}
