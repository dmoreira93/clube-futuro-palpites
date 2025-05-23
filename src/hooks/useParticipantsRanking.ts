// src/hooks/useParticipantsRanking.ts

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Importe as funções de cálculo de pontos e os tipos necessários
// Certifique-se de que o caminho para scoring.ts está correto.
import {
  calculateMatchPoints,
  calculateGroupClassificationPoints,
  calculateTournamentFinalPoints,
  MatchPrediction as ScoringMatchPrediction,
  MatchResult,
  TournamentFinalPredictions, // Tipo para os palpites finais do usuário
  TournamentFinalResults,    // Tipo para os resultados finais reais do torneio
} from "@/lib/scoring"; 

// --- Definições de Tipo (Refletem a estrutura do seu banco de dados Supabase) ---
// É crucial que estes tipos correspondam **exatamente** às colunas das suas tabelas.

type SupabaseUserCustom = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  is_admin: boolean;
  total_points: number; // Coluna para armazenar o total de pontos do usuário
};

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

// **CORRIGIDO:** Tipo específico para final_predictions com `vice_champion_id`
type SupabaseFinalPrediction = {
  id: string;
  user_id: string;
  champion_id: string;
  vice_champion_id: string; // <-- CORRIGIDO AQUI para corresponder ao DB
  third_place_id: string | null;
  fourth_place_id: string | null;
  final_home_score: number | null;
  final_away_score: number | null;
  created_at: string;
};

type SupabaseMatchResultFromMatches = {
  id: string; // id da partida
  home_score: number; // score real da partida
  away_score: number; // score real da partida
  is_finished: boolean; // para saber se a partida terminou e os resultados estão válidos
};

type SupabaseGroupResult = {
  id: string; // id do resultado do grupo
  group_id: string; // id do grupo
  first_place_team_id: string; // ID da equipe que ficou em 1º
  second_place_team_id: string; // ID da equipe que ficou em 2º
};

// **IMPORTANTE:** O nome da coluna para o vice-campeão em 'tournament_results'
// é 'runner_up_id'. Se você mudou no DB, ajuste aqui também.
type SupabaseTournamentResult = {
  champion_id: string;
  runner_up_id: string | null; // <-- Mantenha 'runner_up_id' aqui se tournament_results usa esse nome
  third_place_id: string | null;
  fourth_place_id: string | null;
  final_home_score: number | null;
  final_away_score: number | null;
};

// Tipo de usuário que será usado internamente no hook para o ranking
type UserForRanking = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  is_admin: boolean;
  total_points: number; // Coluna para armazenar o total de pontos do usuário
};

// Tipo do participante final que será exposto pelo hook
export type Participant = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  points: number; // Pontos do usuário (pegos de total_points)
  matches: number; // Número de palpites de partidas feitos pelo usuário
  accuracy: string; // Porcentagem de acerto nos palpites de partidas
};

