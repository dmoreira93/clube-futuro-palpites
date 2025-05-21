import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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

type User = { // Este tipo refere-se aos dados retornados da tabela users_custom
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
  matches: number; // Agora 'matches' representará 'jogos pontuados'
  accuracy: string; 
  premio: string | null; // Adicionado para o prêmio
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
        // Fetch all users from public.users_custom
        const { data: users, error: usersError } = await supabase
          .from('users_custom') // <-- ALTERADO AQUI PARA 'users_custom'
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
        const userPoints: { [userId: string]: { points: number; matchesCount: number; correctMatches: number; scoredGames: number } } = {}; // Adicionado 'scoredGames'
        users.forEach(user => {
          userPoints[user.id] = { points: 0, matchesCount: 0, correctMatches: 0, scoredGames: 0 }; // Inicializa scoredGames
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

            if (points > 0) { // Incrementa 'jogos pontuados' se ganhou QUALQUER ponto
                userPoints[prediction.user_id].scoredGames++;
            }
            if (points >= 10) { // Mantém a lógica de acerto exato para 'correctMatches'
                userPoints[prediction.user_id].correctMatches++;
            }
          }
        });

        // Process all group predictions
        allGroupPredictions.forEach((prediction: SupabaseGroupPrediction) => {
          const realGroup = realGroupResults.find(g => g.group_id === prediction.group_id);

          if (realGroup) {
            const points = calculateGroupClassificationPoints(
              [prediction.predicted_first_team_id, prediction.predicted_second_team_id], // Passa como array
              [realGroup.first_place_team_id, realGroup.second_place_team_id] // Passa como array
            );
            userPoints[prediction.user_id].points += points;
            if (points > 0) { // Incrementa 'jogos pontuados' se ganhou QUALQUER ponto
                userPoints[prediction.user_id].scoredGames++;
            }
          }
        });

        // Process all final predictions
        if (realFinalResults) { 
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
                        awayGoals: realFinalResults.final_away_score, // <-- CORRIGIDO AQUI!
                    },
                };

                const points = calculateTournamentFinalPoints(userFinalPred, realTournamentResult);
                userPoints[prediction.user_id].points += points;
                if (points > 0) { // Incrementa 'jogos pontuados' se ganhou QUALQUER ponto
                    userPoints[prediction.user_id].scoredGames++;
                }
            });
        }


        // Final ranking construction and sorting
        let finalRanking: Participant[] = users.map((user: User) => {
          const userStats = userPoints[user.id];
          const matchesCount = userStats?.matchesCount || 0; // Total de partidas com palpite
          const correctMatches = userStats?.correctMatches || 0; // Palpites de partida exatos (>=10 pontos)
          const scoredGames = userStats?.scoredGames || 0; // Total de jogos que geraram pontos (todos os tipos)

          const accuracy = matchesCount > 0 
            ? ((correctMatches / matchesCount) * 100).toFixed(0) 
            : "0";

          return {
            id: user.id,
            name: user.name,
            username: user.username,
            avatar_url: user.avatar_url,
            points: userStats?.points || 0,
            matches: scoredGames, // 'matches' agora representa 'jogos pontuados'
            accuracy: `${accuracy}%`,
            premio: null, // Inicializa como null
          };
        });

        // Ordenar o ranking: primeiro por pontos (decrescente), depois por nome (crescente)
        finalRanking.sort((a, b) => {
          if (b.points !== a.points) {
            return b.points - a.points;
          }
          return a.name.localeCompare(b.name); 
        });

        // Aplicar a lógica de prêmios após a ordenação
        const numParticipants = finalRanking.length;
        if (numParticipants > 0) {
            finalRanking[0].premio = '60%'; // Primeiro colocado
            if (numParticipants > 1) {
                finalRanking[1].premio = '25%'; // Segundo colocado
            }
            if (numParticipants > 2) {
                finalRanking[2].premio = '15%'; // Terceiro colocado
            }

            // Lógica para o último lugar:
            // Ele é o último se classificacao_asc = 1.
            // Para não sobrescrever os top 3, precisamos que haja mais de 3 participantes
            // Ou que a posição dele seja de fato > 3 (ex: 4o lugar em 4 pessoas).
            // A lógica de último lugar pode ser refinada, mas esta é uma boa base.
            const lastPlaceIndex = finalRanking.length - 1;
            // Verifica se o último lugar NÃO é um dos top 3 (por índice) e se há mais de 3 participantes
            // Ou se ele é o único ou o último em um grupo pequeno, e tem 0 pontos, e o primeiro tem pontos.
            if (numParticipants > 3 && finalRanking[lastPlaceIndex].points < finalRanking[2].points) {
                 finalRanking[lastPlaceIndex].premio = 'deve um café da manhã';
            } else if (numParticipants > 0 && finalRanking.length === 1 && finalRanking[0].points === 0) {
              // Caso de apenas 1 participante e ele não pontuou
              finalRanking[0].premio = 'deve um café da manhã';
            } else if (numParticipants > 0 && finalRanking.length === 2 && finalRanking[1].points === 0 && finalRanking[0].points > 0) {
              // Caso de 2 participantes, o segundo com 0 pontos e o primeiro com pontos
              finalRanking[1].premio = 'deve um café da manhã';
            } else if (numParticipants > 0 && finalRanking.length === 3 && finalRanking[2].points === 0 && finalRanking[0].points > 0 && finalRanking[1].points > 0) {
              // Caso de 3 participantes, o terceiro com 0 pontos e os primeiros com pontos
              finalRanking[2].premio = 'deve um café da manhã';
            }
        }

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