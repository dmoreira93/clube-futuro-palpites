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
  TournamentFinalResults, // Importe o tipo TournamentFinalResults (ou o nome correto que você usa)
  SupabaseFinalPrediction, // Adicione este tipo se ele existir e for usado para final_predictions
  SupabaseGroupPrediction, // Adicione este tipo se ele existir e for usado para group_predictions
} from "./types"; // Certifique-se que o caminho para o seu 'types.ts' está correto

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
    const { data, error } = await supabase
      .from('match_predictions')
      .select('*, user_id');

    if (error) {
      console.error('Erro ao buscar palpites:', error);
      return []; // Retorna array vazio em caso de erro
    }

    return data as Prediction[];
  } catch (error) {
    console.error('Erro ao buscar palpites:', error);
    return []; // Retorna array vazio em caso de erro
  }
}

/**
 * Busca os critérios de pontuação.
 */
export async function fetchScoringCriteria(): Promise<ScoringCriteria[] | null> {
  try {
    const { data, error } = await supabase
      .from('scoring_criteria')
      .select('*');

    if (error) {
      console.error('Erro ao buscar critérios de pontuação:', error);
      return null;
    }

    return data as ScoringCriteria[];
  } catch (error) {
    console.error('Erro ao buscar critérios de pontuação:', error);
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
      .select('id, name, username, avatar_url, is_admin, total_points'); // Adicione 'total_points' se for usado

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

/**
 * Busca partidas para uma data específica.
 */
export async function fetchMatchesForDate(date: Date): Promise<SupabaseMatchResultFromMatches[] | null> {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('matches')
      .select('*, home_team:home_team_id(name, flag_url, group_id(name)), away_team:away_team_id(name, flag_url, group_id(name))')
      .gte('match_date', startOfDay.toISOString())
      .lte('match_date', endOfDay.toISOString())
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
 * **PARA DEPURACAO: REMOVER .single() e filtros, selecionar tudo.**
 * Busca os resultados reais do torneio (campeão, vice, etc.).
 */
export async function fetchTournamentResults(): Promise<TournamentFinalResults | null> {
  try {
    const { data, error } = await supabase
      .from('tournament_results')
      .select('*'); // Seleciona todas as colunas

    if (error) {
      console.error('Erro ao buscar resultados do torneio:', error);
      return null;
    }

    // Se 'data' for um array (já que removemos .single())
    // e você espera apenas UM resultado final para o torneio
    if (data && data.length > 0) {
      // Adicione um log para ver o que vem do Supabase
      console.log('Dados brutos de tournament_results:', data);
      return data[0] as TournamentFinalResults; // Pega o primeiro item do array
    }

    return null; // Retorna null se não houver dados
  } catch (error) {
    console.error('Erro no catch ao buscar resultados do torneio:', error);
    return null;
  }
}

/**
 * Busca os palpites finais de um usuário para o torneio.
 */
export async function fetchUserFinalPrediction(userId: string): Promise<SupabaseFinalPrediction | null> {
  try {
    const { data, error } = await supabase
      .from('final_predictions')
      .select('*, champion:champion_id(name, flag_url), vice_champion:vice_champion_id(name, flag_url), third_place:third_place_id(name, flag_url), fourth_place:fourth_place_id(name, flag_url)')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Erro ao buscar palpite final do usuário:', error);
      return null;
    }

    return data as SupabaseFinalPrediction;
  } catch (error) {
    console.error('Erro no catch ao buscar palpite final do usuário:', error);
    return null;
  }
}

/**
 * Busca os pontos de um usuário para uma partida específica.
 */
export async function fetchUserPoints(userId: string, matchId: string): Promise<PointsResult | null> {
  try {
    const { data, error } = await supabase
      .from('user_points')
      .select('*')
      .eq('user_id', userId)
      .eq('match_id', matchId)
      .single();

    if (error) {
      console.error('Erro ao buscar pontos do usuário:', error);
      return null;
    }

    return data as PointsResult;
  } catch (error) {
    console.error('Erro ao buscar pontos do usuário:', error);
    return null;
  }
}

/**
 * Busca os palpites de grupo de um usuário.
 */
export async function fetchUserGroupPredictions(userId: string): Promise<SupabaseGroupPrediction[] | null> {
  try {
    const { data, error } = await supabase
      .from('group_predictions')
      .select('*, group:group_id(name), predicted_first_team:predicted_first_team_id(name), predicted_second_team:predicted_second_team_id(name)')
      .eq('user_id', userId);

    if (error) {
      console.error('Erro ao buscar palpites de grupo do usuário:', error);
      return null; // Retorna null em caso de erro
    }

    return data as SupabaseGroupPrediction[];
  } catch (error) {
    console.error('Erro no catch ao buscar palpites de grupo do usuário:', error);
    return null;
  }
}
