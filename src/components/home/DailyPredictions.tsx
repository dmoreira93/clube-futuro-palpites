import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { MatchWithTeams, Prediction } from '@/types/predictions';

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
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<{ [key: string]: Prediction }>({});

  useEffect(() => {
    const initialPredictions: { [key: string]: Prediction } = {};
    
    // CORREÇÃO: Adicionada verificação para garantir que 'matches' é um array antes de usar o forEach.
    // Isso impede o erro "Cannot read properties of undefined (reading 'forEach')".
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
          <p>Não há jogos para palpitar hoje.</p>
        </CardContent>
      </Card>
    );
  }

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