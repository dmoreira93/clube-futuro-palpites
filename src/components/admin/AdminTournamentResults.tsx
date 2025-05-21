// src/components/admin/AdminTournamentResults.tsx

import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { calculateTournamentFinalPoints } from "@/lib/scoring";

// --- Interfaces para mapear os dados das tabelas ---
interface Team {
  id: string;
  name: string;
}

interface TournamentResult {
  id: string; // Se você usa um ID fixo para o único registro
  champion_id: string | null;
  runner_up_id: string | null;
  third_place_id: string | null;
  fourth_place_id: string | null;
  final_home_score: number | null;
  final_away_score: number | null;
  is_completed: boolean;
}

// ATUALIZADA: Interface para a tabela `final_predictions` com os novos campos
interface FinalPrediction {
  user_id: string;
  champion_id: string;
  vice_champion_id: string;
  third_place_id: string;
  fourth_place_id: string;
  // NOVOS CAMPOS PARA O PALPITE DO PLACAR FINAL
  final_home_score: number;
  final_away_score: number;
}
// --- Fim das Interfaces ---

const AdminTournamentResults = () => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);

  const [championId, setChampionId] = useState<string>("");
  const [runnerUpId, setRunnerUpId] = useState<string>("");
  const [thirdPlaceId, setThirdPlaceId] = useState<string>("");
  const [fourthPlaceId, setFourthPlaceId] = useState<string>("");
  const [finalHomeScore, setFinalHomeScore] = useState<string>("");
  const [finalAwayScore, setFinalAwayScore] = useState<string>("");
  const [isResultsCompleted, setIsResultsCompleted] = useState<boolean>(false);

  const fetchTournamentData = async () => {
    setLoading(true);
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from<Team>("teams")
        .select("id, name")
        .order("name");

      if (teamsError) throw new Error(teamsError.message);
      setTeams(teamsData || []);

      const { data: tournamentResult, error: resultError } = await supabase
        .from<TournamentResult>("tournament_results")
        .select("*")
        .single();

      if (resultError && resultError.code !== 'PGRST116') {
        throw new Error(resultError.message);
      }

      if (tournamentResult) {
        setChampionId(tournamentResult.champion_id || "");
        setRunnerUpId(tournamentResult.runner_up_id || "");
        setThirdPlaceId(tournamentResult.third_place_id || "");
        setFourthPlaceId(tournamentResult.fourth_place_id || "");
        setFinalHomeScore(tournamentResult.final_home_score !== null ? String(tournamentResult.final_home_score) : "");
        setFinalAwayScore(tournamentResult.final_away_score !== null ? String(tournamentResult.final_away_score) : "");
        setIsResultsCompleted(tournamentResult.is_completed);
      } else {
        setChampionId("");
        setRunnerUpId("");
        setThirdPlaceId("");
        setFourthPlaceId("");
        setFinalHomeScore("");
        setFinalAwayScore("");
        setIsResultsCompleted(false);
      }

    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados do torneio",
        description: error.message,
        variant: "destructive",
      });
      console.error("Erro ao carregar dados do torneio:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournamentData();
  }, []);

  const processTournamentResultsAndCalculatePoints = async () => {
    if (!championId || !runnerUpId || !thirdPlaceId || !fourthPlaceId || finalHomeScore === "" || finalAwayScore === "") {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha todos os campos de resultados finais.",
        variant: "destructive",
      });
      return;
    }

    const realHomeScore = parseInt(finalHomeScore, 10);
    const realAwayScore = parseInt(finalAwayScore, 10);

    if (isNaN(realHomeScore) || isNaN(realAwayScore)) {
        toast({
            title: "Placar inválido",
            description: "Por favor, insira números válidos para o placar da final.",
            variant: "destructive",
        });
        return;
    }

    const uniqueTeams = new Set([championId, runnerUpId, thirdPlaceId, fourthPlaceId]);
    if (uniqueTeams.size !== 4) {
      toast({
        title: "Times repetidos",
        description: "Os 4 times finalistas devem ser distintos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // 1. **Salvar/Atualizar os resultados reais do torneio na tabela 'tournament_results'**
      // Se sua tabela 'tournament_results' tiver uma PK que você usa de forma única (ex: 'tournament_id_fixed'),
      // você pode passar isso no objeto e usar onConflict.
      // Caso contrário, se ela só tiver um registro, pode precisar de uma lógica de DELETE/INSERT ou UPDATE condicional.
      // Para simplificar, vou assumir que o 'id' é autogerado e o upsert funcionará para o único registro.
      // Se houver mais de um registro e você quiser garantir que apenas um seja manipulado,
      // considere adicionar uma coluna `is_current_tournament` BOOLEAN DEFAULT TRUE com um UNIQUE INDEX.
      const { data: existingTournamentResult, error: fetchExistingError } = await supabase
        .from("tournament_results")
        .select("id")
        .limit(1)
        .single(); // Tenta buscar um registro existente

      const upsertData: Partial<TournamentResult> = {
        champion_id: championId,
        runner_up_id: runnerUpId,
        third_place_id: thirdPlaceId,
        fourth_place_id: fourthPlaceId,
        final_home_score: realHomeScore,
        final_away_score: realAwayScore,
        is_completed: true,
        updated_at: new Date().toISOString(),
      };

      let upsertError;
      if (existingTournamentResult) {
        // Se existe, atualiza o registro existente
        const { error } = await supabase
          .from("tournament_results")
          .update(upsertData)
          .eq("id", existingTournamentResult.id);
        upsertError = error;
      } else {
        // Se não existe, insere um novo registro
        const { error } = await supabase
          .from("tournament_results")
          .insert(upsertData);
        upsertError = error;
      }

      if (upsertError) {
        throw new Error(`Erro ao salvar resultados finais do torneio: ${upsertError.message}`);
      }
      toast({
        title: "Resultados Finais Salvos",
        description: "Resultados finais do torneio salvos com sucesso!",
      });

      // 2. **Buscar TODOS os palpites dos usuários para AS FINAIS, incluindo o placar**
      const { data: userFinalPredictions, error: fetchPredictionsError } = await supabase
        .from<FinalPrediction>("final_predictions")
        // ATUALIZADO: Inclui final_home_score e final_away_score
        .select("user_id, champion_id, vice_champion_id, third_place_id, fourth_place_id, final_home_score, final_away_score");

      if (fetchPredictionsError) {
        throw new Error(`Erro ao buscar palpites das finais: ${fetchPredictionsError.message}`);
      }

      if (!userFinalPredictions || userFinalPredictions.length === 0) {
        toast({
          title: "Nenhum palpite",
          description: "Nenhum palpite das finais encontrado. Nenhuma pontuação a ser calculada.",
          variant: "info",
        });
        setIsResultsCompleted(true);
        setLoading(false);
        return;
      }

      const realResultsForCalculation = {
        champion: championId,
        runnerUp: runnerUpId,
        thirdPlace: thirdPlaceId,
        fourthPlace: fourthPlaceId,
        finalScore: { homeGoals: realHomeScore, awayGoals: realAwayScore },
      };

      // 3. **Iterar sobre cada palpite, calcular os pontos e atualizar a pontuação do usuário**
      const scoreUpdatesPromises = userFinalPredictions.map(async (prediction) => {
        const userPredictionForCalculation = {
          champion: prediction.champion_id,
          runnerUp: prediction.vice_champion_id,
          thirdPlace: prediction.third_place_id,
          fourthPlace: prediction.fourth_place_id,
          // ATUALIZADO: Usa os scores do palpite do usuário
          finalScore: { homeGoals: prediction.final_home_score, awayGoals: prediction.final_away_score },
        };

        const pointsEarned = calculateTournamentFinalPoints(userPredictionForCalculation, realResultsForCalculation);

        const { data: currentUserData, error: fetchUserError } = await supabase
          .from("users_custom")
          .select("total_score")
          .eq("id", prediction.user_id)
          .single();

        if (fetchUserError && fetchUserError.code !== 'PGRST116') {
          console.error(`Erro ao buscar pontuação atual do usuário ${prediction.user_id}:`, fetchUserError.message);
          return;
        }

        const currentTotalScore = currentUserData?.total_score || 0;
        const newTotalScore = currentTotalScore + pointsEarned;

        const { error: updateScoreError } = await supabase
          .from("users_custom")
          .upsert(
            { id: prediction.user_id, total_score: newTotalScore, updated_at: new Date().toISOString() },
            { onConflict: 'id' }
          );

        if (updateScoreError) {
          console.error(`Erro ao atualizar pontuação do usuário ${prediction.user_id}:`, updateScoreError.message);
        } else {
          console.log(`Usuário ${prediction.user_id} ganhou ${pointsEarned} pontos. Nova pontuação: ${newTotalScore}`);
        }
      });

      await Promise.all(scoreUpdatesPromises);

      toast({
        title: "Pontuações Finais Atualizadas!",
        description: "Pontuações dos usuários para as fases finais foram atualizadas com sucesso.",
      });

      setIsResultsCompleted(true);
      await fetchTournamentData();

    } catch (error: any) {
      console.error("Erro no processamento dos resultados finais e cálculo de pontos:", error.message);
      toast({
        title: "Erro de processamento",
        description: "Erro ao processar resultados finais e atualizar pontuações: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return "N/A";
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : "Time desconhecido";
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Administração de Resultados Finais do Torneio</h1>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
        </div>
      )}

      <Card className="p-6">
        <CardHeader>
          <CardTitle>Inserir Resultados Finais</CardTitle>
        </CardHeader>
        <CardContent>
          {isResultsCompleted && (
            <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md">
              Resultados Finais já foram inseridos e processados.
              <br/>
              **Campeão:** {getTeamName(championId)} |
              **Vice:** {getTeamName(runnerUpId)} |
              **3º Lugar:** {getTeamName(thirdPlaceId)} |
              **4º Lugar:** {getTeamName(fourthPlaceId)}
              <br/>
              **Placar Final:** {finalHomeScore} x {finalAwayScore}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700">Campeão</label>
              <Select value={championId} onValueChange={setChampionId} disabled={loading || isResultsCompleted}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o Campeão" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">Vice-Campeão</label>
              <Select value={runnerUpId} onValueChange={setRunnerUpId} disabled={loading || isResultsCompleted}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o Vice-Campeão" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">Terceiro Lugar</label>
              <Select value={thirdPlaceId} onValueChange={setThirdPlaceId} disabled={loading || isResultsCompleted}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o 3º Lugar" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">Quarto Lugar</label>
              <Select value={fourthPlaceId} onValueChange={setFourthPlaceId} disabled={loading || isResultsCompleted}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o 4º Lugar" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map(team => (
                    <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="block mb-1 font-medium text-gray-700">Placar da Partida Final</label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="Gols Casa"
                  value={finalHomeScore}
                  onChange={(e) => setFinalHomeScore(e.target.value)}
                  className="w-32"
                  disabled={loading || isResultsCompleted}
                />
                <span>x</span>
                <Input
                  type="number"
                  placeholder="Gols Fora"
                  value={finalAwayScore}
                  onChange={(e) => setFinalAwayScore(e.target.value)}
                  className="w-32"
                  disabled={loading || isResultsCompleted}
                />
              </div>
            </div>
          </div>
          <Button
            onClick={processTournamentResultsAndCalculatePoints}
            className="mt-6 w-full bg-green-600 hover:bg-green-700"
            disabled={loading || isResultsCompleted}
          >
            {isResultsCompleted ? "Resultados Finalizados" : (loading ? "Processando..." : "Salvar Resultados Finais e Pontuar")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTournamentResults;