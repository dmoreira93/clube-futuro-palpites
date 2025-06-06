import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext"; // <-- Importa o useAuth
import { toast } from "@/components/ui/use-toast";
import Layout from "@/components/layout/Layout";
import { Accordion } from "@/components/ui/accordion";
import { Loader2 } from "lucide-react";
import MatchAccordionItem from "@/components/home/predictions/MatchAccordionItem";
import GroupPredictionItem from "@/components/home/predictions/GroupPredictionItem";
import FinalPredictionItem from "@/components/home/predictions/FinalPredictionItem";
import { parseISO, isBefore } from "date-fns";
import {
  Match,
  Team,
  Group,
  MatchPrediction,
  GroupPrediction,
  FinalPrediction,
  MatchesByStage,
} from "@/types/predictions"; // Supondo que você tenha um arquivo de tipos

const OVERALL_PREDICTION_CUTOFF_DATE = parseISO("2025-06-14T18:00:00-03:00");

const Palpites: React.FC = () => {
  const { user, signOut } = useAuth(); // <-- Pega a função signOut
  const [matchesByStage, setMatchesByStage] = useState<MatchesByStage>({});
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [dailyPredictions, setDailyPredictions] = useState<{ [key: string]: MatchPrediction }>({});
  const [groupPredictions, setGroupPredictions] = useState<{ [key: string]: GroupPrediction }>({});
  const [finalPrediction, setFinalPrediction] = useState<FinalPrediction>({});
  const [loading, setLoading] = useState(true);
  const [submittingMatchId, setSubmittingMatchId] = useState<string | null>(null);
  const [submittingGroupId, setSubmittingGroupId] = useState<string | null>(null);
  const [submittingFinal, setSubmittingFinal] = useState(false);

  const areOverallPredictionsLocked = useMemo(() => isBefore(new Date(), OVERALL_PREDICTION_CUTOFF_DATE), []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const [matchesRes, teamsRes, groupsRes, dailyPredsRes, groupPredsRes, finalPredRes] = await Promise.all([
          supabase.from("matches").select("*, home_team:home_team_id(*), away_team:away_team_id(*)").order("match_date", { ascending: true }),
          supabase.from("teams").select("*"),
          supabase.from("groups").select("*"),
          supabase.from("match_predictions").select("*").eq("user_id", user.id),
          supabase.from("group_predictions").select("*").eq("user_id", user.id),
          supabase.from("final_predictions").select("*").eq("user_id", user.id).single(),
        ]);

        if (matchesRes.error) throw matchesRes.error;
        if (teamsRes.error) throw teamsRes.error;
        if (groupsRes.error) throw groupsRes.error;
        if (dailyPredsRes.error) throw dailyPredsRes.error;
        if (groupPredsRes.error) throw groupPredsRes.error;
        if (finalPredRes.error && finalPredRes.error.code !== 'PGRST116') throw finalPredRes.error;

        const matchesData = matchesRes.data as Match[];
        const organizedMatches: MatchesByStage = {};
        for (const match of matchesData) {
          const stage = match.stage || "Desconhecido";
          if (!organizedMatches[stage]) {
            organizedMatches[stage] = [];
          }
          organizedMatches[stage].push(match);
        }
        setMatchesByStage(organizedMatches);
        setTeams(teamsRes.data as Team[]);
        setGroups(groupsRes.data as Group[]);

        const dailyPredsMap = (dailyPredsRes.data as MatchPrediction[]).reduce((acc, pred) => {
          acc[pred.match_id] = pred;
          return acc;
        }, {} as { [key: string]: MatchPrediction });
        setDailyPredictions(dailyPredsMap);

        const groupPredsMap = (groupPredsRes.data as GroupPrediction[]).reduce((acc, pred) => {
            acc[pred.group_id] = pred;
            return acc;
        }, {} as { [key: string]: GroupPrediction });
        setGroupPredictions(groupPredsMap);

        if (finalPredRes.data) {
            setFinalPrediction(finalPredRes.data as FinalPrediction);
        }

      } catch (error: any) {
        console.error("Erro ao carregar dados dos palpites:", error);
        toast({ title: "Erro", description: "Não foi possível carregar seus palpites.", variant: "destructive" });
        // Verificação de erro de autenticação
        if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
          await signOut();
        }
      } finally {
        setLoading(false);
      }
    };
    if (user) {
        fetchData();
    }
  }, [user, signOut]); // <-- Adiciona signOut como dependência

  const handleDailyPredictionChange = useCallback((matchId: string, home_score: number | null, away_score: number | null) => {
    setDailyPredictions(prev => ({
      ...prev,
      [matchId]: { ...prev[matchId], match_id: matchId, home_score, away_score },
    }));
  }, []);

  const handleGroupPredictionChange = useCallback((groupId: string, teamId: string | null, position: 'first' | 'second') => {
    setGroupPredictions(prev => ({
        ...prev,
        [groupId]: {
            ...prev[groupId],
            group_id: groupId,
            predicted_first_team_id: position === 'first' ? teamId : prev[groupId]?.predicted_first_team_id,
            predicted_second_team_id: position === 'second' ? teamId : prev[groupId]?.predicted_second_team_id,
        },
    }));
  }, []);

  const handleFinalPredictionChange = useCallback((field: keyof FinalPrediction, value: string | number | null) => {
    setFinalPrediction(prev => ({
        ...prev,
        [field]: value
    }));
  }, []);

  const handleSaveDailyPrediction = async (matchId: string) => {
    if (!user) return;
    const prediction = dailyPredictions[matchId];
    if (prediction.home_score === null || prediction.away_score === null) {
      toast({ title: "Erro", description: "Preencha ambos os placares.", variant: "destructive" });
      return;
    }
    setSubmittingMatchId(matchId);
    try {
      const { error } = await supabase.from("match_predictions").upsert({
        id: prediction.id,
        match_id: matchId,
        user_id: user.id,
        home_score: prediction.home_score,
        away_score: prediction.away_score,
      }, { onConflict: 'match_id, user_id' });
      if (error) throw error;
      toast({ title: "Sucesso!", description: "Seu palpite foi salvo." });
    } catch (error: any) {
      console.error("Erro ao salvar palpite diário:", error);
      toast({ title: "Erro", description: "Não foi possível salvar seu palpite.", variant: "destructive" });
      // Verificação de erro de autenticação
      if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
        await signOut();
      }
    } finally {
      setSubmittingMatchId(null);
    }
  };

  const handleSaveGroupPrediction = async (groupId: string) => {
    if (!user) return;
    const prediction = groupPredictions[groupId];
    if (!prediction.predicted_first_team_id || !prediction.predicted_second_team_id) {
        toast({ title: "Erro", description: "Selecione o 1º e o 2º colocado.", variant: "destructive" });
        return;
    }
    setSubmittingGroupId(groupId);
    try {
        const { error } = await supabase.from("group_predictions").upsert({
            id: prediction.id,
            group_id: groupId,
            user_id: user.id,
            predicted_first_team_id: prediction.predicted_first_team_id,
            predicted_second_team_id: prediction.predicted_second_team_id,
        }, { onConflict: 'group_id, user_id' });
        if (error) throw error;
        toast({ title: "Sucesso!", description: "Sua classificação do grupo foi salva." });
    } catch (error: any) {
        console.error("Erro ao salvar palpite do grupo:", error);
        toast({ title: "Erro", description: "Não foi possível salvar sua classificação.", variant: "destructive" });
        // Verificação de erro de autenticação
        if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
          await signOut();
        }
    } finally {
        setSubmittingGroupId(null);
    }
  };

  const handleSaveFinalPrediction = async () => {
    if (!user) return;
    setSubmittingFinal(true);
    try {
        const { error } = await supabase.from("final_predictions").upsert({
            id: finalPrediction.id,
            user_id: user.id,
            champion_id: finalPrediction.champion_id,
            vice_champion_id: finalPrediction.vice_champion_id,
            third_place_id: finalPrediction.third_place_id,
            fourth_place_id: finalPrediction.fourth_place_id,
            final_home_score: finalPrediction.final_home_score,
            final_away_score: finalPrediction.final_away_score,
        }, { onConflict: 'user_id' });
        if (error) throw error;
        toast({ title: "Sucesso!", description: "Seus palpites da fase final foram salvos." });
    } catch (error: any) {
        console.error("Erro ao salvar palpite final:", error);
        toast({ title: "Erro", description: "Não foi possível salvar seus palpites finais.", variant: "destructive" });
        // Verificação de erro de autenticação
        if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
          await signOut();
        }
    } finally {
        setSubmittingFinal(false);
    }
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-fifa-blue" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold text-center text-fifa-blue mb-4">Meus Palpites</h1>
            <p className="text-center text-gray-600 mb-8">Faça seus palpites para os jogos e classificações. Boa sorte!</p>

            <Accordion type="single" collapsible className="w-full space-y-4">
                {areOverallPredictionsLocked ? (
                    <>
                        <GroupPredictionItem groups={groups} teams={teams} predictions={groupPredictions} onPredictionChange={handleGroupPredictionChange} onSave={handleSaveGroupPrediction} submittingId={submittingGroupId} />
                        <FinalPredictionItem teams={teams} prediction={finalPrediction} onPredictionChange={handleFinalPredictionChange} onSave={handleSaveFinalPrediction} submitting={submittingFinal} />
                    </>
                ) : (
                    <div className="text-center p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
                        <p className="font-bold">Palpites Encerrados</p>
                        <p>Os palpites para a classificação geral e fase final foram encerrados em {OVERALL_PREDICTION_CUTOFF_DATE.toLocaleString('pt-BR')}.</p>
                    </div>
                )}
                {Object.entries(matchesByStage).map(([stage, matches]) => (
                    <MatchAccordionItem 
                        key={stage}
                        stage={stage}
                        matches={matches}
                        predictions={dailyPredictions}
                        onPredictionChange={handleDailyPredictionChange}
                        onSave={handleSaveDailyPrediction}
                        submittingId={submittingMatchId}
                    />
                ))}
            </Accordion>
        </div>
    </Layout>
  );
};

export default Palpites;