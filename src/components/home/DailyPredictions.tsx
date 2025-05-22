// src/components/home/DailyPredictions.tsx

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO, isAfter, isBefore } from "date-fns"; // Adicione isBefore
import { ptBR } from "date-fns/locale";
import {
  SupabaseMatchResultFromMatches,
  SupabaseMatchPrediction, // Já deve estar definido
} from "@/utils/pointsCalculator/types"; // Assegure-se que o caminho está correto
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react"; // Importar Info icon

// --- INTERFACES ---
interface LocalPrediction {
  match_id: string;
  home_score: string;
  away_score: string;
  prediction_id?: string;
  is_valid: boolean; // Indica se o palpite está pronto para ser salvo
}

// Props para o DailyPredictions
interface DailyPredictionsProps {
  matchPredictions: LocalPrediction[]; // Recebe os palpites do pai (Palpites.tsx)
  onMatchPredictionsChange: (updatedPredictions: LocalPrediction[]) => void; // Callback para enviar de volta
  globalPredictionCutoffDate: Date; // Recebe o prazo global do pai
}

const DailyPredictions: React.FC<DailyPredictionsProps> = ({
  matchPredictions,
  onMatchPredictionsChange,
  globalPredictionCutoffDate,
}) => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<SupabaseMatchResultFromMatches[]>([]);
  // 'predictions' agora é recebido via props como 'matchPredictions'
  // 'isSaving' agora não é mais necessário aqui, pois o salvamento é no pai
  // const [isSaving, setIsSaving] = useState(false); // Removido

  // Mapeia palpites recebidos para um formato mais fácil de manipular no estado local
  const [localMatchPredictions, setLocalMatchPredictions] = useState<{ [matchId: string]: LocalPrediction }>({});

  useEffect(() => {
    // Ao receber novos matchPredictions do pai, atualiza o estado local
    const newLocalPredictions: { [matchId: string]: LocalPrediction } = {};
    matchPredictions.forEach(p => {
      newLocalPredictions[p.match_id] = p;
    });
    setLocalMatchPredictions(newLocalPredictions);
  }, [matchPredictions]);


  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Buscar apenas as partidas que ainda não foram jogadas (ou que o prazo ainda não encerrou)
      const { data, error } = await supabase
        .from('matches')
        .select('*, home_team(name, flag_url), away_team(name, flag_url)')
        .order('match_date', { ascending: true })
        .gte('match_date', format(new Date(), 'yyyy-MM-dd HH:mm:ssXXX')); // Apenas partidas futuras

      if (error) {
        console.error("Erro ao carregar partidas:", error);
        throw error;
      }

      setMatches(data || []);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar partidas.");
      toast.error("Erro ao carregar partidas: " + (err.message || "Verifique sua conexão."));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Esta função agora determina se o palpite para uma partida específica pode ser feito.
  const getCanPredictForMatch = useCallback((matchDate: string, isFinished: boolean) => {
    if (isFinished) return false; // Se a partida já terminou, não pode palpitar

    const now = new Date();
    // Verifica o prazo global
    if (isAfter(now, globalPredictionCutoffDate)) {
      return false;
    }

    // Verifica o prazo de 1 hora antes da partida
    const matchTime = parseISO(matchDate).getTime();
    const cutoffTime = matchTime - (1 * 60 * 60 * 1000); // 1 hora antes do jogo
    if (now.getTime() > cutoffTime) {
      return false;
    }
    return true;
  }, [globalPredictionCutoffDate]);


  // `handleScoreChange` agora atualiza o estado local e notifica o componente pai
  const handleScoreChange = useCallback((matchId: string, team: 'home' | 'away', value: string) => {
    setLocalMatchPredictions(prev => {
      const current = prev[matchId] || { match_id: matchId, home_score: '', away_score: '', is_valid: false };
      const updated = {
        ...current,
        [team === 'home' ? 'home_score' : 'away_score']: value,
      };

      // Define is_valid baseado no preenchimento
      updated.is_valid = updated.home_score !== '' && updated.away_score !== '';

      const newState = { ...prev, [matchId]: updated };

      // Converte o objeto de volta para um array para enviar ao pai
      onMatchPredictionsChange(Object.values(newState));
      return newState;
    });
  }, [onMatchPredictionsChange]);


  // `handleSavePrediction` agora não salva no Supabase. Ele apenas verifica e mostra toast.
  // O salvamento real será feito pelo botão "Confirmar Palpites" no Palpites.tsx
  const handleSavePrediction = useCallback((matchId: string) => {
    const currentPrediction = localMatchPredictions[matchId];
    if (!currentPrediction || currentPrediction.home_score === '' || currentPrediction.away_score === '') {
      toast.error("Por favor, preencha ambos os placares antes de salvar.");
      return;
    }
    toast.success("Palpite preparado para confirmação geral!");
    // Não faz nada no Supabase, apenas avisa o usuário.
    // O salvamento será feito pelo handleSubmitBets em Palpites.tsx
  }, [localMatchPredictions, toast]);


  // Função para verificar se os scores estão preenchidos e são números válidos
  const areScoresFilledAndValid = useCallback((matchId: string) => {
    const currentPrediction = localMatchPredictions[matchId];
    if (!currentPrediction) return false;
    const homeScore = parseInt(currentPrediction.home_score);
    const awayScore = parseInt(currentPrediction.away_score);
    return !isNaN(homeScore) && !isNaN(awayScore);
  }, [localMatchPredictions]);


  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader><CardTitle>Carregando Partidas...</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erro ao Carregar Partidas</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={fetchMatches} className="mt-2">Tentar Novamente</Button>
      </Alert>
    );
  }

  const hasMatches = matches.length > 0;
  const canPredictGlobal = isBefore(new Date(), globalPredictionCutoffDate); // Prazo global para partidas

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl text-fifa-blue">Palpites das Partidas</CardTitle>
        <CardDescription>
          Preencha seus palpites para o placar de cada partida. Você pode salvar individualmente ou confirmar todos no final.
        </CardDescription>
        {!canPredictGlobal && (
          <Alert variant="warning" className="mt-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Prazo Encerrado</AlertTitle>
            <AlertDescription>
              O prazo geral para palpitar nas partidas se encerrou em {format(globalPredictionCutoffDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}. Você não pode mais submeter ou alterar palpites de partida.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent>
        {!hasMatches ? (
          <p className="text-center text-gray-500 py-4">Nenhuma partida futura para palpitar.</p>
        ) : (
          <div className="space-y-6">
            {matches.map(match => {
              const currentPrediction = localMatchPredictions[match.id] || {
                match_id: match.id,
                home_score: '',
                away_score: '',
                is_valid: false,
              };
              const canPredictForMatch = getCanPredictForMatch(match.match_date, match.is_finished);

              // Determina se o botão "Salvar" individual deve estar desabilitado
              const isIndividualSaveDisabled = !canPredictForMatch || !areScoresFilledAndValid(match.id);

              return (
                <div key={match.id} className="border p-4 rounded-lg bg-gray-50">
                  <p className="text-md font-semibold text-gray-800">
                    {format(parseISO(match.match_date), "dd/MM/yyyy - HH:mm", { locale: ptBR })} ({match.stage})
                  </p>
                  <div className="flex items-center justify-between my-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={match.home_team?.flag_url || ''} />
                        <AvatarFallback>{match.home_team?.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{match.home_team?.name || 'Time Casa'}</span>
                    </div>
                    <span className="text-xl font-bold text-gray-700">vs</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{match.away_team?.name || 'Time Fora'}</span>
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={match.away_team?.flag_url || ''} />
                        <AvatarFallback>{match.away_team?.name.substring(0, 2)}</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>

                  {/* Mensagem de prazo se aplicável */}
                  {!canPredictForMatch && (
                    <Alert variant="warning" className="mb-3">
                      <Info className="h-4 w-4" />
                      <AlertTitle>Prazo Encerrado para esta partida</AlertTitle>
                      <AlertDescription>
                        O prazo para palpitar nesta partida específica já encerrou.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      className="w-16 text-center"
                      placeholder="0"
                      value={currentPrediction.home_score}
                      onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)}
                      disabled={!canPredictForMatch} // Inputs desabilitados se prazo fechado
                    />
                    <span className="text-xl font-bold">x</span>
                    <Input
                      type="number"
                      min="0"
                      className="w-16 text-center"
                      placeholder="0"
                      value={currentPrediction.away_score}
                      onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                      disabled={!canPredictForMatch} // Inputs desabilitados se prazo fechado
                    />
                    {/* O botão "Salvar" individual agora apenas "prepara" o palpite para o botão global */}
                    <Button
                      className="ml-auto bg-fifa-green hover:bg-green-700"
                      onClick={() => handleSavePrediction(match.id)}
                      disabled={isIndividualSaveDisabled} // Desabilitado se não pode palpitar ou scores inválidos
                    >
                      {currentPrediction.prediction_id ? "Palpite Registrado" : "Pronto para Confirmar"}
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