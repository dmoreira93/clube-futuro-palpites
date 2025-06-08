// src/pages/Palpites.tsx
import { useState, useEffect, useCallback, useMemo } from "react";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast"; // <-- MUDANÇA 1: Importação correta do toast
import { Label } from "@/components/ui/label";
import { Loader2, Printer, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Match, Team } from "@/types/matches";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactDOMServer from 'react-dom/server';
import PredictionReceipt from '@/components/home/predictions/PredictionReceipt';

interface LocalPrediction {
  match_id: string;
  home_score: string;
  away_score: string;
  prediction_id?: string;
}

interface GroupPredictionState {
  group_id: string;
  predicted_first_team_id: string | null;
  predicted_second_team_id: string | null;
  prediction_id?: string;
}

interface FinalPredictionState {
  champion_id: string | null;
  vice_champion_id: string | null;
  third_place_id: string | null;
  fourth_place_id: string | null;
  final_home_score: number | null;
  final_away_score: number | null;
  prediction_id?: string;
}

const OVERALL_PREDICTION_CUTOFF_DATE = parseISO("2025-06-14T18:00:00-03:00");

const Palpites = () => {
  const { user, signOut } = useAuth(); // <-- MUDANÇA 2: Pega a função signOut
  const { toast } = useToast(); // <-- MUDANÇA 3: Usa o hook do shadcn/ui
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submittingMatchId, setSubmittingMatchId] = useState<string | null>(null);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [dailyPredictions, setDailyPredictions] = useState<{ [matchId: string]: LocalPrediction }>({});
  const [groupPredictions, setGroupPredictions] = useState<{ [groupId: string]: GroupPredictionState }>({});
  const [finalPrediction, setFinalPrediction] = useState<FinalPredictionState>({
    champion_id: null, vice_champion_id: null, third_place_id: null,
    fourth_place_id: null, final_home_score: null, final_away_score: null,
  });

  const fetchInitialData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: matchesData, error: matchesError } = await supabase.from('matches').select('*, home_team:home_team_id(*), away_team:away_team_id(*)').order('match_date', { ascending: true });
      if (matchesError) throw matchesError;
      setAllMatches(matchesData || []);
      
      const { data: predictionsData, error: predictionsError } = await supabase.from('match_predictions').select('*').eq('user_id', user.id);
      if (predictionsError) throw predictionsError;
      const loadedPredictions: { [matchId: string]: LocalPrediction } = {};
      (predictionsData || []).forEach(p => {
        loadedPredictions[p.match_id] = { match_id: p.match_id, home_score: p.home_score !== null ? p.home_score.toString() : '', away_score: p.away_score !== null ? p.away_score.toString() : '', prediction_id: p.id };
      });
      setDailyPredictions(loadedPredictions);
      
      const { data: teamsData, error: teamsError } = await supabase.from('teams').select('*').order('name', { ascending: true });
      if (teamsError) throw teamsError;
      setTeams(teamsData || []);
      
      const { data: groupsData, error: groupsError } = await supabase.from('groups').select('id, name').order('name', { ascending: true });
      if (groupsError) throw groupsError;
      setGroups(groupsData || []);
      
      const { data: groupPredData, error: groupPredError } = await supabase.from('group_predictions').select('*').eq('user_id', user.id);
      if (groupPredError) throw groupPredError;
      const loadedGroupPredictions: { [groupId: string]: GroupPredictionState } = {};
      (groupPredData || []).forEach(gp => {
        loadedGroupPredictions[gp.group_id] = { group_id: gp.group_id, predicted_first_team_id: gp.predicted_first_team_id, predicted_second_team_id: gp.predicted_second_team_id, prediction_id: gp.id };
      });
      setGroupPredictions(loadedGroupPredictions);
      
      const { data: finalPredData, error: finalPredError } = await supabase.from('final_predictions').select('id, champion_id, vice_champion_id, third_place_id, fourth_place_id, final_home_score, final_away_score').eq('user_id', user.id).single();
      if (finalPredError && finalPredError.code !== 'PGRST116') throw finalPredError;
      if (finalPredData) setFinalPrediction({ ...finalPredData, prediction_id: finalPredData.id });

    } catch (error: any) {
      console.error("Erro ao carregar dados iniciais:", error);
      toast({ title: "Erro ao Carregar Dados", description: error.message, variant: "destructive" });
      // MUDANÇA 4: Adiciona verificação de erro de autenticação
      if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
        await signOut();
      }
    } finally {
      setLoading(false);
    }
  }, [user, signOut, toast]); // MUDANÇA 5: Adiciona dependências

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const groupStageMatches = useMemo(() => {
    return allMatches.filter(match => match.stage === "Fase de Grupos");
  }, [allMatches]);

  const handleScoreChange = useCallback((matchId: string, type: 'home' | 'away', value: string) => {
    setDailyPredictions(prev => ({ ...prev, [matchId]: { ...(prev[matchId] || { match_id: matchId, home_score: '', away_score: '' }), [type === 'home' ? 'home_score' : 'away_score']: value } }));
  }, []);

  const handleGroupTeamChange = useCallback((groupId: string, type: 'first' | 'second', teamId: string) => {
    setGroupPredictions(prev => ({ ...prev, [groupId]: { ...(prev[groupId] || { group_id: groupId, predicted_first_team_id: null, predicted_second_team_id: null }), [type === 'first' ? 'predicted_first_team_id' : 'predicted_second_team_id']: teamId || null } }));
  }, []);

  const handleFinalPredictionChange = useCallback((field: keyof FinalPredictionState, value: string | number | null) => {
    setFinalPrediction(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSaveDailyPrediction = async (matchId: string) => {
    // ... (lógica de validação do seu arquivo original) ...
    try {
      // ... (lógica de upsert do seu arquivo original) ...
      toast({ title: "Sucesso!", description: `Palpite para ${match.home_team?.name} vs ${match.away_team?.name} salvo!`});
    } catch (error: any) {
      toast({ title: "Erro", description: `Erro ao salvar palpite: ${error.message}`, variant: "destructive" });
      if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
        await signOut();
      }
    } finally {
      setSubmittingMatchId(null);
    }
  };

  const handleSaveGroupPrediction = useCallback(async (groupId: string) => {
    // ... (lógica de validação do seu arquivo original) ...
    try {
      // ... (lógica de upsert do seu arquivo original) ...
      toast({ title: "Sucesso!", description: `Palpite do grupo ${groups.find(g => g.id === groupId)?.name || ''} salvo!` });
    } catch (error: any) {
      toast({ title: "Erro", description: `Erro ao salvar palpite de grupo: ${error.message}`, variant: "destructive" });
      if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
        await signOut();
      }
    } finally {
      setSubmittingMatchId(null);
    }
  }, [user, groupPredictions, groups, toast, signOut]);

  const handleSaveFinalPrediction = useCallback(async () => {
    // ... (lógica de validação do seu arquivo original) ...
    try {
      // ... (lógica de upsert do seu arquivo original) ...
      toast({ title: "Sucesso!", description: "Palpite da final salvo com sucesso!" });
    } catch (error: any) {
      toast({ title: "Erro", description: `Erro ao salvar palpite final: ${error.message}`, variant: "destructive" });
      if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
        await signOut();
      }
    } finally {
      setSubmittingMatchId(null);
    }
  }, [user, finalPrediction, toast, signOut]);
  
  // ... (Sua função handlePrintReceipt e todo o seu JSX de retorno permanecem os mesmos) ...
  return (
    <Layout>
      {/* ... Todo o seu JSX original vai aqui ... */}
    </Layout>
  );
};

export default Palpites;