const useParticipantsRanking = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log("DEBUG: useEffect Hook entered.");

  useEffect(() => {
    const fetchAndCalculateRanking = async () => {
      console.log("DEBUG: fetchAndCalculateRanking function started.");
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch todos os usuários não-administradores da tabela 'users_custom'
        const { data: users, error: usersError } = await supabase
          .from('users_custom')
          .select('id, name, username, avatar_url, is_admin, total_points')
          .eq('is_admin', false);

        if (usersError) {
          throw usersError;
        }
        console.log("DEBUG: Fetched users:", users); // <--- NOVO LOG

        // 2. Fetch todos os resultados reais de partidas finalizadas
        const { data: realMatchResults, error: realMatchResultsError } = await supabase
          .from('matches')
          .select('id, home_score, away_score, is_finished')
          .eq('is_finished', true); // Apenas partidas finalizadas para cálculo de pontos

        if (realMatchResultsError) {
          throw realMatchResultsError;
        }

        // 3. Fetch todos os resultados reais de classificação de grupos
        const { data: realGroupResults, error: realGroupResultsError } = await supabase
          .from('groups_results')
          .select('id, group_id, first_place_team_id, second_place_team_id');

        if (realGroupResultsError) {
          throw realGroupResultsError;
        }

        // 4. Fetch resultados finais do torneio de 'tournament_results'
        const { data: realTournamentResultsArray, error: realTournamentResultsError } = await supabase
            .from('tournament_results')
            .select('champion_id, runner_up_id, third_place_id, fourth_place_id, final_home_score, final_away_score');

        const realTournamentResults: SupabaseTournamentResult | null = 
          realTournamentResultsArray && realTournamentResultsArray.length > 0
            ? realTournamentResultsArray[0]
            : null;

        if (realTournamentResultsError) {
            console.error('Erro ao buscar resultados do torneio:', realTournamentResultsError);
            throw realTournamentResultsError; 
        }
        
        // --- 5. Fetch dos palpites dos usuários das TRES tabelas separadas ---

        // Palpites de Partidas
        const { data: matchPredictionsDataFetched, error: matchPredictionsError } = await supabase
          .from('match_predictions')
          .select('id, user_id, match_id, home_score, away_score');
        const matchPredictionsData = matchPredictionsDataFetched || []; // Garante que é um array
        if (matchPredictionsError) throw matchPredictionsError;

        // Palpites de Grupos
        const { data: groupPredictionsDataFetched, error: groupPredictionsError } = await supabase
          .from('group_predictions')
          .select('id, user_id, group_id, predicted_first_team_id, predicted_second_team_id');
        const groupPredictionsData = groupPredictionsDataFetched || []; // Garante que é um array
        if (groupPredictionsError) throw groupPredictionsError;

        // Palpites Finais
        const { data: finalPredictionsDataFetched, error: finalPredictionsError } = await supabase
          .from('final_predictions')
          .select('id, user_id, champion_id, vice_champion_id, third_place_id, fourth_place_id, final_home_score, final_away_score');
        const finalPredictionsData = finalPredictionsDataFetched || []; // Garante que é um array
        if (finalPredictionsError) throw finalPredictionsError;
        // --- FIM DO FETCH ---


        // 6. Inicializa pontos e estatísticas dos usuários (não-administradores)
        const userPoints: { [userId: string]: { points: number; matchesCount: number; correctMatches: number } } = {};
        console.log("DEBUG: Before users.forEach to initialize userPoints"); // <--- NOVO LOG
        users.forEach((user: SupabaseUserCustom) => {
          if (!user) { // Defensiva extra
              console.error("DEBUG: Found an undefined/null user in the users array. Skipping this user.");
              return; 
          }
          if (!user.is_admin) {
              userPoints[user.id] = { 
                points: user.total_points, 
                matchesCount: 0, 
                correctMatches: 0 
              };
          }
        });

        // 7. Processa palpites de partidas para calcular acurácia
        console.log("DEBUG: Before matchPredictionsData.forEach"); // <--- NOVO LOG
        matchPredictionsData.forEach((prediction: SupabaseMatchPrediction) => {
          console.log("DEBUG: Inside matchPredictionsData.forEach, Before realMatchResults.find for match ID:", prediction.match_id); // <--- NOVO LOG
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
                userPoints[prediction.user_id].matchesCount++;

                if (points >= 10) { 
                    userPoints[prediction.user_id].correctMatches++;
                }
            }
          }
        });

        // 8. Processa palpites de grupo
        console.log("DEBUG: Before groupPredictionsData.forEach"); // <--- NOVO LOG
        groupPredictionsData.forEach((prediction: SupabaseGroupPrediction) => {
          console.log("DEBUG: Inside groupPredictionsData.forEach, Before realGroupResults.find for group ID:", prediction.group_id); // <--- NOVO LOG
          const realGroup = realGroupResults.find(g => g.group_id === prediction.group_id);

          if (realGroup) {
            calculateGroupClassificationPoints( 
              {
                firstPlace: prediction.predicted_first_team_id,
                secondPlace: prediction.predicted_second_team_id,
              },
              {
                firstPlace: realGroup.first_place_team_id,
                secondPlace: realGroup.second_place_team_id,
              }
            );
          }
        });

        // 9. Processa palpites finais
        if (realTournamentResults) { 
            console.log("DEBUG: Before finalPredictionsData.forEach (realTournamentResults is not null)"); // <--- NOVO LOG
            finalPredictionsData.forEach((prediction: SupabaseFinalPrediction) => {
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

                calculateTournamentFinalPoints(userFinalPred, realResult); 
            });
        }

        // 10. Constrói o ranking final
        console.log("DEBUG: Before users.map to build finalRanking"); // <--- NOVO LOG
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

        // 11. Ordena o ranking por pontos (e nome em caso de empate)
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