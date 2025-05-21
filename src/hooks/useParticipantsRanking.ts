import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Importe as funções de cálculo de pontos
import {
  calculateMatchPoints,
  calculateGroupClassificationPoints,
  calculateTournamentFinalPoints,
  MatchPrediction as ScoringMatchPrediction, // Renomeado para evitar conflito com tipo Supabase
  MatchResult,
  TournamentFinalPredictions,
  TournamentFinalResults,
} from "@/lib/scoring"; 

// --- Definições de Tipo (do Supabase) ---
// Estes tipos refletem a estrutura dos dados que vêm diretamente do Supabase.
// Agora, cada tipo corresponde a uma tabela específica.

type SupabaseMatchPrediction = {
  id: string;
  user_id: string;
  match_id: string;
  home_score: number; // score do palpite
  away_score: number; // score do palpite
};

type SupabaseMatchResultFromMatches = {
  id: string; // id da partida
  home_score: number; // score real da partida
  away_score: number; // score real da partida
  is_finished: boolean; // para saber se a partida terminou e os resultados estão válidos
};

type SupabaseGroupPrediction = {
  id: string;
  user_id: string;
  group_id: string;
  predicted_first_team_id: string;
  predicted_second_team_id: string;
};

type SupabaseGroupResult = {
  id: string;
  group_id: string;
  first_place_team_id: string;
  second_place_team_id: string;
};

type SupabaseFinalPrediction = {
  id: string;
  user_id: string;
  champion_id: string;
  vice_champion_id: string;
  third_place_id: string;
  fourth_place_id: string;
  final_home_score: number;
  final_away_score: number;
};

type SupabaseFinalResult = {
  champion_id: string;
  vice_champion_id: string;
  third_place_id: string;
  fourth_place_id: string;
  final_home_score: number;
  final_away_score: number;
};

type User = {
  id: string;
  name: string;
  username: string; 
  avatar_url: string;
};

export type Participant = {
  id: string;
  name: string;
  username: string; 
  avatar_url: string;
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
        // Fetch all users
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, name, username, avatar_url');

        if (usersError) {
          throw usersError;
        }

        // Fetch all real match results
        const { data: realMatchResults, error: realMatchResultsError } = await supabase
          .from('matches')
          .select('id, home_score, away_score, is_finished')
          .eq('is_finished', true); 

        if (realMatchResultsError) {
          throw realMatchResultsError;
        }

        // Fetch all real group results
        const { data: realGroupResults, error: realGroupResultsError } = await supabase
          .from('group_results') 
          .select('id, group_id, first_place_team_id, second_place_team_id');

        if (realGroupResultsError) {
          throw realGroupResultsError;
        }

        // Fetch real final results 
        const { data: realFinalResults, error: realFinalResultsError } = await supabase
            .from('final_results') 
            .select('champion_id, vice_champion_id, third_place_id, fourth_place_id, final_home_score, final_away_score')
            .single(); 

        if (realFinalResultsError && realFinalResultsError.code !== 'PGRST116') {
            throw realFinalResultsError;
        }
        
        // Fetch all match predictions from Supabase
        const { data: allMatchPredictions, error: matchPredictionsError } = await supabase
          .from('match_predictions') 
          .select('id, user_id, match_id, home_score, away_score');

        if (matchPredictionsError) {
          throw matchPredictionsError;
        }

        // Fetch all group predictions from Supabase
        const { data: allGroupPredictions, error: groupPredictionsError } = await supabase
          .from('group_predictions') 
          .select('id, user_id, group_id, predicted_first_team_id, predicted_second_team_id');

        if (groupPredictionsError) {
          throw groupPredictionsError;
        }

        // Fetch all final predictions from Supabase
        const { data: allFinalPredictions, error: finalPredictionsError } = await supabase
          .from('final_predictions') 
          .select('id, user_id, champion_id, vice_champion_id, third_place_id, fourth_place_id, final_home_score, final_away_score');

        if (finalPredictionsError) {
          throw finalPredictionsError;
        }


        // Initialize user points and stats
        const userPoints: { [userId: string]: { points: number; matchesCount: number; correctMatches: number } } = {};
        users.forEach(user => {
          userPoints[user.id] = { points: 0, matchesCount: 0, correctMatches: 0 };
        });

        // Process all match predictions
        allMatchPredictions.forEach((prediction: SupabaseMatchPrediction) => {
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
            userPoints[prediction.user_id].points += points;
            userPoints[prediction.user_id].matchesCount++;

            if (points >= 10) { 
                userPoints[prediction.user_id].correctMatches++;
            }
          }
        });

        // Process all group predictions
        allGroupPredictions.forEach((prediction: SupabaseGroupPrediction) => {
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
            userPoints[prediction.user_id].points += points;
          }
        });

        // Process all final predictions
        if (realFinalResults) { // Só calcula pontos se houver resultados finais reais
            allFinalPredictions.forEach((prediction: SupabaseFinalPrediction) => {
                const userFinalPred: TournamentFinalPredictions = {
                    champion: prediction.champion_id,
                    runnerUp: prediction.vice_champion_id,
                    thirdPlace: prediction.third_place_id,
                    fourthPlace: prediction.fourth_place_id,
                    finalScore: {
                        homeGoals: prediction.final_home_score,
                        awayGoals: prediction.final_away_score,
                    },
                };
                const realTournamentResult: TournamentFinalResults = {
                    champion: realFinalResults.champion_id,
                    runnerUp: realFinalResults.vice_champion_id,
                    thirdPlace: realFinalResults.third_place_id,
                    fourthPlace: realFinalResults.fourth_place_id,
                    finalScore: {
                        homeGoals: realFinalResults.final_home_score,
                        awayGoals: realFinalResults.final_away_score,
                    },
                };

                const points = calculateTournamentFinalPoints(userFinalPred, realTournamentResult);
                userPoints[prediction.user_id].points += points;
            });
        }


        // Final ranking construction
        const finalRanking: Participant[] = users.map((user: User) => {
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
            points: userStats?.points || 0,
            matches: matchesCount,
            accuracy: `${accuracy}%`
          };
        });

        // Ordenar o ranking: primeiro por pontos (decrescente), depois por nome (crescente)
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