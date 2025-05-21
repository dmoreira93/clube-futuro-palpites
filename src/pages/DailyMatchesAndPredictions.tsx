import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, User as UserIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  fetchMatchesForDate,
  fetchMatchPredictionsForMatches,
  fetchUsersCustom,
} from '@/utils/pointsCalculator/dataAccess';
import {
  SupabaseMatchResultFromMatches,
  SupabaseMatchPrediction,
  User,
} from '@/utils/pointsCalculator/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Definição de tipos para o que vamos exibir
interface DisplayMatch extends SupabaseMatchResultFromMatches {
  // home_team e away_team agora podem ter uma propriedade 'group' aninhada
  home_team: { name: string; flag_url?: string; group_id?: string; group?: { name: string } } | null;
  away_team: { name: string; flag_url?: string; group_id?: string; group?: { name: string } } | null;
  predictionsByUserId?: {
    [userId: string]: SupabaseMatchPrediction;
  };
}

const DailyMatchesAndPredictions = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyMatches, setDailyMatches] = useState<DisplayMatch[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadDailyData = async () => {
      setLoading(true);
      setError(null);
      try {
        const dateString = format(currentDate, 'yyyy-MM-dd');

        // 1. Fetch matches for the selected date
        const matches = await fetchMatchesForDate(dateString);
        if (!matches || matches.length === 0) {
          setDailyMatches([]);
          setLoading(false);
          return;
        }

        // 2. Fetch all users (to map user_id to user name/avatar)
        const users = await fetchUsersCustom();
        if (!users) {
          throw new Error('Não foi possível carregar os usuários.');
        }
        setAllUsers(users);

        // 3. Fetch predictions for all fetched matches
        const matchIds = matches.map((m) => m.id);
        const allPredictions = await fetchMatchPredictionsForMatches(matchIds);

        // 4. Combine data
        const combinedMatches: DisplayMatch[] = matches.map((match) => {
          const predictionsForThisMatch = (allPredictions || []).filter(
            (p) => p.match_id === match.id
          );

          const predictionsByUserId: { [userId: string]: SupabaseMatchPrediction } = {};
          predictionsForThisMatch.forEach((p) => {
            predictionsByUserId[p.user_id] = p;
          });

          return {
            ...match,
            predictionsByUserId,
          };
        });

        setDailyMatches(combinedMatches);
      } catch (err: any) {
        console.error('Erro ao carregar dados diários:', err);
        setError('Não foi possível carregar os jogos e palpites do dia. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    loadDailyData();
  }, [currentDate]);

  const handleDateChange = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const getDayLabel = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    if (selected.getTime() === today.getTime()) {
      return 'Hoje';
    } else if (selected.getTime() === today.getTime() + 24 * 60 * 60 * 1000) {
      return 'Amanhã';
    } else if (selected.getTime() === today.getTime() - 24 * 60 * 60 * 1000) {
      return 'Ontem';
    } else {
      return format(date, 'dd/MM', { locale: ptBR });
    }
  };

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <Card className="shadow-lg bg-red-100 border-red-400 text-red-700">
            <CardHeader>
              <CardTitle>Erro</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{error}</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Definindo a data limite para exibição dos palpites.
  // Idealmente, esta data viria de uma configuração global ou de uma coluna 'prediction_deadline' na tabela 'matches'.
  // Para este exemplo, estou usando uma data fixa.
  const predictionDisplayCutoffDate = new Date('2025-06-14T23:59:59Z'); // Usar um fuso horário adequado, se aplicável

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center text-fifa-blue mb-8">
          Palpites do Dia
        </h1>

        <div className="flex justify-center items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDateChange(-1)}
            aria-label="Dia anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold text-gray-700">
            {getDayLabel(currentDate)}{' '}
            <span className="text-gray-500">
              {format(currentDate, 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDateChange(1)}
            aria-label="Próximo dia"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        ) : dailyMatches.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 font-semibold text-lg">
              Nenhum jogo encontrado para esta data.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Tente selecionar outra data.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dailyMatches.map((match) => {
              const matchDateTime = parseISO(match.match_date);
              // Os palpites só serão visíveis se a data da partida já passou do cutoff.
              const canShowPredictions = matchDateTime <= predictionDisplayCutoffDate;

              return (
                <Card key={match.id} className="shadow-lg">
                  <CardHeader className="bg-fifa-blue text-white rounded-t-lg">
                    <CardTitle className="text-lg flex justify-between items-center">
                      <span>
                        {match.home_team?.name || 'Time Casa'} vs{' '}
                        {match.away_team?.name || 'Time Fora'}
                      </span>
                      <span className="text-sm">
                        {format(matchDateTime, 'HH:mm', { locale: ptBR })}
                        {/* Acessando o nome do grupo através do relacionamento aninhado */}
                        {match.home_team?.group?.name && (
                          <span className="ml-2"> - Grupo {match.home_team.group.name}</span>
                        )}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {canShowPredictions ? (
                      <>
                        <h3 className="font-bold text-md mb-3 text-fifa-blue">Palpites dos Participantes:</h3>
                        {allUsers.length === 0 ? (
                          <p className="text-gray-500 text-sm">Nenhum participante encontrado.</p>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-2">
                            {allUsers.map((user) => {
                              const prediction = match.predictionsByUserId?.[user.id];
                              const hasPredicted = !!prediction;

                              return (
                                <TooltipProvider key={user.id} delayDuration={0}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors">
                                        <Avatar className="h-8 w-8">
                                          {user.avatar_url ? (
                                            <AvatarImage src={user.avatar_url} alt={user.name} />
                                          ) : (
                                            <AvatarFallback>
                                              {user.name ? user.name.substring(0, 2).toUpperCase() : <UserIcon className="h-4 w-4" />}
                                            </AvatarFallback>
                                          )}
                                        </Avatar>
                                        <div className="flex-grow">
                                          <p className="font-medium text-sm truncate">{user.username || user.name || 'Desconhecido'}</p>
                                          <p className="text-xs text-muted-foreground">
                                            {hasPredicted
                                              ? `Palpite: ${prediction.home_score} x ${prediction.away_score}`
                                              : 'Não palpitou'}
                                          </p>
                                        </div>
                                      </div>
                                    </TooltipTrigger>
                                    {hasPredicted && (
                                      <TooltipContent className="bg-white border shadow-md p-2 rounded-md">
                                        <p className="font-semibold">{user.username || user.name}</p>
                                        <p>Palpite: {prediction.home_score} x {prediction.away_score}</p>
                                        <p className="text-xs text-gray-500">Para {match.home_team?.name} vs {match.away_team?.name}</p>
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                </TooltipProvider>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-orange-600 font-semibold text-lg">
                          Os palpites serão visíveis após {format(predictionDisplayCutoffDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}.
                        </p>
                        <p className="text-gray-500 text-sm mt-2">
                          Volte mais tarde para ver os palpites dos participantes.
                        </p>
                      </div>
                    )}

                    {/* Se a partida terminou, mostrar o resultado real */}
                    {match.is_finished && match.home_score !== null && match.away_score !== null && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-bold text-md text-green-700">Resultado Final:</h4>
                        <p className="text-lg font-bold text-green-700">
                          {match.home_team?.name} {match.home_score} x {match.away_score} {match.away_team?.name}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DailyMatchesAndPredictions;