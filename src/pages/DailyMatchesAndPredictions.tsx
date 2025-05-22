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
} from '@/utils/pointsCalculator/dataAccess'; // Ajuste o caminho se for '@/lib/dataAccess'
import {
  SupabaseMatchResultFromMatches,
  SupabaseMatchPrediction,
  User, // Certifique-se de que User tem 'is_admin'
} from '@/utils/pointsCalculator/types'; // Ajuste o caminho se for '@/lib/types'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Definição de tipos para o que vamos exibir
interface DisplayMatch extends SupabaseMatchResultFromMatches {
  home_team: { name: string; flag_url?: string; group_id?: string; group?: { name: string } } | null;
  away_team: { name: string; flag_url?: string; group_id?: string; group?: { name: string } } | null;
  predictionsByUserId?: { [userId: string]: SupabaseMatchPrediction }; // Adicione esta linha se não tiver
}

const DailyMatchesAndPredictions: React.FC = () => {
  const [matches, setMatches] = useState<DisplayMatch[]>([]);
  const [allPredictions, setAllPredictions] = useState<SupabaseMatchPrediction[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // Renomeado para 'allUsers' para clareza
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Data de corte para exibir os palpites (14/06/2025 às 18:00)
  // Certifique-se de que o fuso horário está correto ou use UTC se preferir.
  const predictionDisplayCutoffDate = new Date('2025-06-14T18:00:00-03:00');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const formattedDate = format(currentDate, 'yyyy-MM-dd');

        // Fetch matches for the current date
        const matchesData = await fetchMatchesForDate(formattedDate);
        if (!matchesData) {
          setMatches([]);
          setAllPredictions([]);
          setAllUsers([]);
          setLoading(false);
          return;
        }

        // Fetch predictions for these matches
        const matchIds = matchesData.map(match => match.id);
        const predictionsData = await fetchMatchPredictionsForMatches(matchIds);

        // Fetch all users and FILTER OUT ADMINS here
        const usersData = await fetchUsersCustom();
        const nonAdminUsers = usersData.filter(user => !user.is_admin); // <--- FILTRAGEM DE ADMINS

        setMatches(matchesData);
        setAllPredictions(predictionsData || []);
        setAllUsers(nonAdminUsers || []); // Armazena apenas usuários não administradores

      } catch (err: any) {
        console.error("Erro ao carregar dados:", err.message);
        setError("Não foi possível carregar os dados das partidas e palpites.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentDate]); // Dependência para recarregar quando a data mudar

  const handleDateChange = (days: number) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(prevDate.getDate() + days);
      return newDate;
    });
  };

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto p-4 text-center text-red-600">
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Erro ao carregar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
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
              // Filtrar os palpites relevantes para esta partida E que são de usuários não administradores
              const matchPredictions = allPredictions.filter(
                p => p.match_id === match.id && allUsers.some(u => u.id === p.user_id) // Verifica se o user_id do palpite está na lista de usuários não admin
              );

              const shouldShowPredictions = Date.now() > predictionDisplayCutoffDate.getTime();

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
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            {matchPredictions.map(prediction => {
                              const user = allUsers.find(u => u.id === prediction.user_id);
                              // Garante que o usuário existe e não é admin (já filtrado em allUsers)
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