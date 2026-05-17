import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { MatchWithTeams, Prediction } from '@/types/predictions';
import { isAfter } from 'date-fns';
import { EyeOff } from 'lucide-react';

interface DailyPredictionsProps {
  matches: MatchWithTeams[];
  matchPredictions: Prediction[];
  onMatchPredictionsChange: (predictions: { [key: string]: Prediction }) => void;
}

export function DailyPredictions({
  matches,
  matchPredictions,
  onMatchPredictionsChange,
}: DailyPredictionsProps) {
  // Puxamos o activePool para ler o prazo de bloqueio global do bolão
  const { user, activePool: pool } = useAuth();
  const [predictions, setPredictions] = useState<{ [key: string]: Prediction }>({});

  useEffect(() => {
    const initialPredictions: { [key: string]: Prediction } = {};
    
    if (matches && Array.isArray(matches)) {
      matches.forEach((match) => {
        const existingPrediction = matchPredictions.find(
          (p) => p.matchId === match.id
        );
        initialPredictions[match.id] = existingPrediction || {
          userId: user?.id || "",
          matchId: match.id,
          homeScore: null,
          awayScore: null,
        };
      });
    }

    setPredictions(initialPredictions);
  }, [matches, matchPredictions, user]);

  // --- REGRA DE TRAVA VISUAL (IGUAL À TELA DE ENVIAR PALPITES) ---
  const isVisualLocked = useMemo(() => {
    if (!pool) return true;
    
    // 1. Se houver prazo estipulado no bolão, verifica se já passou
    if (pool.prediction_deadline) {
      return !isAfter(new Date(), new Date(pool.prediction_deadline));
    }

    // 2. Fallback: Se não tiver prazo configurado, trava até o início do primeiro jogo da lista
    if (matches && matches.length > 0) {
      const firstMatchDate = new Date(Math.min(...matches.map(m => new Date(m.match_date).getTime())));
      return !isAfter(new Date(), firstMatchDate);
    }

    return false;
  }, [pool, matches]);

  const handlePredictionChange = (
    matchId: string,
    team: 'home' | 'away',
    score: number | null
  ) => {
    const newPredictions = {
      ...predictions,
      [matchId]: {
        ...predictions[matchId],
        userId: user?.id || "",
        matchId: matchId,
        [`${team}Score`]: score,
      },
    };
    setPredictions(newPredictions);
    onMatchPredictionsChange(newPredictions);
  };

  const isPredictionComplete = (prediction: Prediction) => {
    return prediction.homeScore !== null && prediction.awayScore !== null;
  };

  if (!matches || matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Palpites do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Não há jogos para palpitar hoje.</p>
        </CardContent>
      </Card>
    );
  }

  // --- INTERCEPTAÇÃO DO BLOQUEIO: Mensagem para os curiosos ---
  if (isVisualLocked) {
    return (
      <Card className="border-dashed border-2 border-gray-200 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
            <EyeOff className="h-8 w-8 animate-pulse" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-700">Seu curioso!</CardTitle>
          <p className="text-gray-500 max-w-sm text-sm">
            Os palpites da galera serão mostrados apenas após o encerramento do prazo de apostas ou o início dos jogos.
          </p>
        </CardContent>
      </Card>
    );
  }

  // --- RENDERIZAÇÃO PADRÃO (SÓ EXIBE SE O PRAZO JÁ TIVER VENCIDO) ---
  return (
    <Card>
      <CardHeader>
        <CardTitle>Palpites do Dia</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {matches.map((match) => (
            <div key={match.id} className="p-4 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">{match.home_team.name} vs {match.away_team.name}</span>
                <span className="text-sm text-gray-500">{new Date(match.match_date).toLocaleTimeString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="0"
                  className="w-16 text-center"
                  value={predictions[match.id]?.homeScore ?? ''}
                  onChange={(e) =>
                    handlePredictionChange(match.id, 'home', e.target.value === '' ? null : parseInt(e.target.value))
                  }
                  disabled={!user}
                />
                <span>-</span>
                <Input
                  type="number"
                  min="0"
                  className="w-16 text-center"
                  value={predictions[match.id]?.awayScore ?? ''}
                  onChange={(e) =>
                    handlePredictionChange(match.id, 'away', e.target.value === '' ? null : parseInt(e.target.value))
                  }
                  disabled={!user}
                />
              </div>
              {isPredictionComplete(predictions[match.id] || {}) && (
                <p className="text-green-500 text-xs mt-1">Palpite completo</p>
              )}
            </div>
          ))}
        </div>
        {!user && (
          <p className="text-red-500 text-sm mt-4">
            Você precisa estar logado para salvar seus palpites.
          </p>
        )}
      </CardContent>
    </Card>
  );
}