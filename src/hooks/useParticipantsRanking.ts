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

// Tipo para refletir a estrutura da tabela 'users_custom'
type SupabaseUserCustom = {
  id: string;
  name: string | null; // Pode ser null
  username: string | null; // Pode ser null
  avatar_url: string | null;
  is_admin: boolean; // Adicionado para filtrar admins
  total_points: number | null; // Pode ser null
};

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

// Tipo de usuário que será usado internamente no hook após o fetch
type UserForRanking = {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  total_points: number | null;
};

export type Participant = {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  points: number;
  matches: number;
  accuracy: string; // Percentual de acerto das partidas
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
          .eq('is_admin', false); // Filtra para NÃO incluir administradores

        if (usersError) {
          throw usersError;
        }

        // --- NOVO: Adicionado console.log para depuração ---
        console.log("Usuários retornados pelo Supabase (filtrado por is_admin=false):", users);
        // --- FIM NOVO ---

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
          .from('group_results') // Assumindo uma tabela 'group_results' com os resultados reais
          .select('id, group_id, first_place_team_id, second_place_team_id');

        if (realGroupResultsError) {
          throw realGroupResultsError;
        }

        // Fetch real final results (assuming a table for final results)
        const { data: realFinalResults, error: realFinalResultsError } = await supabase
            .from('final_results') // Assumindo uma tabela 'final_results' com o resultado real da copa
            .select('champion_id, vice_champion_id, third_place_id, fourth_place_id, final_home_score, final_away_score')
            .single(); // Esperamos apenas um resultado final

        if (realFinalResultsError && realFinalResultsError.code !== 'PGRST116') { // PGRST116 é "no rows found"
            throw realFinalResultsError;
        }
        
        // Fetch all predictions from Supabase (including match, group, and final predictions)
        const { data: allPredictions, error: allPredictionsError } = await supabase
          .from('predictions')
          .select('id, user_id, match_id, home_score, away_score, group_id, predicted_first_team_id, predicted_second_team_id, champion_id, vice_champion_id, third_place_id, fourth_place_id, final_home_score, final_away_score');

        if (allPredictionsError) {
          throw allPredictionsError;
        }

        // Initialize user points and stats for non-admin users
        const userPoints: { [userId: string]: { points: number; matchesCount: number; correctMatches: number } } = {};
        users.forEach((user: SupabaseUserCustom) => {
          if (!user.is_admin) { // Esta verificação é redundante devido ao .eq('is_admin', false), mas mantida para clareza
             userPoints[user.id] = { 
                points: user.total_points || 0, // Inicializa com os pontos totais do banco, ou 0 se NULL
                matchesCount: 0, 
                correctMatches: 0 
            };
          }
        });

        // Process all match predictions
        // Filtrar apenas os palpites de partida E que pertencem a usuários não-admin
        const matchPredictions = allPredictions.filter(p => 
            p.match_id !== null && p.home_score !== null && p.away_score !== null && userPoints[p.user_id]
        );

        matchPredictions.forEach((prediction: SupabaseMatchPrediction) => {
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

                if (points >= 10) { // Se acertou o placar exato (ou critério de maior pontuação), adiciona como correto
                    userPoints[prediction.user_id].correctMatches++;
                }
            }
          }
        });

        // Process all group predictions
        // Filtrar apenas os palpites de grupo E que pertencem a usuários não-admin
        const groupPredictions = allPredictions.filter(p => 
            p.group_id !== null && p.predicted_first_team_id !== null && p.predicted_second_team_id !== null && userPoints[p.user_id]
        );

        groupPredictions.forEach((prediction: SupabaseGroupPrediction) => {
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
            // Pontos já estão em user.total_points, não os adicionamos novamente aqui para evitar duplicação.
            // Esta lógica de cálculo serve apenas para 'matchesCount' e 'correctMatches'.
          }
        });

        // Process all final predictions
        // Filtrar apenas os palpites finais E que pertencem a usuários não-admin
        const finalPredictions = allPredictions.filter(p => 
            p.champion_id !== null && p.final_home_score !== null && userPoints[p.user_id]
        );

        if (realFinalResults) {
            finalPredictions.forEach((prediction: SupabaseFinalPrediction) => {
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
                // Pontos já estão em user.total_points, não os adicionamos novamente aqui.
            });
        }

        // Final ranking construction
        // Use a lista 'users' (já filtrada para não-admins) para construir o ranking
        const finalRanking: Participant[] = users.map((user: UserForRanking) => {
          const userStats = userPoints[user.id]; // Pega as estatísticas calculadas (matchesCount, correctMatches)

          // Garante que o nome e username não sejam nulos para exibição
          const userName = user.name || "Usuário sem nome";
          const userUsername = user.username || "sem-username";

          // Se por algum motivo um usuário de users_custom não teve palpites, garanta valores padrão
          const matchesCount = userStats?.matchesCount || 0;
          const correctMatches = userStats?.correctMatches || 0;

          const accuracy = matchesCount > 0
            ? ((correctMatches / matchesCount) * 100).toFixed(0) // Arredonda para inteiro
            : "0";

          return {
            id: user.id,
            name: userName, // Usa o nome corrigido para display
            username: userUsername, // Usa o username corrigido para display
            avatar_url: user.avatar_url,
            points: user.total_points || 0, // Usa total_points do banco, ou 0 se NULL
            matches: matchesCount, // Mantido para o cálculo de acurácia
            accuracy: `${accuracy}%` // Calculado com base nos palpites processados
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

      } catch (err: any) {
        console.error("Erro ao carregar o ranking:", err);
        setError("Não foi possível carregar o ranking. Verifique os dados ou tente novamente mais tarde. Verifique sua conexão e os dados do Supabase.");
      } finally {
        setLoading(false);
      }
    };

    fetchAndCalculateRanking();
  }, []); // Adicionado [] para garantir que useEffect roda apenas uma vez

  return { participants, loading, error };
};

export default useParticipantsRanking;