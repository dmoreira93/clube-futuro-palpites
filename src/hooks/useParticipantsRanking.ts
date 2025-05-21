// src/hooks/useParticipantsRanking.ts

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Importe as funções de cálculo de pontos
import {
  calculateMatchPoints,
  calculateGroupClassificationPoints,
  calculateTournamentFinalPoints,
  MatchPrediction as ScoringMatchPrediction,
  MatchResult,
  TournamentFinalPredictions,
  TournamentFinalResults,
} from "@/lib/scoring"; // Certifique-se que o caminho está correto!

// --- Definições de Tipo (do Supabase) ---
// Estes tipos refletem a estrutura dos dados que vêm diretamente do Supabase.
// Certifique-se de que os nomes das tabelas e colunas correspondem ao seu banco.

type SupabaseUserCustom = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  is_admin: boolean;
  total_points: number;
};

// ATUALIZADO: Tipos específicos para cada tabela de palpites
type SupabaseMatchPrediction = {
  id: string;
  user_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  created_at: string;
};

type SupabaseGroupPrediction = {
  id: string;
  user_id: string;
  group_id: string;
  predicted_first_team_id: string;
  predicted_second_team_id: string;
  created_at: string;
};

type SupabaseFinalPrediction = {
  id: string;
  user_id: string;
  champion_id: string;
  runner_up_id: string;
  third_place_id: string | null; // Pode ser null
  fourth_place_id: string | null; // Pode ser null
  final_home_score: number | null; // Pode ser null
  final_away_score: number | null; // Pode ser null
  created_at: string;
};

type SupabaseMatchResultFromMatches = {
  id: string; // id da partida
  home_score: number; // score real da partida
  away_score: number; // score real da partida
  is_finished: boolean; // para saber se a partida terminou e os resultados estão válidos
};

type SupabaseGroupResult = {
  id: string;
  group_id: string;
  first_place_team_id: string;
  second_place_team_id: string;
};

type SupabaseTournamentResult = {
  champion_id: string;
  runner_up_id: string;
  third_place_id: string | null;
  fourth_place_id: string | null;
  final_home_score: number | null;
  final_away_score: number | null;
};

// Tipo de usuário que será usado internamente no hook após o fetch
type UserForRanking = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  is_admin: boolean;
  total_points: number;
};

export type Participant = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  points: number;
  matches: number;
  accuracy: string;
};

