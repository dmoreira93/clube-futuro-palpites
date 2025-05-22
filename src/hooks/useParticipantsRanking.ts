import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { calculateMatchPoints } from "@/utils/points/matchPoints";
import { calculateTournamentFinalPoints } from "@/utils/points/finalPoints";
import { Database } from "@/types/supabase";
import { getRealTournamentResults } from "@/utils/getRealTournamentResults";

type MatchPrediction = Database["public"]["Tables"]["match_predictions"]["Row"];
type FinalPrediction = Database["public"]["Tables"]["tournament_final_predictions"]["Row"];
type Match = Database["public"]["Tables"]["matches"]["Row"];
type Team = Database["public"]["Tables"]["teams"]["Row"];

interface Participant {
  id: string;
  name: string;
  points: number;
  position: number;
}

interface TournamentFinalPredictions {
  champion: number;
  runnerUp: number;
  thirdPlace: number;
  fourthPlace: number;
  finalScore: {
    homeGoals: number;
    awayGoals: number;
  };
}

interface TournamentFinalResults extends TournamentFinalPredictions {}

export function useParticipantsRanking() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, name");

      const { data: predictionsData, error: predictionsError } = await supabase
        .from("match_predictions")
        .select("user_id, match_id, home_goals, away_goals, match:matches(id, home_team_id, away_team_id, home_team_goals, away_team_goals)");

      const { data: finalPredictionsData, error: finalPredictionsError } = await supabase
        .from("tournament_final_predictions")
        .select("*");

      const realTournamentResults = await getRealTournamentResults();

      if (usersError || predictionsError || finalPredictionsError) {
        console.error("Erro ao buscar dados:", usersError || predictionsError || finalPredictionsError);
        setLoading(false);
        return;
      }

      const userPointsMap: Record<string, number> = {};

      predictionsData?.forEach((prediction: any) => {
        if (!prediction.match?.home_team_goals || !prediction.match?.away_team_goals) return;

        const userId = prediction.user_id;
        const match: Match = prediction.match;

        const points = calculateMatchPoints(
          {
            homeGoals: prediction.home_goals,
            awayGoals: prediction.away_goals,
          },
          {
            homeGoals: match.home_team_goals,
            awayGoals: match.away_team_goals,
          }
        );

        if (!userPointsMap[userId]) userPointsMap[userId] = 0;
        userPointsMap[userId] += points;
      });

      // 🟩 Calcula pontos com base nas previsões finais do torneio
      if (realTournamentResults) {
        finalPredictionsData?.forEach((prediction: FinalPrediction) => {
          const userFinalPred: TournamentFinalPredictions = {
            champion: prediction.champion_id,
            runnerUp: prediction.vice_champion_id,
            thirdPlace: prediction.third_place_id,
            fourthPlace: prediction.fourth_place_id,
            finalScore: {
              homeGoals: prediction.final_home_score,
              awayGoals: prediction.final_away_score,
            },
          };

          const realResult: TournamentFinalResults = {
            champion: realTournamentResults.champion_id,
            runnerUp: realTournamentResults.runner_up_id,
            thirdPlace: realTournamentResults.third_place_id,
            fourthPlace: realTournamentResults.fourth_place_id,
            finalScore: {
              homeGoals: realTournamentResults.final_home_score,
              awayGoals: realTournamentResults.final_away_score,
            },
          };

          // Chamada correta da função de cálculo
          calculateTournamentFinalPoints(userFinalPred, realResult);
        });
      }

      const participantsData: Participant[] = usersData!.map((user) => ({
        id: user.id,
        name: user.name,
        points: userPointsMap[user.id] || 0,
        position: 0, // será definido na ordenação
      }));

      // Ordena por pontos e define posições
      participantsData.sort((a, b) => b.points - a.points);
      participantsData.forEach((p, index) => (p.position = index + 1));

      setParticipants(participantsData);
      setLoading(false);
    };

    fetchData();
  }, []);

  return { participants, loading };
}
