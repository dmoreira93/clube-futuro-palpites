// src/components/predictions/DailyMatchPredictions.tsx

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchCard } from '@/components/results/MatchCard'; // Reutiliza o MatchCard
import { fetchMatchesForDate, fetchMatchPredictionsForMatches, fetchUsersCustom } from '@/lib/dataAccess';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SupabaseMatchResultFromMatches, SupabaseMatchPrediction, User } from '@/lib/types'; // Assegure-se de que os tipos estão corretos
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react'; // Ícone para mensagens

interface DailyMatchPredictionsProps {
  date: Date; // A data para a qual buscar os jogos e palpites
}

const DailyMatchPredictions: React.FC<DailyMatchPredictionsProps> = ({ date }) => {
  const [matches, setMatches] = useState<SupabaseMatchResultFromMatches[]>([]);
  const [predictions, setPredictions] = useState<SupabaseMatchPrediction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formattedDate = format(date, 'dd/MM/yyyy', { locale: ptBR });
  const dateString = format(date, 'yyyy-MM-dd'); // Formato para a busca no Supabase

  useEffect(() => {
    const loadDailyData = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedMatches = await fetchMatchesForDate(dateString);
        if (!fetchedMatches) {
          setError('Não foi possível carregar as partidas do dia.');
          setLoading(false);
          return;
        }
        setMatches(fetchedMatches);

        const matchIds = fetchedMatches.map(m => m.id);
        const fetchedPredictions = await fetchMatchPredictionsForMatches(matchIds);
        if (!fetchedPredictions) {
          setError('Não foi possível carregar os palpites.');
          setLoading(false);
          return;
        }
        setPredictions(fetchedPredictions);

        const fetchedUsers = await fetchUsersCustom();
        if (!fetchedUsers) {
          setError('Não foi possível carregar os usuários.');
          setLoading(false);
          return;
        }
        setUsers(fetchedUsers);

      } catch (err: any) {
        console.error('Erro ao carregar dados diários:', err);
        setError('Ocorreu um erro ao carregar os dados. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    loadDailyData();
  }, [dateString]); // Recarrega se a data mudar

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <Info className="h-4 w-4" />
        <AlertTitle>Erro!</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-md">
        <p className="text-gray-500">Nenhum jogo agendado ou resultado disponível para {formattedDate}.</p>
        <p className="text-gray-500">Verifique outro dia ou aguarde a atualização dos jogos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center text-fifa-blue">Palpites para {formattedDate}</h2>
      {matches.map(match => {
        const matchPredictions = predictions.filter(p => p.match_id === match.id);
        const homeTeamName = match.home_team?.name || 'Time Casa';
        const awayTeamName = match.away_team?.name || 'Time Fora';

        return (
          <Card key={match.id} className="shadow-lg">
            <CardHeader className="bg-gray-100">
              <CardTitle className="text-lg">
                {homeTeamName} vs {awayTeamName}
                {match.is_finished ? (
                  <span className="ml-2 text-base font-semibold text-gray-700">
                    ({match.home_score} x {match.away_score})
                  </span>
                ) : (
                  <span className="ml-2 text-base font-semibold text-gray-700">
                     ({format(new Date(match.match_date!), 'HH:mm', { locale: ptBR })})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="mb-4">
                {/* Reutiliza o MatchCard para exibir as informações básicas da partida */}
                <MatchCard
                  id={match.id}
                  homeTeam={homeTeamName}
                  awayTeam={awayTeamName}
                  date={match.match_date ? new Date(match.match_date).toISOString() : ''}
                  time={match.match_date ? format(new Date(match.match_date), 'HH:mm', { locale: ptBR }) : ''}
                  homeTeamFlag={match.home_team?.flag_url || ''}
                  awayTeamFlag={match.away_team?.flag_url || ''}
                  stage={match.stage || ''}
                  group={match.home_team?.group_id ? { name: match.home_team.group_id } : undefined}
                  selected={false}
                  // Adicione as props homeScore, awayScore, isMatchFinished aqui se MatchCard for atualizado para recebê-las
                  // homeScore={match.home_score}
                  // awayScore={match.away_score}
                  // isMatchFinished={match.is_finished}
                />
              </div>

              <h3 className="text-md font-semibold mb-2 text-fifa-blue">Palpites dos Participantes:</h3>
              {matchPredictions.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum palpite registrado para esta partida ainda.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {matchPredictions.map(prediction => {
                    const user = users.find(u => u.id === prediction.user_id);
                    if (!user) return null; // Não exibe se o usuário não for encontrado

                    return (
                      <div key={prediction.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded-md">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}:</span>
                        <span>{prediction.home_score} x {prediction.away_score}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DailyMatchPredictions;