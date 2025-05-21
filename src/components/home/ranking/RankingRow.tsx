import React, { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AwardIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import RankingRow from "@/components/ranking/RankingRow"; // Seu componente RankingRow

// Importe as funções de cálculo de pontos
import {
  calculateMatchPoints,
  calculateGroupClassificationPoints,
  calculateTournamentFinalPoints,
  MatchPrediction as ScoringMatchPrediction, // Renomeado para evitar conflito de nome
  MatchResult,
  TournamentFinalPredictions,
  TournamentFinalResults,
} from "@/lib/scoring";

// --- Definições de Tipo (do Supabase) ---
// Estes tipos refletem a estrutura dos dados que vêm diretamente do Supabase.
// Certifique-se de que os nomes das tabelas e colunas correspondem ao seu banco.
type SupabaseMatchPrediction = {
  id: string;
  user_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
};

type SupabaseMatchResult = {
  id: string;
  match_id: string;
  home_score: number;
  away_score: number;
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
  first_team_id: string;
  second_team_id: string;
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

// Tipo para os dados dos usuários (participantes) vindos do Supabase
type UserData = {
  id: string;
  name: string;
  nickname: string;
  avatar_url?: string;
};

// Tipo final para o participante no ranking, que será passado para RankingRow
export type Participant = { // Exportado para ser usado em RankingRow
  id: string;
  name: string;
  nickname: string;
  avatar_url?: string;
  points: number;
  matches: number; // Total de jogos com palpites
  accuracy: string; // Exemplo de "acurácia"
};


const RankingPage = () => {
  const [ranking, setRanking] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndCalculateRanking = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Buscar todos os usuários (participantes)
        const { data: users, error: usersError } = await supabase
          .from('users_custom')
          .select('id, name, nickname, avatar_url');
        if (usersError) throw usersError;
        if (!users) {
          setRanking([]);
          setLoading(false);
          return;
        }

        // 2. Buscar TODOS os palpites de partidas
        const { data: allMatchPredictions, error: matchPredError } = await supabase
          .from('match_predictions')
          .select('*');
        if (matchPredError) throw matchPredError;

        // 3. Buscar TODOS os resultados de partidas
        // Certifique-se de que 'match_results' existe e tem 'match_id', 'home_score', 'away_score'
        const { data: allMatchResults, error: matchResultError } = await supabase
          .from('match_results')
          .select('*');
        if (matchResultError) throw matchResultError;

        // 4. Buscar TODOS os palpites de grupos
        const { data: allGroupPredictions, error: groupPredError } = await supabase
          .from('group_predictions')
          .select('*');
        if (groupPredError) throw groupPredError;

        // 5. Buscar TODOS os resultados de grupos
        // Certifique-se de que 'group_results' existe e tem 'group_id', 'first_team_id', 'second_team_id'
        const { data: allGroupResults, error: groupResultError } = await supabase
          .from('group_results')
          .select('*');
        if (groupResultError) throw groupResultError;

        // 6. Buscar TODOS os palpites finais
        const { data: allFinalPredictions, error: finalPredError } = await supabase
          .from('final_predictions')
          .select('*');
        if (finalPredError) throw finalPredError;

        // 7. Buscar o resultado final (Assumindo que há apenas um registro na tabela `final_results`)
        // Certifique-se de que 'final_results' existe e tem os IDs dos times e placar final
        const { data: finalResultsArray, error: finalResultError } = await supabase
          .from('final_results')
          .select('*');
        if (finalResultError) throw finalResultError;
        const finalResults: SupabaseFinalResult | null = finalResultsArray && finalResultsArray.length > 0 ? finalResultsArray[0] : null;

        // 8. Buscar nomes de times (para mapeamento de IDs para nomes)
        // Essencial para as funções de pontuação de grupo e final
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select('id, name');
        if (teamsError) throw teamsError;
        const teamMap = new Map(teams?.map(team => [team.id, team.name]));

        // 9. Buscar nomes de grupos (para mapeamento de IDs para nomes)
        const { data: groups, error: groupsError } = await supabase
          .from('groups')
          .select('id, name');
        if (groupsError) throw groupsError;
        // const groupMap = new Map(groups?.map(group => [group.id, group.name])); // Não usado diretamente no cálculo, mas pode ser útil para exibição

        // --- LÓGICA DE CÁLCULO DE PONTOS POR USUÁRIO ---
        const userPoints: { [userId: string]: { points: number; matchesCount: number; correctMatches: number; } } = {};

        // Inicializa os pontos para todos os usuários
        users.forEach(user => {
          userPoints[user.id] = { points: 0, matchesCount: 0, correctMatches: 0 };
        });

        // Pontuação de Partidas
        allMatchPredictions?.forEach(prediction => {
          const result = allMatchResults?.find(r => r.match_id === prediction.match_id);
          if (result && userPoints[prediction.user_id]) {
            const userPred: ScoringMatchPrediction = {
              homeGoals: prediction.home_score,
              awayGoals: prediction.away_score
            };
            const realRes: MatchResult = {
              homeGoals: result.home_score,
              awayGoals: result.away_score
            };
            userPoints[prediction.user_id].points += calculateMatchPoints(userPred, realRes);
            userPoints[prediction.user_id].matchesCount++;
            // Lógica simples para "correctMatches" (pode ser mais complexa dependendo da sua definição de acurácia)
            if (calculateMatchPoints(userPred, realRes) > 0) { // Se ganhou algum ponto, considera um "acerto"
              userPoints[prediction.user_id].correctMatches++;
            }
          }
        });

        // Pontuação de Grupos
        allGroupPredictions?.forEach(prediction => {
          const result = allGroupResults?.find(r => r.group_id === prediction.group_id);
          if (result && userPoints[prediction.user_id]) {
            const userPredOrder = [
              teamMap.get(prediction.predicted_first_team_id) || '', // Mapeia ID para nome
              teamMap.get(prediction.predicted_second_team_id) || '' // Mapeia ID para nome
            ];
            const realOrder = [
              teamMap.get(result.first_team_id) || '', // Mapeia ID para nome
              teamMap.get(result.second_team_id) || '' // Mapeia ID para nome
            ];
            userPoints[prediction.user_id].points += calculateGroupClassificationPoints(userPredOrder, realOrder);
          }
        });

        // Pontuação Final
        if (finalResults) { // Só calcula se houver resultados finais registrados
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
              userPoints[prediction.user_id].points += calculateTournamentFinalPoints(userFinalPred, realFinalRes);
            }
          });
        }


        // Construir o ranking final
        const finalRanking: Participant[] = users.map(user => ({
          id: user.id,
          name: user.name,
          nickname: user.nickname,
          avatar_url: user.avatar_url,
          points: userPoints[user.id]?.points || 0,
          matches: userPoints[user.id]?.matchesCount || 0, // Contagem de jogos com palpites
          // Calcula a acurácia como porcentagem de acertos em palpites de partidas
          accuracy: `${((userPoints[user.id]?.correctMatches || 0) / (userPoints[user.id]?.matchesCount || 1) * 100).toFixed(0)}%`
        }));

        // Ordenar o ranking do maior para o menor ponto
        finalRanking.sort((a, b) => b.points - a.points);

        setRanking(finalRanking);

      } catch (err) {
        console.error("Erro ao carregar o ranking:", err);
        setError("Não foi possível carregar o ranking. Verifique os dados ou tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchAndCalculateRanking();
  }, []); // O array de dependências vazio faz com que a função execute apenas uma vez no carregamento inicial

  return (
    <Layout>
      <div className="max-w-5xl mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-fifa-blue">Ranking Geral</h1>
          <p className="text-gray-600 mt-2">
            Confira a pontuação dos participantes do bolão da Copa Mundial de Clubes FIFA 2025.
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-fifa-blue text-white">
            <CardTitle className="flex items-center gap-2">
              <AwardIcon className="h-5 w-5" />
              Tabela de Classificação
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4">
                <Skeleton className="h-96 w-full" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">{error}</div>
            ) : ranking.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nenhum participante no ranking ainda ou dados insuficientes.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Posição</TableHead>
                      <TableHead>Participante</TableHead>
                      <TableHead>Apelido</TableHead>
                      <TableHead className="text-right">Pontos</TableHead>
                      <TableHead className="text-right">Partidas Palpitadas</TableHead>
                      <TableHead className="text-right">Acurácia (%)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ranking.map((participant, index) => (
                      <RankingRow key={participant.id} participant={participant} index={index} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default RankingPage;