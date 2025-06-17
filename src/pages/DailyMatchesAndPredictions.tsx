// src/pages/DailyMatchesAndPredictions.tsx (VERSÃO ATUALIZADA)

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO, startOfDay, addDays, subHours, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext'; // IMPORTADO
import {
  fetchMatchPredictionsForMatches,
  fetchUsersCustom,
  fetchMatchesInUTCRange,
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Definição de tipos (sem alteração)
interface DisplayMatch extends SupabaseMatchResultFromMatches {
  home_team: { name: string; flag_url?: string; group_id?: string; group?: { name: string } } | null;
  away_team: { name: string; flag_url?: string; group_id?: string; group?: { name: string } } | null;
  predictionsByUserId?: { [userId: string]: SupabaseMatchPrediction };
}

const DailyMatchesAndPredictions: React.FC = () => {
  const { pool } = useAuth(); // Usando o contexto para pegar os dados do bolão
  const [matches, setMatches] = useState<DisplayMatch[]>([]);
  const [allPredictions, setAllPredictions] = useState<SupabaseMatchPrediction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // REMOVIDA a data fixa que estava aqui

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const startOfBrasiliaDay = startOfDay(currentDate);
        const startOfNextBrasiliaDay = startOfDay(addDays(currentDate, 1));
        const utcStartString = subHours(startOfBrasiliaDay, -3).toISOString();
        const utcEndString = subHours(startOfNextBrasiliaDay, -3).toISOString();

        const matchesData = await fetchMatchesInUTCRange(utcStartString, utcEndString);

        if (!matchesData || matchesData.length === 0) {
          setMatches([]);
          setAllPredictions([]);
          setAllUsers([]);
        } else {
            const matchIds = matchesData.map(match => match.id);
            const predictionsData = await fetchMatchPredictionsForMatches(matchIds);
            const usersData = await fetchUsersCustom();
            const nonAdminUsers = usersData.filter(user => !user.is_admin);

            setMatches(matchesData);
            setAllPredictions(predictionsData || []);
            setAllUsers(nonAdminUsers || []);
        }

      } catch (err: any) {
        console.error("Erro ao carregar dados:", err.message);
        setError("Não foi possível carregar os dados das partidas e palpites.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentDate]);

  const handleDateChange = (days: number) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(prevDate.getDate() + days);
      return newDate;
    });
  };

  // --- NOVA LÓGICA DE VISUALIZAÇÃO ---
  const shouldShowPredictions = pool?.prediction_deadline
    ? isAfter(new Date(), new Date(pool.prediction_deadline))
    : false;

  const deadlineFormatted = pool?.prediction_deadline
    ? format(new Date(pool.prediction_deadline), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : "indefinido";

  if (error) {
    return (
      <div className="container mx-auto p-4 text-center text-red-600">
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Erro ao carregar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center text-fifa-blue mb-8">Palpites dos Participantes por Partida</h1>

      <div className="flex justify-center items-center gap-4 mb-8">
        <Button variant="outline" onClick={() => handleDateChange(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="text-xl font-semibold text-gray-700">
          {format(currentDate, 'EEEE, dd \'de\' MMMM', { locale: ptBR })}
        </span>
        <Button variant="outline" onClick={() => handleDateChange(1)}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : matches.length === 0 ? (
        <p className="text-center text-gray-600 text-lg">Nenhuma partida programada para esta data.</p>
      ) : (
        <div className="space-y-6">
          {matches.map(match => {
            const matchPredictions = allPredictions.filter(
              p => p.match_id === match.id && allUsers.some(u => u.id === p.user_id)
            );

            return (
              <Card key={match.id} className="shadow-lg">
                <CardHeader className="bg-fifa-blue text-white rounded-t-lg">
                  <CardTitle className="text-lg">
                    {match.home_team?.name || 'Time Casa'} vs {match.away_team?.name || 'Time Fora'}
                  </CardTitle>
                  <p className="text-sm">
                    {format(parseISO(match.match_date), 'dd/MM HH:mm', { locale: ptBR })} - {match.stage}
                  </p>
                </CardHeader>
                <CardContent className="p-4">
                  {shouldShowPredictions ? (
                    <>
                      <h3 className="text-md font-semibold mb-2 text-fifa-blue">Palpites dos Participantes:</h3>
                      {matchPredictions.length === 0 ? (
                        <p className="text-gray-500 text-sm">Nenhum palpite registrado para esta partida ainda.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          {matchPredictions.map(prediction => {
                            const user = allUsers.find(u => u.id === prediction.user_id);
                            if (!user) return null;

                            return (
                              <TooltipProvider key={prediction.id}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-md">
                                      <Avatar className="h-6 w-6">
                                        <AvatarImage src={user.avatar_url || ''} />
                                        <AvatarFallback>{user.name ? user.name.substring(0, 2).toUpperCase() : '?'}</AvatarFallback>
                                      </Avatar>
                                      <span className="font-medium">{user.name || 'Usuário Desconhecido'}:</span>
                                      <span>{prediction.home_score} x {prediction.away_score}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{user.name || 'Usuário Desconhecido'}</p>
                                  </TooltipContent>
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
                        Os palpites serão visíveis após o prazo final do bolão.
                      </p>
                      <p className="text-gray-500 text-sm mt-2">
                        Prazo: {deadlineFormatted}.
                      </p>
                    </div>
                  )}
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
  );
};

export default DailyMatchesAndPredictions;