import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Assumindo que você tem um componente Input
import { toast } from "sonner"; // Para exibir notificações
import { calculateMatchPoints } from "@/lib/scoring"; // Importe sua função de pontuação

// --- Interfaces para mapear os dados das suas tabelas ---
interface Match {
  id: string;
  home_score: number | null; // Pode ser null antes de ser finalizado
  away_score: number | null; // Pode ser null antes de ser finalizado
  match_date: string;
  stage: string;
  stadium: string;
  is_finished: boolean;
  home_team: { id: string; name: string } | null;
  away_team: { id: string; name: string } | null;
  home_team_name?: string; // Propriedade adicionada no fetch para exibir
  away_team_name?: string; // Propriedade adicionada no fetch para exibir
}

interface UserMatchPrediction {
  user_id: string;
  home_score: number;
  away_score: number;
}
// --- Fim das Interfaces ---

const AdminMatches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [homeScoreInput, setHomeScoreInput] = useState<string>("");
  const [awayScoreInput, setAwayScoreInput] = useState<string>("");

  const fetchMatches = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("matches")
      .select(
        `
        id,
        home_score,
        away_score,
        match_date,
        stage,
        stadium,
        is_finished,
        created_at,
        updated_at,
        home_team:home_team_id (id, name),
        away_team:away_team_id (id, name)
        `
      )
      .order("match_date", { ascending: true });

    if (error) {
      console.error("Erro ao buscar partidas:", error.message);
      toast.error("Erro ao carregar partidas.");
    } else {
      const formattedMatches: Match[] = data.map((match: any) => ({
        ...match,
        home_team_name: match.home_team?.name ?? "Time não encontrado",
        away_team_name: match.away_team?.name ?? "Time não encontrado",
      }));
      setMatches(formattedMatches);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  // --- Função para processar e salvar os resultados da partida e calcular pontos ---
  const processMatchResultAndCalculatePoints = async (
    matchId: string,
    realHomeScore: number,
    realAwayScore: number
  ) => {
    setLoading(true); // Pode ser bom mostrar um carregamento durante o processo
    try {
      // 1. **Atualizar o resultado real da partida na tabela 'matches'**
      const { error: updateMatchError } = await supabase
        .from("matches")
        .update({
          home_score: realHomeScore,
          away_score: realAwayScore,
          is_finished: true, // Marcar como finalizado
          updated_at: new Date().toISOString(),
        })
        .eq("id", matchId);

      if (updateMatchError) {
        throw new Error(`Erro ao salvar resultado da partida: ${updateMatchError.message}`);
      }
      toast.success("Resultado da partida salvo com sucesso!");

      // 2. **Buscar TODOS os palpites dos usuários para ESTA partida específica**
      const { data: userPredictions, error: fetchPredictionsError } = await supabase
        .from("match_predictions")
        .select("user_id, home_score, away_score")
        .eq("match_id", matchId);

      if (fetchPredictionsError) {
        throw new Error(`Erro ao buscar palpites: ${fetchPredictionsError.message}`);
      }

      if (!userPredictions || userPredictions.length === 0) {
        toast.info("Nenhum palpite encontrado para esta partida. Nenhuma pontuação a ser calculada.");
        setEditingMatchId(null); // Sai do modo de edição
        setLoading(false);
        return;
      }

      // Prepare o objeto de resultado real para a função de pontuação
      const realResultForCalculation = {
        homeGoals: realHomeScore,
        awayGoals: realAwayScore,
      };

      // 3. **Iterar sobre cada palpite, calcular os pontos e atualizar a pontuação do usuário**
      //    Usaremos Promise.all para executar as atualizações em paralelo, melhorando a performance.
      const scoreUpdatesPromises = userPredictions.map(async (prediction) => {
        const userPredictionForCalculation = {
          homeGoals: prediction.home_score,
          awayGoals: prediction.away_score,
        };

        const pointsEarned = calculateMatchPoints(userPredictionForCalculation, realResultForCalculation);

        const { data: currentUserData, error: fetchUserError } = await supabase
          .from("users_custom")
          .select("total_score")
          .eq("id", prediction.user_id)
          .single();

        if (fetchUserError && fetchUserError.code !== 'PGRST116') { // PGRST116 = "No rows found"
          console.error(`Erro ao buscar pontuação atual do usuário ${prediction.user_id}:`, fetchUserError.message);
          return; // Não lança erro, apenas pula este usuário
        }

        const currentTotalScore = currentUserData?.total_score || 0;
        const newTotalScore = currentTotalScore + pointsEarned;

        const { error: updateScoreError } = await supabase
          .from("users_custom")
          .upsert(
            { id: prediction.user_id, total_score: newTotalScore, updated_at: new Date().toISOString() },
            { onConflict: 'id' } // Se o user_id já existir, ele atualiza; senão, insere
          );

        if (updateScoreError) {
          console.error(`Erro ao atualizar pontuação do usuário ${prediction.user_id}:`, updateScoreError.message);
        } else {
          console.log(`Usuário ${prediction.user_id} ganhou ${pointsEarned} pontos. Nova pontuação: ${newTotalScore}`);
        }
      });

      await Promise.all(scoreUpdatesPromises); // Espera todas as atualizações terminarem

      toast.success("Pontuações de todas as previsões para esta partida foram atualizadas!");
      await fetchMatches(); // Recarrega as partidas para mostrar os resultados atualizados
      setEditingMatchId(null); // Sai do modo de edição
      setHomeScoreInput("");
      setAwayScoreInput("");

    } catch (error: any) {
      console.error("Erro no processamento da partida e cálculo de pontos:", error.message);
      toast.error("Erro ao processar resultados e atualizar pontuações: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (match: Match) => {
    setEditingMatchId(match.id);
    setHomeScoreInput(match.home_score !== null ? String(match.home_score) : "");
    setAwayScoreInput(match.away_score !== null ? String(match.away_score) : "");
  };

  const handleSaveScores = (matchId: string) => {
    const realHomeScore = parseInt(homeScoreInput, 10);
    const realAwayScore = parseInt(awayScoreInput, 10);

    if (isNaN(realHomeScore) || isNaN(realAwayScore)) {
      toast.error("Por favor, insira placares válidos.");
      return;
    }

    processMatchResultAndCalculatePoints(matchId, realHomeScore, realAwayScore);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Administração de Partidas</h1>
      {loading && editingMatchId === null ? ( // Apenas mostra loading geral se não estiver editando
        <p>Carregando partidas...</p>
      ) : (
        <div className="grid gap-4">
          {matches.map((match) => (
            <div
              key={match.id}
              className="border rounded-xl p-4 shadow-sm bg-white"
            >
              <p className="font-semibold text-lg">{match.stage}</p>
              <p className="text-sm text-gray-600">
                {new Date(match.match_date).toLocaleString()}
              </p>
              <p>
                <strong>Times:</strong> {match.home_team_name} vs {match.away_team_name}
              </p>
              {editingMatchId === match.id ? (
                // Modo de Edição
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="number"
                    value={homeScoreInput}
                    onChange={(e) => setHomeScoreInput(e.target.value)}
                    className="w-20"
                    placeholder="Casa"
                  />
                  <span>x</span>
                  <Input
                    type="number"
                    value={awayScoreInput}
                    onChange={(e) => setAwayScoreInput(e.target.value)}
                    className="w-20"
                    placeholder="Fora"
                  />
                  <Button onClick={() => handleSaveScores(match.id)} disabled={loading}>
                    {loading ? "Salvando..." : "Salvar e Pontuar"}
                  </Button>
                  <Button variant="outline" onClick={() => setEditingMatchId(null)} disabled={loading}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                // Modo de Visualização
                <>
                  <p>
                    <strong>Placar:</strong> {match.home_score !== null ? match.home_score : "_"} x{" "}
                    {match.away_score !== null ? match.away_score : "_"}
                  </p>
                  <p>
                    <strong>Estádio:</strong> {match.stadium}
                  </p>
                  <p>
                    <strong>Finalizado:</strong> {match.is_finished ? "Sim" : "Não"}
                  </p>
                  {!match.is_finished && ( // Só permite editar se a partida não estiver finalizada
                    <Button onClick={() => handleEditClick(match)} className="mt-2">
                      Inserir Resultado
                    </Button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
      {loading && editingMatchId !== null && ( // Mostra loading específico quando salvando resultados
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="animate-spin h-10 w-10 border-4 border-fifa-blue border-t-transparent rounded-full"></div>
        </div>
      )}
    </div>
  );
};

export default AdminMatches;