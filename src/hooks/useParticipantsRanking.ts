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
  first_place_team_id: string; // Nome da coluna corrigido
  second_place_team_id: string; // Nome da coluna corrigido
};

type SupabaseFinalPrediction = {
  id: string;
  user_id: string;
  champion_id: string;
  runner_up_id: string;
  third_place_id: string;
  fourth_place_id: string;
  final_home_score: number;
  final_away_score: number;
};

type SupabaseFinalResult = {
  id: string;
  champion_id: string;
  runner_up_id: string;
  third_place_id: string;
  fourth_place_id: string;
  final_home_score: number;
  final_away_score: number;
};

// ALTERADO: Troquei 'nickname' por 'username' para refletir a coluna do seu BD
type UserData = {
  id: string;
  name: string;
  username: string; // <-- AQUI foi corrigido de nickname para username
  avatar_url?: string;
};

// Exportar o tipo Participant daqui para ser usado em RankingRow
export type Participant = {
  id: string;
  name: string;
  username: string; // <-- AQUI foi corrigido de nickname para username
  avatar_url?: string;
  points: number;
  matches: number;
  accuracy: string;
};

export const useParticipantsRanking = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndCalculateRanking = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Buscar todos os usuários (participantes)
        // ALTERADO: Selecionando 'username' ao invés de 'nickname'
        const { data: users, error: usersError } = await supabase
          .from('users_custom')
          .select('id, name, username, avatar_url'); // <-- AQUI
        if (usersError) throw usersError;
        if (!users) {
          setParticipants([]);
          setLoading(false);
          return;
        }

        // 2. Buscar TODOS os palpites de partidas (tabela 'predictions')
        const { data: allMatchPredictions, error: matchPredError } = await supabase
          .from('predictions')
          .select('*');
        if (matchPredError) throw matchPredError;
        console.log("All Match Predictions:", allMatchPredictions); // DEBUG

        // 3. Buscar TODOS os resultados de partidas da tabela 'matches'
        const { data: allMatchesWithResults, error: matchesError } = await supabase
          .from('matches')
          .select('id, home_score, away_score, is_finished');
        if (matchesError) throw matchesError;
        console.log("All Matches with Results:", allMatchesWithResults); // DEBUG

        // Filtrar apenas partidas finalizadas para cálculo de pontos
        const finishedMatchResults = allMatchesWithResults?.filter(m => m.is_finished) || [];
        console.log("Finished Match Results (for scoring):", finishedMatchResults); // DEBUG


        // 4. Buscar TODOS os palpites de grupos
        const { data: allGroupPredictions, error: groupPredError } = await supabase
          .from('group_predictions')
          .select('*');
        if (groupPredError) console.error("Erro ao buscar palpites de grupo:", groupPredError); // DEBUG

        // 5. Buscar TODOS os resultados de grupos (tabela 'groups_results', colunas corrigidas)
        const { data: allGroupResults, error: groupResultError } = await supabase
          .from('groups_results')
          .select('id, group_id, first_place_team_id, second_place_team_id');
        if (groupResultError) console.error("Erro ao buscar resultados de grupo:", groupResultError); // DEBUG

        // 6. Buscar TODOS os palpites finais
        const { data: allFinalPredictions, error: finalPredError } = await supabase
          .from('final_predictions')
          .select('*');
        if (finalPredError) console.error("Erro ao buscar palpites finais:", finalPredError); // DEBUG

        // 7. Buscar o resultado final (tabela 'tournament_results', colunas corrigidas)
        const { data: tournamentResultsArray, error: finalResultError } = await supabase
          .from('tournament_results')
          .select('id, champion_id, runner_up_id, third_place_id, fourth_place_id, final_home_score, final_away_score');
        if (finalResultError) console.error("Erro ao buscar resultados do torneio:", finalResultError); // DEBUG
        const finalResults: SupabaseFinalResult | null = tournamentResultsArray && tournamentResultsArray.length > 0 ? tournamentResultsArray[0] : null;

        // 8. Buscar nomes de times (para mapeamento de IDs para nomes)
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select('id, name');
        if (teamsError) console.error("Erro ao buscar times:", teamsError); // DEBUG
        const teamMap = new Map(teams?.map(team => [team.id, team.name]));

        // --- LÓGICA DE CÁLCULO DE PONTOS POR USUÁRIO ---
        const userPoints: { [userId: string]: { points: number; matchesCount: number; correctMatches: number; } } = {};

        users.forEach(user => {
          userPoints[user.id] = { points: 0, matchesCount: 0, correctMatches: 0 };
        });

        // Pontuação de Partidas
        allMatchPredictions?.forEach(prediction => {
          const result = finishedMatchResults.find(m => m.id === prediction.match_id);
          if (result && userPoints[prediction.user_id]) {
            const userPred: ScoringMatchPrediction = {
              homeGoals: prediction.home_score,
              awayGoals: prediction.away_score
            };
            const realRes: MatchResult = {
              homeGoals: result.home_score,
              awayGoals: result.away_score
            };

            // DEPURANDO AQUI:
            console.log(`-- Processing Match: ${prediction.match_id} for User: ${prediction.user_id}`);
            console.log(`User Prediction: <span class="math-inline">\{userPred\.homeGoals\}x</span>{userPred.awayGoals}`);
            console.log(`Real Result: <span class="math-inline">\{realRes\.homeGoals\}x</span>{realRes.awayGoals}`);

            const pointsGained = calculateMatchPoints(userPred, realRes);
            console.log(`Points Gained: ${pointsGained}`); // <-- ESTE É O CONSOLE.LOG CHAVE

            userPoints[prediction.user_id].points += pointsGained;
            userPoints[prediction.user_id].matchesCount++;
            if (pointsGained > 0) {
              userPoints[prediction.user_id].correctMatches++;
            }
            console.log(`Current Total Points for User ${prediction.user_id}: ${userPoints[prediction.user_id].points}`); // DEBUG
          }
        });

        // Pontuação de Grupos
        allGroupPredictions?.forEach(prediction => {
          const result = allGroupResults?.find(r => r.group_id === prediction.group_id);
          if (result && userPoints[prediction.user_id]) {
            const userPredOrder = [
              teamMap.get(prediction.predicted_first_team_id) || '',
              teamMap.get(prediction.predicted_second_team_id) || ''
            ];
            const realOrder = [
              teamMap.get(result.first_place_team_id) || '',
              teamMap.get(result.second_place_team_id) || ''
            ];
            const groupPoints = calculateGroupClassificationPoints(userPredOrder, realOrder);
            userPoints[prediction.user_id].points += groupPoints;
            console.log(`Group Points Gained for User ${prediction.user_id}: ${groupPoints}. Total: ${userPoints[prediction.user_id].points}`); // DEBUG
          }
        });

        // Pontuação Final
        if (finalResults) {
          const realFinalRes: TournamentFinalResults = {
            champion: teamMap.get(finalResults.champion_id) || '',
            runnerUp: teamMap.get(finalResults.runner_up_id) || '',
            thirdPlace: teamMap.get(finalResults.third_place_id) || '',
            fourthPlace: teamMap.get(finalResults.fourth_place_id) || '',
            finalScore: {
              homeGoals: finalResults.final_home_score,
              awayGoals: finalResults.final_away_score
            }
          };

          allFinalPredictions?.forEach(prediction => {
            if (userPoints[prediction.user_id]) {
              const userFinalPred: TournamentFinalPredictions = {
                champion: teamMap.get(prediction.champion_id) || '',
                runnerUp: teamMap.get(prediction.runner_up_id) || '',
                thirdPlace: teamMap.get(prediction.third_place_id) || '',
                fourthPlace: teamMap.get(prediction.fourth_place_id) || '',
                finalScore: {
                  homeGoals: prediction.final_home_score,
                  awayGoals: prediction.final_away_score
                }
              };
              const finalPoints = calculateTournamentFinalPoints(userFinalPred, realFinalRes);
              userPoints[prediction.user_id].points += finalPoints;
              console.log(`Final Points Gained for User ${prediction.user_id}: ${finalPoints}. Total: ${userPoints[prediction.user_id].points}`); // DEBUG
            }
          });
        }

        // Construir o ranking final
        const finalRanking: Participant[] = users.map(user => {
          const userStats = userPoints[user.id];
          const matchesCount = userStats?.matchesCount || 0;
          const correctMatches = userStats?.correctMatches || 0;

          // Prevenindo divisão por zero
          const accuracy = matchesCount > 0 
            ? ((correctMatches / matchesCount) * 100).toFixed(0) // Arredonda para inteiro
            : "0";

          return {
            id: user.id,
            name: user.name,
            username: user.username, // <-- AGORA USANDO USERNAME
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
          return a.name.localeCompare(b.name); // Desempate por nome
        });

        setParticipants(finalRanking);
        console.log("Final Ranking Calculated:", finalRanking); // DEBUG

      } catch (err) {
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