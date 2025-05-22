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
  const [predictions, setPredictions] = useState<SupabaseMatchPrediction[]>([]);
  const [currentPredictions, setCurrentPredictions] = useState<LocalPrediction[]>([]);
  const [isSaving, setIsSaving] = useState(false); // Global saving flag

  // Função para verificar se o usuário pode palpitar em uma partida (prazo e status)
  const getCanPredict = (matchDate: string, isFinished: boolean) => {
    const matchTime = parseISO(matchDate).getTime();
    const now = new Date().getTime();
    // Exemplo: Prazo final para palpite é 1 hora antes do início da partida
    // Ajuste este valor conforme a regra do seu bolão
    const cutoffTime = matchTime - (1 * 60 * 60 * 1000); // 1 hora antes do jogo

    // Se a partida já terminou, não pode palpitar
    if (isFinished) return false;

    // Se o tempo atual já passou do prazo limite, não pode palpitar
    if (now > cutoffTime) return false;

    return true; // Caso contrário, pode palpitar
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
        // Fetch matches for today (assuming you want today's matches)
        const today = format(new Date(), 'yyyy-MM-dd');
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('*, home_team(*), away_team(*)')
          .eq('match_date', today)
          .order('match_date', { ascending: true });

        if (matchesError) throw matchesError;

        setMatches(matchesData || []);

        // Fetch user's predictions for these matches
        const matchIds = (matchesData || []).map(m => m.id);
        if (matchIds.length > 0) {
          const { data: predictionsData, error: predictionsError } = await supabase
            .from('match_predictions')
            .select('*')
            .eq('user_id', user.id)
            .in('match_id', matchIds);

          if (predictionsError) throw predictionsError;

          setPredictions(predictionsData || []);

          // Initialize currentPredictions with existing predictions or empty values
          const initialCurrentPredictions: LocalPrediction[] = (matchesData || []).map(match => {
            const existingPrediction = (predictionsData || []).find(p => p.match_id === match.id);
            return {
              match_id: match.id,
              home_score: existingPrediction ? String(existingPrediction.home_score) : '',
              away_score: existingPrediction ? String(existingPrediction.away_score) : '',
              prediction_id: existingPrediction ? existingPrediction.id : undefined,
            };
          });
          setCurrentPredictions(initialCurrentPredictions);
        } else {
          setCurrentPredictions([]); // No matches, so no predictions
        }

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
  }, [user, toast]); // Dependência do 'user' para re-fetch se o login mudar

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

    setIsSaving(true);
    const predictionToSave = currentPredictions.find(p => p.match_id === matchId);

    if (!predictionToSave) {
      toast({
        title: "Erro",
        description: "Palpite não encontrado para salvar.",
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    const homeScore = Number(predictionToSave.home_score);
    const awayScore = Number(predictionToSave.away_score);

    // Validação extra antes de enviar para o DB
    if (predictionToSave.home_score === '' || predictionToSave.away_score === '' || isNaN(homeScore) || isNaN(awayScore)) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, insira placares válidos para ambos os times.",
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    const match = matches.find(m => m.id === matchId);
    if (!match) {
        toast({
            title: "Erro",
            description: "Partida não encontrada.",
            variant: "destructive",
        });
        setIsSaving(false);
        return;
    }

    // Verifica novamente se o prazo está aberto antes de salvar no backend
    const canPredictNow = getCanPredict(match.match_date, match.is_finished);
    if (!canPredictNow) {
        toast({
            title: "Prazo Encerrado",
            description: "O prazo para palpitar nesta partida já se encerrou.",
            variant: "destructive",
        });
        setIsSaving(false);
        return;
    }

    try {
      if (predictionToSave.prediction_id) {
        // Update existing prediction
        const { error: updateError } = await supabase
          .from('match_predictions')
          .update({ home_score: homeScore, away_score: awayScore })
          .eq('id', predictionToSave.prediction_id);

        if (updateError) throw updateError;
        toast({
          title: "Sucesso!",
          description: "Palpite atualizado com sucesso.",
        });
      } else {
        // Insert new prediction
        const { data, error: insertError } = await supabase
          .from('match_predictions')
          .insert({
            user_id: user.id,
            match_id: matchId,
            home_score: homeScore,
            away_score: awayScore,
          })
          .select(); // Select the inserted data to get the new prediction_id

        if (insertError) throw insertError;

        // Update the local state with the new prediction_id
        if (data && data.length > 0) {
            setCurrentPredictions(prev =>
                prev.map(p =>
                    p.match_id === matchId
                        ? { ...p, prediction_id: data[0].id }
                        : p
                )
            );
        }

        toast({
          title: "Sucesso!",
          description: "Palpite salvo com sucesso.",
        });
      }
    } catch (err: any) {
      console.error("Error saving prediction:", err);
      toast({
        title: "Erro ao salvar palpite",
        description: err.message || "Não foi possível salvar seu palpite.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
          Palpites do Dia ({today})
          {isAdmin && (
            <Link to="/admin/dashboard" className="text-sm text-gray-500 hover:underline">
              Ir para Admin
            </Link>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <p className="text-center text-gray-500">Nenhuma partida programada para hoje.</p>
        ) : (
          <div className="space-y-6">
            {matches.map(match => {
              const currentPrediction = currentPredictions.find(p => p.match_id === match.id) || { match_id: match.id, home_score: '', away_score: '' };
              const canPredictForMatch = getCanPredict(match.match_date, match.is_finished);

              // *** NOVA LÓGICA DE VALIDAÇÃO PARA HABILITAR/DESABILITAR O BOTÃO ***
              const isHomeScoreValid = currentPrediction.home_score !== '' && !isNaN(Number(currentPrediction.home_score));
              const isAwayScoreValid = currentPrediction.away_score !== '' && !isNaN(Number(currentPrediction.away_score));
              const areScoresFilledAndValid = isHomeScoreValid && isAwayScoreValid;

              return (
                <div key={match.id} className="border p-4 rounded-lg bg-gray-50">
                  <h3 className="text-lg font-bold mb-2">
                    {match.home_team?.name} vs {match.away_team?.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {format(parseISO(match.match_date), "HH:mm 'h' - dd/MM", { locale: ptBR })} - {match.stage}
                  </p>

                  {/* Condição para desabilitar o input se a partida já terminou ou prazo expirou */}
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
                      disabled={isSaving || !canPredictForMatch} // Inputs desabilitados se salvando ou prazo fechado
                    />
                    <span className="text-xl font-bold">x</span>
                    <Input
                      type="number"
                      min="0"
                      className="w-16 text-center"
                      placeholder="0"
                      value={currentPrediction.away_score}
                      onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                      disabled={isSaving || !canPredictForMatch} // Inputs desabilitados se salvando ou prazo fechado
                    />
                    <Button
                      className="ml-auto bg-fifa-green hover:bg-green-700"
                      onClick={() => handleSavePrediction(match.id)}
                      // *** AQUI ESTÁ A ALTERAÇÃO CRÍTICA ***
                      // O botão será desabilitado se:
                      // 1. Uma operação de salvamento global estiver em andamento (isSaving)
                      // 2. O prazo para palpitar nesta partida específica tiver se encerrado (!canPredictForMatch)
                      // 3. Os placares não estiverem preenchidos OU não forem números válidos (!areScoresFilledAndValid)
                      disabled={isSaving || !canPredictForMatch || !areScoresFilledAndValid}
                    >
                      {currentPrediction.prediction_id ? "Atualizar" : "Salvar"}
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