const useParticipantsRanking = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndCalculateRanking = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all non-admin users from 'users_custom' table
        const { data: users, error: usersError } = await supabase
          .from('users_custom')
          .select('id, name, username, avatar_url, is_admin, total_points')
          .eq('is_admin', false);

        if (usersError) {
          throw usersError;
        }

        // Fetch all real match results
        const { data: realMatchResults, error: realMatchResultsError } = await supabase
          .from('matches')
          .select('id, home_score, away_score, is_finished')
          .eq('is_finished', true); // Only calculate points for finished matches

        if (realMatchResultsError) {
          throw realMatchResultsError;
        }

        // Fetch all real group results
        const { data: realGroupResults, error: realGroupResultsError } = await supabase
          .from('groups_results')
          .select('id, group_id, first_place_team_id, second_place_team_id');

        if (realGroupResultsError) {
          throw realGroupResultsError;
        }

        // Fetch real tournament final results from 'tournament_results'
        const { data: realTournamentResults, error: realTournamentResultsError } = await supabase
            .from('tournament_results')
            .select('champion_id, runner_up_id, third_place_id, fourth_place_id, final_home_score, final_away_score')
            .single();

        if (realTournamentResultsError && realTournamentResultsError.code !== 'PGRST116') { // PGRST116 é "no rows found"
            throw realTournamentResultsError;
        }
        
        // --- ATUALIZADO AQUI: Fetch de cada tabela de palpites separadamente ---
        const { data: matchPredictionsData, error: matchPredictionsError } = await supabase
          .from('match_predictions')
          .select('id, user_id, match_id, home_score, away_score');

        if (matchPredictionsError) throw matchPredictionsError;

        const { data: groupPredictionsData, error: groupPredictionsError } = await supabase
          .from('group_predictions')
          .select('id, user_id, group_id, predicted_first_team_id, predicted_second_team_id');
        
        if (groupPredictionsError) throw groupPredictionsError;

        const { data: finalPredictionsData, error: finalPredictionsError } = await supabase
          .from('final_predictions')
          .select('id, user_id, champion_id, runner_up_id, third_place_id, fourth_place_id, final_home_score, final_away_score');

        if (finalPredictionsError) throw finalPredictionsError;
        // --- FIM DA ATUALIZAÇÃO DO FETCH ---

        // Initialize user points and stats for non-admin users
        const userPoints: { [userId: string]: { points: number; matchesCount: number; correctMatches: number } } = {};
        users.forEach((user: SupabaseUserCustom) => {
          if (!user.is_admin) {
             userPoints[user.id] = { 
               points: user.total_points, 
               matchesCount: 0, 
               correctMatches: 0 
             };
          }
        });

        // Process match predictions
        matchPredictionsData.forEach((prediction: SupabaseMatchPrediction) => { // Usando matchPredictionsData
          const realMatch = realMatchResults.find(m => m.id === prediction.match_id);

          if (realMatch && realMatch.is_finished) {
            const userPrediction: ScoringMatchPrediction = {
              homeGoals: prediction.home_score,
              awayGoals: prediction.away_score,
            };
            const realResult: MatchResult = {
              homeGoals: realMatch.home_score,
              awayGoals: realMatch.away_score,
            };

            const points = calculateMatchPoints(userPrediction, realResult);
            if (userPoints[prediction.user_id]) {
                // userPoints[prediction.user_id].points += points; // total_points é a fonte da verdade
                userPoints[prediction.user_id].matchesCount++;

                if (points >= 10) { 
                    userPoints[prediction.user_id].correctMatches++;
                }
            }
          }
        });

        // Process group predictions
        groupPredictionsData.forEach((prediction: SupabaseGroupPrediction) => { // Usando groupPredictionsData
          const realGroup = realGroupResults.find(g => g.group_id === prediction.group_id);

          if (realGroup) {
            const points = calculateGroupClassificationPoints(
              {
                firstPlace: prediction.predicted_first_team_id,
                secondPlace: prediction.predicted_second_team_id,
              },
              {
                firstPlace: realGroup.first_place_team_id,
                secondPlace: realGroup.second_place_team_id,
              }
            );
            if (userPoints[prediction.user_id]) {
                // userPoints[prediction.user_id].points += points; // total_points é a fonte da verdade
            }
          }
        });

        // Process final predictions
        if (realTournamentResults) {
            finalPredictionsData.forEach((prediction: SupabaseFinalPrediction) => { // Usando finalPredictionsData
                const userFinalPred: TournamentFinalPredictions = {
                    champion: prediction.champion_id,
                    runnerUp: prediction.runner_up_id,
                    thirdPlace: prediction.third_place_id,
                    fourthPlace: prediction.fourth_place_id,
                    finalScore: {
                        homeGoals: prediction.final_home_score,
                        awayGoals: prediction.final_away_score,
                    },
                };
                const realResult: TournamentFinalResults = {
                    champion: realTournamentResults.champion_id,
                    runnerUp: realTournamentResults.runner_up_id,
                    thirdPlace: realTournamentResults.third_place_id,
                    fourthPlace: realTournamentResults.fourth_place_id,
                    finalScore: {
                        homeGoals: realTournamentResults.final_home_score,
                        awayGoals: realTournamentResults.final_away_score,
                    },
                };

                const points = calculateTournamentFinalPoints(userFinalPred, realResult);
                if (userPoints[prediction.user_id]) {
                    // userPoints[prediction.user_id].points += points; // total_points é a fonte da verdade
                }
            });
        }

        // Final ranking construction
        const finalRanking: Participant[] = users.map((user: UserForRanking) => {
          const userStats = userPoints[user.id]; 

          const matchesCount = userStats?.matchesCount || 0;
          const correctMatches = userStats?.correctMatches || 0;

          const accuracy = matchesCount > 0
            ? ((correctMatches / matchesCount) * 100).toFixed(0)
            : "0";

          return {
            id: user.id,
            name: user.name,
            username: user.username,
            avatar_url: user.avatar_url,
            points: user.total_points, 
            matches: matchesCount, 
            accuracy: `${accuracy}%`
          };
        });

        // Ordenar o ranking
        finalRanking.sort((a, b) => {
          if (b.points !== a.points) {
            return b.points - a.points;
          }
          return a.name.localeCompare(b.name); 
        });

        setParticipants(finalRanking);
        console.log("Final Ranking Calculated:", finalRanking); 

      } catch (err: any) {
        console.error("Erro ao carregar o ranking:", err);
        setError("Não foi possível carregar o ranking. Verifique os dados ou tente novamente mais tarde. Verifique sua conexão e os dados do Supabase.");
      } finally {
        setLoading(false);
      }
    };

    fetchAndCalculateRanking();
  }, []); 

  return { participants, loading, error };
};

export default useParticipantsRanking;