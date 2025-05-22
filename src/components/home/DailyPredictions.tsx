// src/components/home/DailyPredictions.tsx

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  SupabaseMatchResultFromMatches,
  SupabaseMatchPrediction,
} from "@/utils/pointsCalculator/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom"; // Importar Link para o link do painel de admin

// Interface para um palpite no estado local
interface LocalPrediction {
  match_id: string;
  home_score: string; // Mantém como string para input
  away_score: string; // Mantém como string para input
  prediction_id?: string; // ID do palpite existente, se houver
}

const DailyPredictions = () => {
  const { user, isAdmin } = useAuth(); // Obter o usuário logado e o status de admin
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<SupabaseMatchResultFromMatches[]>([]);
  const [currentPredictions, setCurrentPredictions] = useState<LocalPrediction[]>([]);
  const [isSaving, setIsSaving] = useState<string | null>(null); // Armazena o ID da partida que está sendo salva

  // Função para verificar se o usuário pode palpitar em uma partida
  const getCanPredict = (matchDate: string, isFinished: boolean) => {
    const matchTime = parseISO(matchDate).getTime();
    const now = new Date().getTime();
    const cutoffTime = matchTime - (1 * 60 * 60 * 1000); // 1 hora antes do jogo

    if (isFinished) return false; // Se a partida já terminou, não pode palpitar
    if (now > cutoffTime) return false; // Se o prazo limite passou, não pode palpitar
    return true;
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const today = format(new Date(), 'yyyy-MM-dd'); // Formato YYYY-MM-DD para a query SQL
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('*, home_team(*), away_team(*)') // Seleciona dados dos times relacionados
          .gte('match_date', today) // Pega partidas a partir de hoje
          .order('match_date', { ascending: true }); // Ordena por data

        if (matchesError) throw matchesError;

        setMatches(matchesData || []);

        // Buscar palpites existentes do usuário para as partidas retornadas
        const matchIds = (matchesData || []).map(m => m.id);
        let predictionsData: SupabaseMatchPrediction[] = [];
        if (matchIds.length > 0) {
          const { data, error: predictionsError } = await supabase
            .from('match_predictions')
            .select('*')
            .eq('user_id', user.id)
            .in('match_id', matchIds);

          if (predictionsError) throw predictionsError;
          predictionsData = data || [];
        }

        // Inicializar o estado dos palpites com dados existentes ou vazio
        const initialCurrentPredictions: LocalPrediction[] = (matchesData || []).map(match => {
          const existingPrediction = predictionsData.find(p => p.match_id === match.id);
          return {
            match_id: match.id,
            home_score: existingPrediction ? String(existingPrediction.home_score) : '',
            away_score: existingPrediction ? String(existingPrediction.away_score) : '',
            prediction_id: existingPrediction ? existingPrediction.id : undefined,
          };
        });
        setCurrentPredictions(initialCurrentPredictions);

      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to fetch data.");
        toast({
          title: "Erro ao carregar dados",
          description: err.message || "Não foi possível carregar as partidas ou seus palpites.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [user, toast]); // Refetch quando o usuário muda

  const handleScoreChange = (matchId: string, type: 'home' | 'away', value: string) => {
    setCurrentPredictions(prev =>
      prev.map(p =>
        p.match_id === matchId
          ? { ...p, [type]: value }
          : p
      )
    );
  };

  const handleSavePrediction = async (matchId: string) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para salvar palpites.",
        variant: "destructive",
      });
      return;
    }

    const predictionToSave = currentPredictions.find(p => p.match_id === matchId);
    if (!predictionToSave) {
      toast({
        title: "Erro",
        description: "Palpite não encontrado para salvar.",
        variant: "destructive",
      });
      return;
    }

    const match = matches.find(m => m.id === matchId);
    if (!match) {
      toast({
        title: "Erro",
        description: "Detalhes da partida não encontrados.",
        variant: "destructive",
      });
      return;
    }

    const homeScore = Number(predictionToSave.home_score);
    const awayScore = Number(predictionToSave.away_score);

    if (predictionToSave.home_score === '' || predictionToSave.away_score === '' || isNaN(homeScore) || isNaN(awayScore)) {
      toast({
        title: "Erro",
        description: "Por favor, insira placares válidos para a partida.",
        variant: "destructive",
      });
      return;
    }

    const canPredict = getCanPredict(match.match_date, match.is_finished);
    if (!canPredict) {
      toast({
        title: "Prazo Encerrado",
        description: "O prazo para enviar palpites para esta partida já se encerrou.",
        variant: "warning",
      });
      return;
    }

    setIsSaving(matchId); // Começa a salvar para esta partida específica
    try {
      if (predictionToSave.prediction_id) {
        // Atualizar palpite existente
        const { error: updateError } = await supabase
          .from('match_predictions')
          .update({ home_score: homeScore, away_score: awayScore })
          .eq('id', predictionToSave.prediction_id);
        if (updateError) throw updateError;
        toast({
          title: "Sucesso!",
          description: "Palpite atualizado com sucesso.",
          variant: "success",
        });
      } else {
        // Inserir novo palpite
        const { data, error: insertError } = await supabase
          .from('match_predictions')
          .insert({
            user_id: user.id,
            match_id: matchId,
            home_score: homeScore,
            away_score: awayScore,
          })
          .select(); // Retorna o registro inserido
        if (insertError) throw insertError;

        // Atualizar o prediction_id no estado local
        setCurrentPredictions(prev =>
          prev.map(p =>
            p.match_id === matchId
              ? { ...p, prediction_id: data?.[0]?.id }
              : p
          )
        );
        toast({
          title: "Sucesso!",
          description: "Palpite salvo com sucesso.",
          variant: "success",
        });
      }
    } catch (err: any) {
      console.error("Erro ao salvar palpite:", err);
      toast({
        title: "Erro ao salvar",
        description: err.message || "Não foi possível salvar o palpite. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(null); // Finaliza o salvamento
    }
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Carregando Partidas...</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-[250px] mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Erro</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Acesso Negado</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Você precisa estar logado para ver e registrar palpites.
          </p>
          <Link to="/login" className="text-fifa-blue hover:underline mt-4 block">
            Ir para Login
          </Link>
        </CardContent>
      </Card>
    );
  }

  const today = format(new Date(), 'dd/MM/yyyy', { locale: ptBR });

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex justify-between items-center text-fifa-blue">
          Palpites de Partidas
          {isAdmin && (
            <Link to="/admin/dashboard" className="text-sm text-gray-500 hover:underline">
              Ir para Admin
            </Link>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <p className="text-center text-gray-500">Nenhuma partida programada para hoje ou nos próximos dias.</p>
        ) : (
          <div className="space-y-6">
            {matches.map(match => {
              const currentPrediction = currentPredictions.find(p => p.match_id === match.id) || {
                match_id: match.id,
                home_score: '',
                away_score: '',
              };
              const canPredictForMatch = getCanPredict(match.match_date, match.is_finished);

              return (
                <div key={match.id} className="border p-4 rounded-lg bg-gray-50">
                  <h3 className="text-lg font-bold mb-2">
                    {match.home_team?.name} vs {match.away_team?.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {format(parseISO(match.match_date), "HH:mm 'h' - dd/MM", { locale: ptBR })} - {match.stage}
                  </p>

                  {!canPredictForMatch && (
                    <p className="text-sm text-red-500 mb-2">
                      {match.is_finished ? "Partida encerrada." : "Prazo para palpite encerrado."}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      className="w-16 text-center"
                      placeholder="0"
                      value={currentPrediction.home_score}
                      onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)}
                      disabled={isSaving === match.id || !canPredictForMatch}
                    />
                    <span className="text-xl font-bold">x</span>
                    <Input
                      type="number"
                      min="0"
                      className="w-16 text-center"
                      placeholder="0"
                      value={currentPrediction.away_score}
                      onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                      disabled={isSaving === match.id || !canPredictForMatch}
                    />
                    <Button
                      className="ml-auto bg-fifa-green hover:bg-green-700"
                      onClick={() => handleSavePrediction(match.id)}
                      disabled={isSaving === match.id || !canPredictForMatch}
                    >
                      {isSaving === match.id ? "Salvando..." : (currentPrediction.prediction_id ? "Atualizar" : "Salvar")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyPredictions;