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
  const [predictions, setPredictions] = useState<{
    [matchId: string]: LocalPrediction;
  }>({});
  const [isSaving, setIsSaving] = useState(false);

  const globalPredictionCutoffDate = new Date('2025-06-14T23:59:59-03:00'); // Exemplo: 14 de junho de 2025, 23:59:59 no fuso horário -03:00

  // Verifica se o usuário está logado
  if (!user) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="bg-fifa-blue text-white rounded-t-lg">
          <CardTitle className="text-lg">Próximos Jogos e Seus Palpites</CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-center text-gray-600">
          <p>Faça login para ver as próximas partidas e registrar seus palpites.</p>
        </CardContent>
      </Card>
    );
  }

  // Verifica se o usuário é um administrador
  if (isAdmin) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="bg-fifa-blue text-white rounded-t-lg">
          <CardTitle className="text-lg">Próximos Jogos e Seus Palpites</CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-center text-gray-600">
          <p>Esta seção é destinada aos participantes do bolão. Como administrador, você não registra palpites aqui.</p>
          <p className="mt-2 text-sm">Gerencie o bolão através do <Link to="/admin" className="text-fifa-blue underline">Painel de Admin</Link>.</p>
        </CardContent>
      </Card>
    );
  }


  useEffect(() => {
    const fetchMatchesAndPredictions = async () => {
      setLoading(true);
      setError(null);
      try {
        const today = format(new Date(), "yyyy-MM-dd");

        // Buscar partidas futuras (a partir de hoje) que ainda não terminaram
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('*, home_team:home_team_id(name, flag_url), away_team:away_team_id(name, flag_url)')
          .gte('match_date', `${today}T00:00:00Z`) // Partidas de hoje em diante
          .eq('is_finished', false) // Apenas partidas não finalizadas
          .order('match_date', { ascending: true })
          .limit(5); // Limita para as próximas 5 partidas, ajuste se necessário

        if (matchesError) throw matchesError;

        setMatches(matchesData || []);

        // Buscar palpites existentes para as partidas que foram encontradas
        const matchIds = matchesData?.map(m => m.id) || [];
        if (matchIds.length > 0) {
          const { data: predictionsData, error: predictionsError } = await supabase
            .from('match_predictions')
            .select('id, match_id, home_score, away_score')
            .eq('user_id', user.id) // Busca apenas os palpites do usuário logado
            .in('match_id', matchIds);

          if (predictionsError) throw predictionsError;

          const initialPredictions: { [matchId: string]: LocalPrediction } = {};
          predictionsData?.forEach(p => {
            initialPredictions[p.match_id] = {
              match_id: p.match_id,
              home_score: String(p.home_score),
              away_score: String(p.away_score),
              prediction_id: p.id,
            };
          });
          setPredictions(initialPredictions);
        }

      } catch (err: any) {
        console.error("Erro ao carregar partidas e palpites:", err.message);
        setError("Não foi possível carregar as próximas partidas e seus palpites.");
      } finally {
        setLoading(false);
      }
    };

    fetchMatchesAndPredictions();
  }, [user]);

  const handleScoreChange = (matchId: string, team: 'home' | 'away', value: string) => {
    setPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || { match_id: matchId, home_score: '', away_score: '' }),
        [team === 'home' ? 'home_score' : 'away_score']: value,
      }
    }));
  };

  const handleSavePrediction = async (matchId: string) => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para salvar um palpite.",
        variant: "destructive",
      });
      return;
    }

    const matchToPredict = matches.find(m => m.id === matchId);
    if (!matchToPredict) {
      toast({
        title: "Erro",
        description: "Partida não encontrada.",
        variant: "destructive",
      });
      return;
    }

    // LÓGICA DE BLOQUEIO DE ENVIO/EDIÇÃO DE PALPITES
    const matchDate = parseISO(matchToPredict.match_date);
    if (matchDate <= globalPredictionCutoffDate) {
      toast({
        title: "Palpite Bloqueado",
        description: `Não é possível registrar ou alterar palpites para esta partida após ${format(globalPredictionCutoffDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}.`,
        variant: "destructive",
      });
      return;
    }

    const prediction = predictions[matchId];
    if (!prediction || prediction.home_score === '' || prediction.away_score === '') {
      toast({
        title: "Erro",
        description: "Preencha os dois placares antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    const homeScoreNum = parseInt(prediction.home_score);
    const awayScoreNum = parseInt(prediction.away_score);

    if (isNaN(homeScoreNum) || isNaN(awayScoreNum) || homeScoreNum < 0 || awayScoreNum < 0) {
      toast({
        title: "Erro de Palpite",
        description: "Os placares devem ser números inteiros e não negativos.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (prediction.prediction_id) {
        // Atualizar palpite existente
        const { error: updateError } = await supabase
          .from('match_predictions')
          .update({ home_score: homeScoreNum, away_score: awayScoreNum })
          .eq('id', prediction.prediction_id);

        if (updateError) throw updateError;

        toast({
          title: "Sucesso",
          description: "Palpite atualizado com sucesso!",
        });
      } else {
        // Inserir novo palpite
        const { data, error: insertError } = await supabase
          .from('match_predictions')
          .insert({
            match_id: matchId,
            user_id: user.id,
            home_score: homeScoreNum,
            away_score: awayScoreNum,
          })
          .select('id')
          .single();

        if (insertError) throw insertError;

        setPredictions(prev => ({
          ...prev,
          [matchId]: { ...prev[matchId], prediction_id: data.id }
        }));
        toast({
          title: "Sucesso",
          description: "Palpite salvo com sucesso!",
        });
      }
    } catch (err: any) {
      console.error("Erro ao salvar palpite:", err.message);
      toast({
        title: "Erro ao salvar palpite",
        description: err.message || "Ocorreu um erro ao tentar salvar seu palpite.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-fifa-blue text-white rounded-t-lg">
        <CardTitle className="text-lg">Próximos Jogos e Seus Palpites</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : error ? (
          <p className="text-red-500 text-sm">{error}</p>
        ) : matches.length === 0 ? (
          <p className="text-gray-500 text-center">Nenhum jogo futuro disponível para palpite no momento.</p>
        ) : (
          <div className="space-y-4">
            {matches.map((match) => {
              const currentPrediction = predictions[match.id] || { home_score: '', away_score: '' };
              const matchDateTime = parseISO(match.match_date);
              const canPredict = matchDateTime > globalPredictionCutoffDate;

              return (
                <div key={match.id} className="border p-4 rounded-md shadow-sm bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-fifa-blue">
                      {match.home_team?.name || 'Time Casa'} vs{' '}
                      {match.away_team?.name || 'Time Fora'}
                    </span>
                    <span className="text-sm text-gray-600">
                      {format(matchDateTime, 'dd/MM HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                  {!canPredict && (
                    <p className="text-red-600 text-sm font-medium mb-2">
                      Prazo para palpite encerrado em {format(globalPredictionCutoffDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}.
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
                      disabled={isSaving || !canPredict}
                    />
                    <span className="text-xl font-bold">x</span>
                    <Input
                      type="number"
                      min="0"
                      className="w-16 text-center"
                      placeholder="0"
                      value={currentPrediction.away_score}
                      onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                      disabled={isSaving || !canPredict}
                    />
                    <Button
                      className="ml-auto bg-fifa-green hover:bg-green-700"
                      onClick={() => handleSavePrediction(match.id)}
                      disabled={isSaving || !canPredict}
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