// src/lib/dataAccess.ts

import { supabase } from "@/integrations/supabase/client";
import { MatchResult, Prediction, ScoringCriteria, PointsResult } from "./types"; // Certifique-se que Prediction é o tipo correto aqui.

/**
 * Busca o resultado da partida (de matches)
 */
export async function fetchMatchResult(matchId: string): Promise<MatchResult | null> {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('id, home_score, away_score')
      .eq('id', matchId)
      .eq('is_finished', true) // Garante que só busca partidas finalizadas
      .single();
    
    if (error || !data) {
      // PGRST116: no rows found - isso é normal se a partida não for encontrada ou não estiver finalizada
      if (error && error.code !== 'PGRST116') { 
        console.error('Erro ao buscar resultado da partida:', error);
      }
      return null;
    }
    
    return data as MatchResult;
  } catch (error) {
    console.error('Erro ao buscar resultado da partida:', error);
    return null;
  }
}

/**
 * Busca todos os palpites de PARTIDA para uma partida específica (de match_predictions)
 * ATENÇÃO: Confirme que o nome da tabela é 'match_predictions' no seu Supabase.
 */
export async function fetchPredictions(matchId: string): Promise<Prediction[]> {
  try {
    const { data, error } = await supabase
      .from('match_predictions') // <-- CONFIRME ESTE NOME DE TABELA!
      .select('id, user_id, match_id, home_score, away_score');
      // .eq('match_id', matchId); // Esta linha provavelmente deve estar aqui se você quer apenas palpites PARA ESTA partida.
                                // Se você está usando para `pointsCalculator.ts` que busca tudo, então o .eq('match_id', matchId) é essencial.
                                // Recomendo manter o .eq('match_id', matchId); aqui se esta função é chamada para uma única partida.
    
    if (error || !data) {
      console.error('Erro ao buscar palpites de partida:', error);
      return [];
    }
    
    return data as Prediction[];
  } catch (error) {
    console.error('Erro ao buscar palpites de partida:', error);
    return [];
  }
}

/**
 * Busca os critérios de pontuação do banco de dados (de scoring_criteria)
 */
export async function fetchScoringCriteria(): Promise<ScoringCriteria> {
  try {
    const { data, error } = await supabase
      .from('scoring_criteria')
      .select('name, points');
    
    if (error || !data) {
      console.error('Erro ao buscar critérios de pontuação:', error);
      // Retorna valores padrão em caso de erro para não quebrar a aplicação
      return { exactScore: 10, winner: 5, partialScore: 3 }; 
    }
    
    const criteria: ScoringCriteria = {
      exactScore: data.find(c => c.name === 'Placar exato')?.points || 10,
      winner: data.find(c => c.name === 'Acertar vencedor')?.points || 5,
      partialScore: data.find(c => c.name === 'Acertar um placar')?.points || 3,
    };
    
    return criteria;
  } catch (error) {
    console.error('Erro ao buscar critérios de pontuação:', error);
    // Retorna valores padrão em caso de erro
    return { exactScore: 10, winner: 5, partialScore: 3 }; 
  }
}

/**
 * Salva os pontos do usuário para um palpite individual no banco de dados (em user_points).
 */
export async function saveUserPoints(pointsResult: PointsResult): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_points') // <-- Confirme este nome de tabela
      .upsert({ // Usar upsert para atualizar se já existe, inserir se não
        user_id: pointsResult.userId,
        match_id: pointsResult.matchId,
        points: pointsResult.points,
        points_type: pointsResult.pointsType,
        prediction_id: pointsResult.predictionId,
      }, {
        onConflict: 'prediction_id', // O campo para evitar conflitos (ex: se já salvou os pontos para este palpite)
        ignoreDuplicates: false // Não ignorar se o conflito for com a chave primária
      });
    
    if (error) {
      console.error('Erro ao salvar ou atualizar pontos do palpite:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar ou atualizar pontos do palpite:', error);
    return false;
  }
}

// ---------------------------------------------------------------------
// FUNÇÃO updateOrCreateUserStats E SEUS TIPOS FORAM REMOVIDOS DESTE ARQUIVO.
// Esta função não é mais necessária, pois o ranking é calculado no frontend.
// Se você a tinha aqui, ela deve ser removida.
// ---------------------------------------------------------------------