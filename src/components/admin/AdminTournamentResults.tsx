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
import { toast } from "sonner";
import { Loader2 } from "lucide-react"; // Importar Loader2
import { calculateTournamentFinalPoints } from "@/lib/scoring"; // Importe sua função de pontuação

// --- Interfaces para mapear os dados das tabelas ---
interface Team {
  id: string; // O ID de time no Supabase provavelmente é string (UUID)
  name: string;
}

// A tabela `tournament_results` deve ter um único registro ou um ID fixo para o torneio atual
interface TournamentResult {
  id?: string; // Pode ser um ID fixo ou gerado
  champion_id: string | null;
  runner_up_id: string | null;
  third_place_id: string | null;
  fourth_place_id: string | null;
  final_home_score: number | null;
  final_away_score: number | null;
  is_completed: boolean;
}

const AdminTournamentResults = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [champion, setChampion] = useState<string | null>(null);
  const [runnerUp, setRunnerUp] = useState<string | null>(null);
  const [thirdPlace, setThirdPlace] = useState<string | null>(null);
  const [fourthPlace, setFourthPlace] = useState<string | null>(null);
  const [finalHomeScore, setFinalHomeScore] = useState<string>("");
  const [finalAwayScore, setFinalAwayScore] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isResultsCompleted, setIsResultsCompleted] = useState(false);
  const [tournamentResultId, setTournamentResultId] = useState<string | null>(null); // Para gerenciar o ID do registro único

  useEffect(() => {
    fetchTeamsAndResults();
  }, []);

  const fetchTeamsAndResults = async () => {
    setLoading(true);
    try {
      // Fetch Teams
      const { data: teamsData, error: teamsError } = await supabase
        .from<Team>("teams")
        .select("id, name")
        .order("name", { ascending: true });
      if (teamsError) throw teamsError;
      setTeams(teamsData || []);

      // Fetch existing Tournament Results (assuming a single record for the current tournament)
      const { data: resultsData, error: resultsError } = await supabase
        .from<TournamentResult>("tournament_results")
        .select("id, champion_id, runner_up_id, third_place_id, fourth_place_id, final_home_score, final_away_score, is_completed")
        .single(); // Assumindo que haverá apenas um registro
      
      if (resultsError && resultsError.code !== "PGRST116") { // PGRST116 = no rows found
        throw resultsError;
      }

      if (resultsData) {
        setTournamentResultId(resultsData.id || null); // Armazena o ID do registro
        setChampion(resultsData.champion_id);
        setRunnerUp(resultsData.runner_up_id);
        setThirdPlace(resultsData.third_place_id);
        setFourthPlace(resultsData.fourth_place_id);
        setFinalHomeScore(resultsData.final_home_score?.toString() || "");
        setFinalAwayScore(resultsData.final_away_score?.toString() || "");
        setIsResultsCompleted(resultsData.is_completed);
      } else {
        // Se não houver resultados, inicia com valores nulos e is_completed false
        setIsResultsCompleted(false);
      }
      toast.success("Dados de resultados finais carregados com sucesso.");
    } catch (error: any) {
      console.error("Erro ao carregar dados de resultados finais:", error.message);
      toast.error("Erro ao carregar dados de resultados finais: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const processTournamentResultsAndCalculatePoints = async () => {
    if (!champion || !runnerUp || !thirdPlace || !fourthPlace || finalHomeScore === "" || finalAwayScore === "") {
      toast.error("Por favor, preencha todos os campos dos resultados finais.");
      return;
    }

    const homeScore = parseInt(finalHomeScore);
    const awayScore = parseInt(finalAwayScore);

    if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0) {
      toast.error("Por favor, insira placares válidos (números não negativos).");
      return;
    }

    // Validação para garantir que os 4 primeiros colocados são times distintos
    const uniqueTeams = new Set([champion, runnerUp, thirdPlace, fourthPlace]);
    if (uniqueTeams.size !== 4) {
      toast.error("Os times do Campeão, Vice, Terceiro e Quarto lugar devem ser distintos.");
      return;
    }

    setLoading(true);
    try {
      // 1. Inserir ou atualizar o registro de `tournament_results`
      let upsertError: any;
      const resultData: Omit<TournamentResult, 'id'> = {
        champion_id: champion,
        runner_up_id: runnerUp,
        third_place_id: thirdPlace,
        fourth_place_id: fourthPlace,
        final_home_score: homeScore,
        final_away_score: awayScore,
        is_completed: true, // Marcar como concluído ao salvar
      };

      if (tournamentResultId) {
        // Atualiza o registro existente
        const { error } = await supabase
          .from("tournament_results")
          .update(resultData)
          .eq("id", tournamentResultId);
        upsertError = error;
      } else {
        // Insere um novo registro (primeira vez)
        const { data, error } = await supabase
          .from("tournament_results")
          .insert(resultData)
          .select('id') // Seleciona o ID para armazenar
          .single();
        upsertError = error;
        if (data) setTournamentResultId(data.id); // Armazena o ID do novo registro
      }

      if (upsertError) throw upsertError;

      // 2. Acionar o cálculo de pontos para todos os palpites finais
      // Você precisará buscar todos os palpites finais dos usuários
      const { data: finalPredictions, error: predictionsError } = await supabase
        .from("final_predictions")
        .select("user_id, champion_id, vice_champion_id, third_place_id, fourth_place_id, final_home_score, final_away_score");
      if (predictionsError) throw predictionsError;

      // Chama a função de pontuação para cada palpite
      for (const prediction of finalPredictions) {
        // A função calculateTournamentFinalPoints precisará ser refatorada para aceitar
        // o palpite, os resultados reais, e o user_id para atualizar a tabela user_points
        await calculateTournamentFinalPoints(
          prediction.user_id,
          prediction.champion_id, prediction.vice_champion_id, prediction.third_place_id, prediction.fourth_place_id,
          prediction.final_home_score, prediction.final_away_score,
          champion, runnerUp, thirdPlace, fourthPlace, homeScore, awayScore
        );
      }

      toast.success("Resultados finais salvos e pontos calculados com sucesso!");
      setIsResultsCompleted(true); // Atualiza o estado da UI
      await fetchTeamsAndResults(); // Recarrega para garantir consistência
    } catch (error: any) {
      console.error("Erro ao processar resultados finais do torneio:", error.message);
      toast.error("Erro ao salvar resultados finais ou calcular pontos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Resultados Finais do Torneio</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && <p className="text-center py-4">Carregando...</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700">Campeão</label>
              <Select
                onValueChange={setChampion}
                value={champion || ""}
                disabled={loading || isResultsCompleted}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o Campeão" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">Vice-Campeão</label>
              <Select
                onValueChange={setRunnerUp}
                value={runnerUp || ""}
                disabled={loading || isResultsCompleted}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o Vice-Campeão" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">Terceiro Lugar</label>
              <Select
                onValueChange={setThirdPlace}
                value={thirdPlace || ""}
                disabled={loading || isResultsCompleted}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o Terceiro Lugar" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">Quarto Lugar</label>
              <Select
                onValueChange={setFourthPlace}
                value={fourthPlace || ""}
                disabled={loading || isResultsCompleted}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o Quarto Lugar" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
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
            className="mt-6 w-full bg-fifa-blue hover:bg-opacity-90" // Ajustado para cor FIFA
            disabled={loading || isResultsCompleted}
          >
            {isResultsCompleted ? (
              <span className="flex items-center">
                <Badge variant="default" className="bg-green-500 mr-2">Resultados Finalizados</Badge>
              </span>
            ) : (
              loading ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...
                </span>
              ) : (
                "Salvar Resultados Finais e Pontuar"
              )
            )}
          </Button>
          {isResultsCompleted && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              Os resultados finais já foram inseridos e os pontos calculados. Para editar, você precisará de uma permissão especial (remover `is_completed` do DB).
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTournamentResults;