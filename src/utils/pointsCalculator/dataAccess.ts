// src/utils/pointsCalculator/dataAccess.ts

import { supabase } from "@/integrations/supabase/client";
import {
  MatchResult,
  Prediction,
  ScoringCriteria as PointsCalculatorScoringCriteria, // Renomeado para evitar conflito com o tipo local
  PointsResult,
  SupabaseMatchPrediction,
  SupabaseMatchResultFromMatches,
  User,
} from "./types";

// Renomeando o tipo local para evitar conflito com o tipo importado de ./types
// Este tipo ScoringCriteria é específico para a função fetchScoringCriteria
type LocalScoringCriteria = {
  exactScore: number;
  winner: number;
  partialScore: number;
};

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
      console.error('Erro ao buscar resultado da partida:', error?.message);
      return null;
    }

    return data as MatchResult;
  } catch (error: any) {
    console.error('Erro crítico ao buscar resultado da partida:', error.message);
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
      .from('match_predictions') // Corrigido para 'match_predictions' se for essa a tabela de palpites de partida
      .select('id, match_id, user_id, home_score, away_score')
      .eq('match_id', matchId);

    if (error || !data) {
      console.error('Erro ao buscar palpites para a partida (fetchPredictions):', error?.message);
      return [];
    }

    return data as Prediction[];
  } catch (error: any) {
    console.error('Erro crítico ao buscar palpites para a partida (fetchPredictions):', error.message);
    return [];
  }
}

/**
 * Busca os critérios de pontuação do banco de dados
 * Retorna um objeto com os pontos para cada critério ou null em caso de erro.
 */
export async function fetchScoringCriteria(): Promise<LocalScoringCriteria | null> {
  try {
    const { data, error } = await supabase
      .from('scoring_criteria')
      .select('name, points')
      .order('name'); // Ordenar para consistência, se necessário

    if (error) {
      console.error('Erro ao buscar critérios de pontuação:', error.message);
      return null;
    }

    // Assume que os nomes dos critérios no banco são 'Placar exato', 'Acertar vencedor', 'Acertar um placar'
    // Ajuste os nomes e valores default conforme sua tabela 'scoring_criteria'
    const criteria: LocalScoringCriteria = {
      exactScore: data?.find(c => c.name === 'Placar exato')?.points || 10,
      winner: data?.find(c => c.name === 'Acertar vencedor')?.points || 5, // Ajustado o default para 'Acertar vencedor'
      partialScore: data?.find(c => c.name === 'Acertar um placar')?.points || 3,
    };

    return criteria;
  } catch (error: any) {
    console.error('Erro crítico ao buscar critérios de pontuação:', error.message);
    return null;
  }
}

/**
 * Salva os pontos de um usuário para uma partida.
 * Retorna boolean, está correto.
 */
export async function saveUserPoints(pointsResult: PointsResult): Promise<boolean> {
  try {
    // Ajuste a coluna de conflito se 'prediction_id' não for a chave única correta.
    // Se a combinação de user_id e match_id for a chave, use ['user_id', 'match_id']
    // Certifique-se que pointsResult contém todos os campos necessários, incluindo user_id, match_id, etc.
    const { error } = await supabase
      .from('user_points')
      .upsert(pointsResult, { onConflict: 'user_id, match_id' }); // Assumindo que a constraint é em (user_id, match_id)

    if (error) {
      console.error('Erro ao salvar pontos do usuário:', error.message);
      return false;
    }
    return true;
  } catch (error: any) {
    console.error('Erro crítico ao salvar pontos do usuário:', error.message);
    return false;
  }
}

/**
 * Atualiza as estatísticas gerais de um usuário (total de pontos, partidas jogadas, etc.).
 * Esta função agora usa a stored procedure `update_user_stats_function`.
 */
export async function updateUserStats(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('update_user_stats_function', {
      user_id_param: userId,
    });

    if (error) {
      console.error(`Erro ao chamar RPC update_user_stats_function para ${userId}:`, error.message);
      return false;
    }
    console.log(`Estatísticas do usuário ${userId} atualizadas via RPC.`);
    return true;
  } catch (error: any) {
    console.error('Erro crítico ao atualizar estatísticas do usuário via RPC:', error.message);
    return false;
  }
}


/**
 * Busca todas as partidas para uma data específica (considerando o dia em UTC), incluindo dados dos times e do grupo.
 * @param dateString Uma string de data no formato 'YYYY-MM-DD'.
 * Esta função filtra pelo dia UTC.
 */
export async function fetchMatchesForDate(dateString: string): Promise<SupabaseMatchResultFromMatches[]> {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*, home_team:home_team_id(*, group:group_id(name)), away_team:away_team_id(*, group:group_id(name))')
      .gte('match_date', `${dateString}T00:00:00Z`) // Início do dia em UTC
      .lte('match_date', `${dateString}T23:59:59.999Z`) // Fim do dia em UTC
      .order('match_date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar partidas para a data (UTC day):', error.message);
      return [];
    }

    return data as SupabaseMatchResultFromMatches[];
  } catch (error: any) {
    console.error('Erro crítico ao buscar partidas para a data (UTC day):', error.message);
    return [];
  }
}


/**
 * Busca todas as partidas dentro de um intervalo UTC específico.
 * @param utcStartString String ISO da data/hora de início em UTC.
 * @param utcEndString String ISO da data/hora de fim em UTC (exclusivo).
 */
export async function fetchMatchesInUTCRange(utcStartString: string, utcEndString: string): Promise<SupabaseMatchResultFromMatches[]> {
  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*, home_team:home_team_id(*, group:group_id(name)), away_team:away_team_id(*, group:group_id(name))')
      .gte('match_date', utcStartString)
      .lt('match_date', utcEndString) // .lt para que o horário final seja exclusivo
      .order('match_date', { ascending: true });

    if (error) {
      console.error('Erro ao buscar partidas por range UTC:', error.message);
      return [];
    }

    return data as SupabaseMatchResultFromMatches[];
  } catch (error: any) {
    console.error('Erro crítico ao buscar partidas por range UTC:', error.message);
    return [];
  }
}


/**
 * Busca todos os palpites para um array de IDs de partida.
 * Usado para coletar todos os palpites para os jogos do dia.
 * @param matchIds Array de IDs de partida.
 */
export async function fetchMatchPredictionsForMatches(matchIds: string[]): Promise<SupabaseMatchPrediction[]> {
  try {
    if (matchIds.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('match_predictions') // Corrigido para 'match_predictions'
      .select('*') // Pode ser mais específico se não precisar de todos os campos
      .in('match_id', matchIds);

    if (error) {
      console.error('Erro ao buscar palpites para partidas:', error.message);
      return [];
    }

    return data as SupabaseMatchPrediction[];
  } catch (error: any) {
    console.error('Erro crítico ao buscar palpites para partidas:', error.message);
    return [];
  }
}

/**
 * Busca todos os usuários customizados.
 * Usado para exibir a lista de participantes e seus palpites.
 */
export async function fetchUsersCustom(): Promise<User[]> {
  try {
    const { data, error } = await supabase
      .from('users_custom')
      .select('id, name, username, avatar_url, is_admin'); // Certifique-se que 'is_admin' existe

    if (error) {
      console.error('Erro ao buscar usuários customizados:', error.message);
      return [];
    }

    return data as User[];
  } catch (error: any) {
    console.error('Erro crítico ao buscar usuários customizados:', error.message);
    return [];
  }
}