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
 * Usado principalmente para calcular pontos de uma partida já jogada.
 */
export async function fetchPredictions(matchId: string): Promise<Prediction[]> {
  try {
    // Verifique se esta é a tabela correta para palpites individuais (ex: 'match_predictions')
    const { data, error } = await supabase
      .from('match_predictions') // <-- CORRIGIDO para 'match_predictions' se for a sua tabela de palpites
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
 * Assume que 'user_points' é a tabela onde os pontos são registrados.
 */
export async function saveUserPoints(pointsResult: PointsResult): Promise<boolean> {
  try {
    // Utilize upsert para evitar duplicatas e atualizar se já existir um registro para prediction_id
    const { data, error } = await supabase
      .from('user_points')
      .upsert(pointsResult, { onConflict: 'prediction_id' }); // Certifique-se que 'prediction_id' é uma coluna única ou chave primária

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
 * Esta função é tipicamente chamada após o cálculo e salvamento dos pontos de uma partida.
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
      .from('user_points') // Assumindo que user_points registra uma entrada para cada palpite pontuado
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (matchesCountError) {
      console.error('Erro ao contar partidas jogadas para estatísticas:', matchesCountError);
      return false;
    }

    // 3. Calcular porcentagem de acerto (exemplo: acertos exatos)
    // Adapte esta lógica conforme a sua definição de "accuracy_percentage"
    const { count: exactScoresCount, error: exactScoresError } = await supabase
      .from('user_points')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('points_type', 'EXACT_SCORE'); // Supondo que 'EXACT_SCORE' é um valor válido de PointsType

    if (exactScoresError) {
      console.error('Erro ao contar acertos exatos para estatísticas:', exactScoresError);
      return false;
    }

    const accuracyPercentage = matchesPlayedCount > 0
      ? Math.round(((exactScoresCount || 0) / matchesPlayedCount) * 100)
      : 0;

    // 4. Inserir ou atualizar na tabela 'user_stats'
    // Primeiro, tente buscar o registro existente
    const { data: existingStats, error: fetchStatsError } = await supabase
      .from('user_stats')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (fetchStatsError && fetchStatsError.code !== 'PGRST116') { // PGRST116 = No rows found
      console.error('Erro ao buscar estatísticas existentes para atualização:', fetchStatsError);
      return false;
    }

    if (existingStats) {
      // Se existe, atualiza
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
      // Se não existe, insere um novo
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
 */
export async function fetchMatchesForDate(dateString: string): Promise<SupabaseMatchResultFromMatches[] | null> {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*, home_team:home_team_id(*, group:group_id(name)), away_team:away_team_id(*, group:group_id(name))')
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
 * Usado para coletar todos os palpites para os jogos do dia.
 * @param matchIds Array de IDs de partida.
 */
export async function fetchMatchPredictionsForMatches(matchIds: string[]): Promise<SupabaseMatchPrediction[] | null> {
  try {
    if (matchIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('match_predictions') // Verifique se esta é a tabela correta para palpites de partidas
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
 * Usado para exibir a lista de participantes e seus palpites.
 */
export async function fetchUsersCustom(): Promise<User[] | null> {
  try {
    const { data, error } = await supabase
      .from('users_custom')
      .select('id, name, username, avatar_url, is_admin'); // <--- AQUI ESTÁ A MUDANÇA ESSENCIAL!

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