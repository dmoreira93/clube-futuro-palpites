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

    if (error) { // Removido !data, pois data pode ser [] e ainda ser válido
      console.error('Erro ao buscar critérios de pontuação:', error);
      return null;
    }

    // Se data for null ou [], garanta que os valores padrão são usados
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

// --- NOVAS FUNÇÕES PARA PALPITES DO DIA ---

/**
 * Busca todas as partidas para uma data específica.
 * @param dateString Uma string de data no formato 'YYYY-MM-DD'.
 */
export async function fetchMatchesForDate(dateString: string): Promise<SupabaseMatchResultFromMatches[] | null> {
  try {
    // Para buscar partidas do dia, precisamos filtrar pela data exata
    // Supabase permite funções de data no filtro
    const { data, error } = await supabase
      .from('matches')
      .select('*, home_team:home_team_id(*), away_team:away_team_id(*)') // Inclui dados dos times
      .gte('match_date', `${dateString}T00:00:00Z`) // Começo do dia
      .lte('match_date', `${dateString}T23:59:59Z`) // Fim do dia
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
      .from('match_predictions') // Usando o nome correto da tabela de palpites de partida
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
      .select('id, name, username, avatar_url'); // Selecione apenas as colunas que você precisa

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