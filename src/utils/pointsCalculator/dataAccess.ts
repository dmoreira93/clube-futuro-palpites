// src/lib/dataAccess.ts (ATUALIZADO - Removida a função updateOrCreateUserStats)

import { supabase } from "@/integrations/supabase/client";
import { MatchResult, Prediction, ScoringCriteria, PointsResult } from "./types"; // Certifique-se que você ainda precisa de 'Prediction' aqui

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
      .from('predictions') // <--- Confirme se é 'predictions' ou 'match_predictions'
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
export async function fetchScoringCriteria(): Promise<ScoringCriteria> {
  try {
    const { data, error } = await supabase
      .from('scoring_criteria')
      .select('name, points');
    
    if (error || !data) {
      console.error('Erro ao buscar critérios de pontuação:', error);
      return { exactScore: 10, winner: 5, partialScore: 3 }; // Retorna valores padrão em caso de erro
    }
    
    const criteria: ScoringCriteria = {
      exactScore: data.find(c => c.name === 'Placar exato')?.points || 10,
      winner: data.find(c => c.name === 'Acertar vencedor')?.points || 5,
      partialScore: data.find(c => c.name === 'Acertar um placar')?.points || 3,
    };
    
    return criteria;
  } catch (error) {
    console.error('Erro ao buscar critérios de pontuação:', error);
    return { exactScore: 10, winner: 5, partialScore: 3 }; // Retorna valores padrão em caso de erro
  }
}

/**
 * Salva os pontos do usuário no banco de dados.
 */
export async function saveUserPoints(pointsResult: PointsResult): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_points')
      .insert({
        user_id: pointsResult.userId,
        match_id: pointsResult.matchId,
        points: pointsResult.points,
        points_type: pointsResult.pointsType,
        prediction_id: pointsResult.predictionId,
      });
    
    if (error) {
      console.error('Erro ao salvar pontos:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar pontos:', error);
    return false;
  }
}

// REMOVIDA A FUNÇÃO updateOrCreateUserStats AQUI
// Se você precisar que os pontos totais e estatísticas sejam armazenados no banco de dados,
// a lógica precisará ser refeita para acumular os pontos de TODOS os tipos de palpites (partidas, grupos, final)
// e não apenas os de 'user_points' (que parecem ser só de partidas).
// No entanto, para o funcionamento do ranking, isso não é mais necessário, pois o ranking é calculado no frontend.