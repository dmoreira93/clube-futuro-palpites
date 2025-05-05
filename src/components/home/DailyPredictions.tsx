
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type User = {
  name: string;
};

type Prediction = {
  id: string;
  home_score: number;
  away_score: number;
  user_id: string;
  user?: User;
};

type Team = {
  id: string;
  name: string;
};

type Match = {
  id: string;
  match_date: string;
  home_team_id: string;
  away_team_id: string;
  home_team?: Team;
  away_team?: Team;
  home_score: number | null;
  away_score: number | null;
  is_finished: boolean;
  predictions: Prediction[];
  stage: string;
};

const DailyPredictions = () => {
  const [todaysMatches, setTodaysMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Verificar se a data atual é posterior a 14/06/2025
  const currentDate = new Date();
  const releaseDate = new Date("2025-06-14");
  const shouldShowPredictions = currentDate >= releaseDate;
  
  useEffect(() => {
    if (!shouldShowPredictions) {
      setLoading(false);
      return;
    }

    const fetchTodaysMatches = async () => {
      setLoading(true);
      
      // Obter a data atual no formato ISO
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
      
      try {
        // Buscar jogos do dia atual com especificação dos ids para as relações
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select(`
            id,
            match_date,
            home_score,
            away_score,
            is_finished,
            stage,
            home_team_id,
            away_team_id
          `)
          .gte('match_date', startOfDay)
          .lt('match_date', endOfDay);

        if (matchesError) {
          console.error("Erro ao buscar jogos:", matchesError);
          return;
        }

        if (!matchesData || matchesData.length === 0) {
          setTodaysMatches([]);
          setLoading(false);
          return;
        }

        // Para cada jogo, buscar os times e os palpites relacionados
        const matchesWithDetails = await Promise.all(
          matchesData.map(async (match) => {
            // Buscar time da casa
            const { data: homeTeam, error: homeTeamError } = await supabase
              .from('teams')
              .select('id, name')
              .eq('id', match.home_team_id)
              .single();
            
            if (homeTeamError) {
              console.error(`Erro ao buscar time da casa para o jogo ${match.id}:`, homeTeamError);
            }

            // Buscar time visitante
            const { data: awayTeam, error: awayTeamError } = await supabase
              .from('teams')
              .select('id, name')
              .eq('id', match.away_team_id)
              .single();
            
            if (awayTeamError) {
              console.error(`Erro ao buscar time visitante para o jogo ${match.id}:`, awayTeamError);
            }

            // Buscar palpites para este jogo
            const { data: predictionsData, error: predictionsError } = await supabase
              .from('predictions')
              .select('id, home_score, away_score, user_id')
              .eq('match_id', match.id);

            if (predictionsError) {
              console.error(`Erro ao buscar palpites para o jogo ${match.id}:`, predictionsError);
              return {
                ...match,
                home_team: homeTeam || { id: match.home_team_id, name: "Time não definido" },
                away_team: awayTeam || { id: match.away_team_id, name: "Time não definido" },
                predictions: []
              };
            }

            // Buscar usuários para todos os palpites
            const predictionsWithUsers = await Promise.all(
              (predictionsData || []).map(async (prediction) => {
                const { data: userData, error: userError } = await supabase
                  .from('users')
                  .select('name')
                  .eq('id', prediction.user_id)
                  .single();
                
                if (userError) {
                  console.error(`Erro ao buscar usuário ${prediction.user_id}:`, userError);
                  return {
                    ...prediction,
                    user: { name: "Usuário desconhecido" }
                  };
                }

                return {
                  ...prediction,
                  user: userData
                };
              })
            );

            return {
              ...match,
              home_team: homeTeam || { id: match.home_team_id, name: "Time não definido" },
              away_team: awayTeam || { id: match.away_team_id, name: "Time não definido" },
              predictions: predictionsWithUsers || []
            };
          })
        );

        setTodaysMatches(matchesWithDetails);
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaysMatches();
  }, [shouldShowPredictions]);

  if (!shouldShowPredictions) {
    return null; // Não mostrar nada se for antes da data de lançamento
  }

  const formatMatchDate = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
  };

  if (loading) {
    return (
      <Card className="mb-8">
        <CardHeader className="bg-fifa-blue text-white">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Carregando palpites do dia...
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (todaysMatches.length === 0) {
    return (
      <Card className="mb-8">
        <CardHeader className="bg-fifa-blue text-white">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Palpites do Dia
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum jogo programado para hoje.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader className="bg-fifa-blue text-white">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Palpites do Dia - {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Accordion type="single" collapsible className="w-full">
          {todaysMatches.map((match) => (
            <AccordionItem key={match.id} value={match.id}>
              <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                <div className="flex flex-col sm:flex-row w-full justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-fifa-blue text-fifa-blue">
                      {match.stage}
                    </Badge>
                    <span className="text-sm text-gray-500">{formatMatchDate(match.match_date)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{match.home_team?.name || "Time da Casa"}</span>
                    <div className="bg-gray-100 px-3 py-1 rounded-lg">
                      {match.is_finished ? `${match.home_score} - ${match.away_score}` : "vs"}
                    </div>
                    <span className="font-semibold">{match.away_team?.name || "Time Visitante"}</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="px-4 py-2">
                  <h3 className="font-medium mb-2">Palpites dos participantes:</h3>
                  {match.predictions.length === 0 ? (
                    <p className="text-gray-500 italic py-2">Nenhum palpite registrado para este jogo.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Participante</TableHead>
                            <TableHead className="text-center">{match.home_team?.name || "Time da Casa"}</TableHead>
                            <TableHead className="text-center">{match.away_team?.name || "Time Visitante"}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {match.predictions.map((prediction) => (
                            <TableRow key={prediction.id}>
                              <TableCell>{prediction.user?.name || "Usuário desconhecido"}</TableCell>
                              <TableCell className="text-center font-semibold">{prediction.home_score}</TableCell>
                              <TableCell className="text-center font-semibold">{prediction.away_score}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default DailyPredictions;
