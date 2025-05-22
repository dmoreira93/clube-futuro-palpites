// src/components/home/DailyPredictions.tsx

import { useState, useEffect, useCallback } from "react"; // Adicionado useCallback
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button"; // REMOVIDO: Não precisamos mais do Button aqui
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  SupabaseMatchResultFromMatches,
  SupabaseMatchPrediction,
} from "@/utils/pointsCalculator/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

// Interface para um palpite no estado local
export interface LocalPrediction { // EXPORTADO para ser usado em Palpites.tsx
  match_id: string;
  home_score: string; // Mantém como string para input
  away_score: string; // Mantém como string para input
  prediction_id?: string; // ID do palpite existente, se houver
  match_date: string; // Adicionado para a lógica de prazo no componente pai
  is_finished: boolean; // Adicionado para a lógica de prazo no componente pai
}

// Props que este componente receberá do pai (Palpites.tsx)
interface DailyPredictionsProps {
  onPredictionsChange: (predictions: LocalPrediction[]) => void;
  // onSave: (predictionsToSave: LocalPrediction[]) => void; // Opcional, se quisesse um botão interno para salvar tudo
  // isSavingGlobal?: boolean; // Se o botão geral de salvar deve desabilitar os inputs
}

// Renomeado para DailyPredictions, mas agora recebe props
const DailyPredictions: React.FC<DailyPredictionsProps> = ({ onPredictionsChange }) => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<SupabaseMatchResultFromMatches[]>([]);
  const [currentPredictions, setCurrentPredictions] = useState<LocalPrediction[]>([]);
  // 'isSaving' global será gerenciado no componente pai (Palpites.tsx)

  const getCanPredict = (matchDate: string, isFinished: boolean) => {
    const matchTime = parseISO(matchDate).getTime();
    const now = new Date().getTime();
    const cutoffTime = matchTime - (1 * 60 * 60 * 1000); // 1 hora antes do jogo

    if (isFinished) return false;
    if (now > cutoffTime) return false;
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
        const today = format(new Date(), 'yyyy-MM-dd');
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('*, home_team(*), away_team(*)')
          .gte('match_date', today) // Buscar a partir de hoje em diante
          .order('match_date', { ascending: true });

        if (matchesError) throw matchesError;

        setMatches(matchesData || []);

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

        const initialCurrentPredictions: LocalPrediction[] = (matchesData || []).map(match => {
          const existingPrediction = predictionsData.find(p => p.match_id === match.id);
          return {
            match_id: match.id,
            home_score: existingPrediction ? String(existingPrediction.home_score) : '',
            away_score: existingPrediction ? String(existingPrediction.away_score) : '',
            prediction_id: existingPrediction ? existingPrediction.id : undefined,
            match_date: match.match_date, // Incluindo para uso na validação externa
            is_finished: match.is_finished, // Incluindo para uso na validação externa
          };
        });
        setCurrentPredictions(initialCurrentPredictions);
        onPredictionsChange(initialCurrentPredictions); // Notifica o pai com os palpites iniciais

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
  }, [user, toast, onPredictionsChange]); // Adicionado onPredictionsChange nas dependências

  const handleScoreChange = useCallback((matchId: string, type: 'home' | 'away', value: string) => {
    setCurrentPredictions(prev => {
      const updatedPredictions = prev.map(p =>
        p.match_id === matchId
          ? { ...p, [type]: value }
          : p
      );
      onPredictionsChange(updatedPredictions); // Notifica o pai sobre CADA mudança
      return updatedPredictions;
    });
  }, [onPredictionsChange]);


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
                match_date: match.match_date, // Garante que a data da partida está no objeto
                is_finished: match.is_finished, // Garante que o status está no objeto
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
                      disabled={!canPredictForMatch} // Inputs desabilitados se o prazo fechou
                    />
                    <span className="text-xl font-bold">x</span>
                    <Input
                      type="number"
                      min="0"
                      className="w-16 text-center"
                      placeholder="0"
                      value={currentPrediction.away_score}
                      onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                      disabled={!canPredictForMatch} // Inputs desabilitados se o prazo fechou
                    />
                    {/* Botão de salvar individual REMOVIDO AQUI */}
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