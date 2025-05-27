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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";
import { calculateTournamentFinalPoints } from "@/lib/scoring";
import { Badge } from "@/components/ui/badge"; // IMPORTAR BADGE

interface Team {
  id: string;
  name: string;
}

interface TournamentResultDbRow { // Para dados do DB
  id?: string;
  champion_id: string | null;
  runner_up_id: string | null; // Nome da coluna no DB
  third_place_id: string | null;
  fourth_place_id: string | null;
  final_home_score: number | null;
  final_away_score: number | null;
  is_completed: boolean;
  created_at?: string | null; // Opcional, pode ser gerenciado pelo DB
  updated_at?: string | null; // Opcional
}

interface UserFinalPredictionDbRow { // Para dados do DB
    id: string;
    user_id: string;
    champion_id: string | null;
    vice_champion_id: string | null; // Nome da coluna no DB (ajuste se for runner_up_id)
    third_place_id: string | null;
    fourth_place_id: string | null;
    final_home_score: number | null;
    final_away_score: number | null;
}


const AdminTournamentResults = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [champion, setChampion] = useState<string | null>(null);
  const [runnerUp, setRunnerUp] = useState<string | null>(null); // Estado para o vice-campeão
  const [thirdPlace, setThirdPlace] = useState<string | null>(null);
  const [fourthPlace, setFourthPlace] = useState<string | null>(null);
  const [finalHomeScore, setFinalHomeScore] = useState<string>("");
  const [finalAwayScore, setFinalAwayScore] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isProcessingPoints, setIsProcessingPoints] = useState(false);
  const [isResultsCompleted, setIsResultsCompleted] = useState(false);
  const [tournamentResultId, setTournamentResultId] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamsAndResults();
  }, []);

  const fetchTeamsAndResults = async () => {
    setLoading(true);
    try {
      const { data: teamsData, error: teamsError } = await supabase
        .from("teams")
        .select("id, name")
        .order("name", { ascending: true });
      if (teamsError) throw teamsError;
      setTeams((teamsData as Team[]) || []);

      const { data: resultsData, error: resultsError } = await supabase
        .from("tournament_results")
        .select("id, champion_id, runner_up_id, third_place_id, fourth_place_id, final_home_score, final_away_score, is_completed")
        .maybeSingle(); 
      
      if (resultsError && resultsError.code !== 'PGRST116') { 
        console.error("Erro ao buscar resultados do torneio (SELECT):", resultsError);
        toast.error(`Erro ao buscar resultados: ${resultsError.message}`);
        // Não lançar o erro aqui permite que a página carregue mesmo com falha no select inicial
      }

      if (resultsData) {
        const typedResultsData = resultsData as TournamentResultDbRow;
        setTournamentResultId(typedResultsData.id || null);
        setChampion(typedResultsData.champion_id);
        setRunnerUp(typedResultsData.runner_up_id); // Assumindo que a coluna é runner_up_id
        setThirdPlace(typedResultsData.third_place_id);
        setFourthPlace(typedResultsData.fourth_place_id);
        setFinalHomeScore(typedResultsData.final_home_score?.toString() || "");
        setFinalAwayScore(typedResultsData.final_away_score?.toString() || "");
        setIsResultsCompleted(typedResultsData.is_completed);
        if (typedResultsData.is_completed) {
            toast.info("Os resultados finais do torneio já foram processados.");
        }
      } else {
        setIsResultsCompleted(false);
         // Limpar estados se não houver resultados
        setTournamentResultId(null);
        setChampion(null);
        setRunnerUp(null);
        setThirdPlace(null);
        setFourthPlace(null);
        setFinalHomeScore("");
        setFinalAwayScore("");
      }
    } catch (error: any) {
      // Este catch pegaria erros lançados por throw teamsError ou throw resultsError
      console.error("Erro ao carregar dados para AdminTournamentResults:", error.message);
      toast.error("Falha ao carregar dados iniciais: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const processTournamentResultsAndCalculatePoints = async () => {
    if (!champion || !runnerUp || !thirdPlace || !fourthPlace || finalHomeScore.trim() === "" || finalAwayScore.trim() === "") {
      toast.error("Por favor, preencha todos os campos dos resultados finais.");
      return;
    }

    const homeScoreNum = parseInt(finalHomeScore, 10);
    const awayScoreNum = parseInt(finalAwayScore, 10);

    if (isNaN(homeScoreNum) || isNaN(awayScoreNum) || homeScoreNum < 0 || awayScoreNum < 0) {
      toast.error("Por favor, insira placares válidos (números não negativos).");
      return;
    }

    const finalPositions = [champion, runnerUp, thirdPlace, fourthPlace].filter(id => id !== null);
    if (new Set(finalPositions).size !== finalPositions.length || finalPositions.length !== 4) {
        toast.error("Os times do Campeão, Vice, Terceiro e Quarto lugar devem ser distintos e todos preenchidos.");
        return;
    }
    
    setIsProcessingPoints(true);
    try {
      let currentTournamentResultId = tournamentResultId;
      // ATENÇÃO: Se sua tabela tournament_results usa 'vice_champion_id', mude 'runner_up_id' abaixo
      const resultPayload: Omit<TournamentResultDbRow, "id" | "created_at"> = {
        champion_id: champion,
        runner_up_id: runnerUp, // Usar runner_up_id se for o nome da coluna no DB
        third_place_id: thirdPlace,
        fourth_place_id: fourthPlace,
        final_home_score: homeScoreNum,
        final_away_score: awayScoreNum,
        is_completed: true,
        updated_at: new Date().toISOString(),
      };

      if (currentTournamentResultId) {
        const { error: updateError } = await supabase
          .from("tournament_results")
          .update(resultPayload)
          .eq("id", currentTournamentResultId);
        if (updateError) throw updateError;
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from("tournament_results")
          .insert({ ...resultPayload, created_at: new Date().toISOString() })
          .select('id')
          .single();
        if (insertError) throw insertError;

        if (insertData && insertData.id) {
            currentTournamentResultId = insertData.id;
            setTournamentResultId(insertData.id);
        } else {
            throw new Error("Falha ao obter ID do resultado do torneio inserido.");
        }
      }
      toast.success("Resultados finais do torneio salvos no banco!");

      // ATENÇÃO: Se sua tabela final_predictions usa 'runner_up_id', mude 'vice_champion_id' abaixo
      const { data: userFinalPredictionsData, error: predictionsError } = await supabase
        .from("final_predictions")
        .select("id, user_id, champion_id, vice_champion_id, third_place_id, fourth_place_id, final_home_score, final_away_score");
      
      if (predictionsError) {
        console.error("Erro ao buscar palpites finais dos usuários:", predictionsError);
        toast.error(`Erro ao buscar palpites finais: ${predictionsError.message}`);
        setIsProcessingPoints(false); // Parar o processamento se não conseguir buscar palpites
        return;
      }
      
      const userFinalPredictions = userFinalPredictionsData as UserFinalPredictionDbRow[] || [];

      if (userFinalPredictions.length === 0) {
        toast.info("Nenhum palpite final de usuário encontrado para processar.");
        setIsResultsCompleted(true);
        setIsProcessingPoints(false);
        return;
      }
      
      toast.info(`Processando ${userFinalPredictions.length} palpites finais...`);

      for (const prediction of userFinalPredictions) {
        console.log('AdminTournamentResults - Processando palpite final para user:', prediction.user_id, 'ID do palpite:', prediction.id);
        console.log('AdminTournamentResults - Dados do palpite:', prediction);
        console.log('AdminTournamentResults - Dados reais:', { champion, runnerUp, thirdPlace, fourthPlace, homeScoreNum, awayScoreNum });


        // Garantir que os IDs passados para calculateTournamentFinalPoints sejam strings ou null
        const safeUserId = typeof prediction.user_id === 'string' ? prediction.user_id : null;
        const safePredictionId = typeof prediction.id === 'string' ? prediction.id : null;
        const safeTournamentResultId = typeof currentTournamentResultId === 'string' ? currentTournamentResultId : null;

        if (!safeUserId || !safePredictionId) {
            console.warn('Skipping prediction due to missing user_id or prediction.id', prediction);
            continue;
        }
        
        await calculateTournamentFinalPoints(
          safeUserId,
          safePredictionId,
          safeTournamentResultId,
          prediction.champion_id,
          prediction.vice_champion_id, // Ajuste se a coluna for runner_up_id
          prediction.third_place_id,
          prediction.fourth_place_id,
          prediction.final_home_score,
          prediction.final_away_score,
          champion, // ID string do estado
          runnerUp,   // ID string do estado
          thirdPlace, // ID string do estado
          fourthPlace,  // ID string do estado
          homeScoreNum,
          awayScoreNum
        );
      }

      toast.success("Pontos dos palpites finais calculados e atualizados com sucesso!");
      setIsResultsCompleted(true); // Marcar como completo
      // await fetchTeamsAndResults(); // Recarregar dados para refletir o estado 'is_completed'
    } catch (error: any) {
      console.error("Erro ao processar resultados finais ou calcular pontos:", error.message, error.details, error.hint);
      toast.error(`Erro ao salvar/pontuar: ${error.message}`);
    } finally {
      setIsProcessingPoints(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-fifa-blue" />
        <p className="ml-2">Carregando dados do torneio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-fifa-blue">Gerenciar Resultados Finais do Torneio</CardTitle>
          <CardDescription>
            Defina as posições finais e o placar da final. Isso acionará o cálculo de pontos para os palpites finais dos usuários.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
            <div>
              <label htmlFor="champion-select" className="block mb-1 text-sm font-medium text-gray-700">Campeão</label>
              <Select
                onValueChange={setChampion}
                value={champion || ""}
                disabled={isProcessingPoints || isResultsCompleted}
              >
                <SelectTrigger id="champion-select">
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
              <label htmlFor="runnerup-select" className="block mb-1 text-sm font-medium text-gray-700">Vice-Campeão</label>
              <Select
                onValueChange={setRunnerUp}
                value={runnerUp || ""}
                disabled={isProcessingPoints || isResultsCompleted}
              >
                <SelectTrigger id="runnerup-select">
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
              <label htmlFor="thirdplace-select" className="block mb-1 text-sm font-medium text-gray-700">Terceiro Lugar</label>
              <Select
                onValueChange={setThirdPlace}
                value={thirdPlace || ""}
                disabled={isProcessingPoints || isResultsCompleted}
              >
                <SelectTrigger id="thirdplace-select">
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
              <label htmlFor="fourthplace-select" className="block mb-1 text-sm font-medium text-gray-700">Quarto Lugar</label>
              <Select
                onValueChange={setFourthPlace}
                value={fourthPlace || ""}
                disabled={isProcessingPoints || isResultsCompleted}
              >
                <SelectTrigger id="fourthplace-select">
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
            <div className="col-span-1 md:col-span-2">
              <label htmlFor="finalHomeScore-input" className="block mb-1 text-sm font-medium text-gray-700">Placar da Partida Final (Campeão vs Vice)</label>
              <div className="flex gap-2 items-center">
                <Input
                  id="finalHomeScore-input"
                  type="number"
                  placeholder="Gols Campeão"
                  value={finalHomeScore}
                  onChange={(e) => setFinalHomeScore(e.target.value)}
                  className="w-32 text-center"
                  disabled={isProcessingPoints || isResultsCompleted}
                  min="0"
                />
                <span className="font-bold text-gray-700">x</span>
                <Input
                  id="finalAwayScore-input"
                  type="number"
                  placeholder="Gols Vice"
                  value={finalAwayScore}
                  onChange={(e) => setFinalAwayScore(e.target.value)}
                  className="w-32 text-center"
                  disabled={isProcessingPoints || isResultsCompleted}
                  min="0"
                />
              </div>
            </div>
          </div>
          <Button
            onClick={processTournamentResultsAndCalculatePoints}
            className="w-full bg-fifa-blue hover:bg-fifa-blue/90 text-white py-3"
            disabled={isProcessingPoints || isResultsCompleted}
          >
            {isProcessingPoints ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando Pontos...
              </>
            ) : isResultsCompleted ? (
                <>
                    <CheckCircle className="mr-2 h-5 w-5" /> Resultados Finais Processados
                </>
            ) : (
              "Salvar Resultados Finais e Calcular Pontos"
            )}
          </Button>
          {isResultsCompleted && (
            <p className="text-xs text-gray-500 mt-3 text-center">
              Os resultados finais do torneio já foram processados. Para reprocessar, seria necessário limpar os dados relacionados no banco de dados.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTournamentResults;