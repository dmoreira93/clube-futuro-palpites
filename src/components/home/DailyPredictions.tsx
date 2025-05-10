
import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";
import { Match } from "@/types/matches";
import { Prediction } from "@/types/predictions";
import MatchesPredictionsList from "./predictions/MatchesPredictionsList";

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
        // Buscar jogos do dia atual
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
        const matchesWithDetails: Match[] = await Promise.all(
          matchesData.map(async (match) => {
            // Buscar time da casa
            const { data: homeTeam } = await supabase
              .from('teams')
              .select('id, name, flag_url')
              .eq('id', match.home_team_id)
              .single();
            
            // Buscar time visitante
            const { data: awayTeam } = await supabase
              .from('teams')
              .select('id, name, flag_url')
              .eq('id', match.away_team_id)
              .single();
            
            // Buscar palpites para este jogo
            const { data: predictionsData } = await supabase
              .from('predictions')
              .select(`
                id, 
                home_score, 
                away_score, 
                user_id,
                match_id,
                users (name)
              `)
              .eq('match_id', match.id);

            // Process the predictions data to make it compatible with our type
            const typedPredictions: Prediction[] = (predictionsData || []).map((pred: any) => {
              // Create a properly structured prediction object
              const prediction: Prediction = {
                id: pred.id,
                home_score: pred.home_score,
                away_score: pred.away_score,
                user_id: pred.user_id,
                match_id: pred.match_id
              };

              // Handle the user data structure correctly
              if (pred.users && typeof pred.users === 'object') {
                prediction.user = { name: pred.users.name };
              } else if (typeof pred.users === 'string') {
                prediction.user = { name: pred.users };
              }

              return prediction;
            });

            return {
              id: match.id,
              match_date: match.match_date,
              home_team_id: match.home_team_id,
              away_team_id: match.away_team_id,
              home_score: match.home_score,
              away_score: match.away_score,
              is_finished: match.is_finished,
              stage: match.stage,
              home_team: homeTeam || { id: match.home_team_id, name: "Time não definido" },
              away_team: awayTeam || { id: match.away_team_id, name: "Time não definido" },
              predictions: typedPredictions
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
  
  return (
    <Card className="mb-8">
      <CardHeader className="bg-fifa-blue text-white">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Palpites do Dia - {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <MatchesPredictionsList matches={todaysMatches} />
      </CardContent>
    </Card>
  );
};

export default DailyPredictions;
