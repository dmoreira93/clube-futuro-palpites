// src/components/admin/AdminMatches.tsx

import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { calculateMatchPoints } from "@/lib/scoring"; // Importe sua função de pontuação
import { Loader2 } from "lucide-react"; // Para feedback de carregamento

// --- Interfaces para mapear os dados das suas tabelas ---
interface Match {
  id: string;
  home_score: number | null;
  away_score: number | null;
  match_date: string;
  stage: string;
  stadium: string | null;
  is_finished: boolean;
  home_team: { id: string; name: string } | null;
  away_team: { id: string; name: string } | null;
  home_team_name?: string;
  away_team_name?: string;
  created_at?: string;
  updated_at?: string | null;
}

// Interface para palpites de partida
interface UserMatchPrediction {
  id: string; // ID da predição (da tabela match_predictions)
  user_id: string;
  home_score: number;
  away_score: number;
}
// --- Fim das Interfaces ---

const AdminMatches = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false); // Para carregamento geral e de processamento
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [homeScoreInput, setHomeScoreInput] = useState<string>("");
  const [awayScoreInput, setAwayScoreInput] = useState<string>("");

  const fetchMatches = async () => {
    setLoading(true);
    try {
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
        const formattedMatches: Match[] = (data || []).map((match: any) => ({
          ...match,
          home_team_name: match.home_team?.name ?? "Time não encontrado",
          away_team_name: match.away_team?.name ?? "Time não encontrado",
        }));
        setMatches(formattedMatches);
      }
    } catch (e: any) {
        console.error("Erro inesperado ao buscar partidas:", e.message);
        toast.error("Erro inesperado ao carregar partidas.");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const processMatchResultAndCalculatePoints = async (
    matchId: string,
    realHomeScore: number,
    realAwayScore: number
  ) => {
    setLoading(true); // Ativa o estado de carregamento global para o processamento
    try {
      // 1. Atualizar o resultado real da partida na tabela 'matches'
      const { error: updateMatchError } = await supabase
        .from("matches")
        .update({
          home_score: realHomeScore,
          away_score: realAwayScore,
          is_finished: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", matchId);

      if (updateMatchError) {
        throw new Error(`Erro ao salvar resultado da partida: ${updateMatchError.message}`);
      }
      toast.success("Resultado da partida salvo com sucesso!");

      // 2. Buscar TODOS os palpites dos usuários para ESTA partida específica
      const { data: userPredictionsData, error: fetchPredictionsError } = await supabase
        .from("match_predictions")
        .select("id, user_id, home_score, away_score") // AGORA SELECIONA O 'id' DO PALPITE
        .eq("match_id", matchId);

      if (fetchPredictionsError) {
        throw new Error(`Erro ao buscar palpites: ${fetchPredictionsError.message}`);
      }
      
      const userPredictions = userPredictionsData as UserMatchPrediction[] || [];

      if (userPredictions.length === 0) {
        toast.info("Nenhum palpite encontrado para esta partida. Nenhuma pontuação a ser calculada.");
        setEditingMatchId(null); // Sai do modo de edição
        await fetchMatches(); // Recarrega as partidas para mostrar o resultado salvo
        setLoading(false);
        return;
      }

      toast.info(`Processando ${userPredictions.length} palpites para a partida...`);

      // 3. Iterar sobre cada palpite e chamar calculateMatchPoints de scoring.ts
      //    A função calculateMatchPoints (de scoring.ts) já chamará registerPoints internamente.
      const scoreUpdatesPromises = userPredictions.map(async (prediction) => {
        const safeUserId = typeof prediction.user_id === 'string' ? prediction.user_id : null;
        const safePredictionId = typeof prediction.id === 'string' ? prediction.id : null; // ID do palpite de partida
        
        if (!safeUserId || !safePredictionId) {
            console.warn('Skipping match prediction due to missing user_id or prediction.id', prediction);
            return; // Pular este palpite se IDs essenciais estiverem faltando
        }

        try {
            // Chamada CORRIGIDA para calculateMatchPoints
            await calculateMatchPoints(
                safeUserId,
                safePredictionId, // ID do palpite específico
                matchId,          // ID da partida que está sendo processada
                prediction.home_score,
                prediction.away_score,
                realHomeScore,
                realAwayScore
            );
        } catch (calcError: any) {
            console.error(`Erro ao calcular/registrar pontos para usuário ${safeUserId}, palpite ${safePredictionId}:`, calcError.message);
            // Decide-se não parar todo o processo por um erro individual, mas registrar.
            // Poderia adicionar um toast.error específico aqui se desejado.
        }
      });

      await Promise.all(scoreUpdatesPromises);

      toast.success("Pontuações de todos os palpites para esta partida foram processadas!");
      await fetchMatches(); // Recarrega as partidas para mostrar os resultados atualizados
      setEditingMatchId(null); // Sai do modo de edição
      setHomeScoreInput("");
      setAwayScoreInput("");

    } catch (error: any) {
      console.error("Erro no processamento da partida e cálculo de pontos:", error.message);
      toast.error("Erro ao processar resultados e/ou pontuações: " + error.message);
    } finally {
      setLoading(false); // Desativa o estado de carregamento global
    }
  };

  const handleEditClick = (match: Match) => {
    // Permite abrir para edição mesmo se finalizada, para corrigir resultados, mas o botão de salvar ainda estará desabilitado se já processado.
    // A lógica de "Salvar e Pontuar" deve ser cuidadosa para não reprocessar desnecessariamente.
    // Uma melhoria futura seria ter um botão "Reprocessar Pontos" separado se a partida já foi finalizada.
    setEditingMatchId(match.id);
    setHomeScoreInput(match.home_score !== null ? String(match.home_score) : "");
    setAwayScoreInput(match.away_score !== null ? String(match.away_score) : "");
  };

  const handleSaveScores = (matchId: string) => {
    const realHomeScore = parseInt(homeScoreInput, 10);
    const realAwayScore = parseInt(awayScoreInput, 10);

    if (isNaN(realHomeScore) || isNaN(realAwayScore) || realHomeScore < 0 || realAwayScore < 0) {
      toast.error("Por favor, insira placares válidos (números não negativos).");
      return;
    }

    // Adicionar uma confirmação se a partida já foi finalizada e está sendo re-submetida
    const matchBeingEdited = matches.find(m => m.id === matchId);
    if (matchBeingEdited?.is_finished) {
        if (!window.confirm("Esta partida já foi finalizada. Deseja realmente salvar este resultado e reprocessar os pontos?")) {
            return;
        }
    }

    processMatchResultAndCalculatePoints(matchId, realHomeScore, realAwayScore);
  };

  // Mostra um loader geral se estiver carregando a lista inicial de partidas
  if (loading && !editingMatchId && matches.length === 0) {
    return (
        <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-fifa-blue" />
            <p className="ml-2">Carregando partidas...</p>
        </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-fifa-blue">Administração de Partidas</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {matches.map((match) => (
          <div
            key={match.id}
            className={`border rounded-xl p-4 shadow-sm bg-white transition-all duration-300 ${
                editingMatchId === match.id ? 'ring-2 ring-fifa-blue scale-105' : 'hover:shadow-md'
            }`}
          >
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold text-lg text-fifa-blue">{match.stage}</p>
                    <p className="text-sm text-gray-500">
                    {new Date(match.match_date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    match.is_finished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                    {match.is_finished ? "Finalizado" : "Pendente"}
                </span>
            </div>

            <p className="mt-2 text-center text-lg">
              <span className="font-medium">{match.home_team_name}</span>
              <span className="mx-2 font-bold text-gray-400">
                {match.is_finished && match.home_score !== null && match.away_score !== null ? `${match.home_score} x ${match.away_score}` : "vs"}
              </span>
              <span className="font-medium">{match.away_team_name}</span>
            </p>
            
            {match.stadium && <p className="text-xs text-gray-500 text-center mt-1">Estádio: {match.stadium}</p>}
            
            {editingMatchId === match.id ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Input
                    type="number"
                    value={homeScoreInput}
                    onChange={(e) => setHomeScoreInput(e.target.value)}
                    className="w-24 text-center text-lg"
                    placeholder="Casa"
                    min="0"
                    disabled={loading}
                  />
                  <span className="font-bold text-xl">x</span>
                  <Input
                    type="number"
                    value={awayScoreInput}
                    onChange={(e) => setAwayScoreInput(e.target.value)}
                    className="w-24 text-center text-lg"
                    placeholder="Fora"
                    min="0"
                    disabled={loading}
                  />
                </div>
                <div className="flex gap-2 justify-center">
                    <Button onClick={() => handleSaveScores(match.id)} disabled={loading} className="bg-fifa-green hover:bg-green-700 flex-1">
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : (match.is_finished ? "Salvar e Reprocessar" : "Salvar e Pontuar")}
                    </Button>
                    <Button variant="outline" onClick={() => setEditingMatchId(null)} disabled={loading} className="flex-1">
                        Cancelar
                    </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 flex justify-center">
                <Button 
                    onClick={() => handleEditClick(match)} 
                    className={`${match.is_finished ? 'bg-gray-500 hover:bg-gray-600' : 'bg-fifa-blue hover:bg-blue-700'}`} 
                    size="sm"
                    disabled={loading && editingMatchId !== null} // Desabilita outros botões de editar enquanto um processamento está em curso
                >
                  {match.is_finished ? "Ver/Corrigir Resultado" : "Inserir Resultado"}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
      {matches.length === 0 && !loading && (
        <p className="text-center text-gray-500 py-8">Nenhuma partida encontrada.</p>
      )}
    </div>
  );
};

export default AdminMatches;