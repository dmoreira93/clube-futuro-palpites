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
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Loader2, Printer, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext"; // <-- Importa o useAuth
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
  const { user, signOut } = useAuth(); // <-- Pega a função signOut
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submittingMatchId, setSubmittingMatchId] = useState<string | null>(null);

  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);

  const [dailyPredictions, setDailyPredictions] = useState<{ [matchId: string]: LocalPrediction }>({});
  const [groupPredictions, setGroupPredictions] = useState<{ [groupId: string]: GroupPredictionState }>({});
  const [finalPrediction, setFinalPrediction] = useState<FinalPredictionState>({
    champion_id: null,
    vice_champion_id: null,
    third_place_id: null,
    fourth_place_id: null,
    final_home_score: null,
    final_away_score: null,
  });

  const fetchInitialData = useCallback(async () => {
    // A verificação do usuário agora é feita antes de chamar a função
    setLoading(true);
    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*, home_team:home_team_id(*), away_team:away_team_id(*)')
        .order('match_date', { ascending: true });
      if (matchesError) throw matchesError;
      setAllMatches(matchesData || []);

      if (user) {
        const { data: predictionsData, error: predictionsError } = await supabase
          .from('match_predictions')
          .select('*')
          .eq('user_id', user.id);
        if (predictionsError) throw predictionsError;

        const loadedPredictions: { [matchId: string]: LocalPrediction } = {};
        (predictionsData || []).forEach(p => {
          loadedPredictions[p.match_id] = {
            match_id: p.match_id,
            home_score: p.home_score !== null ? p.home_score.toString() : '',
            away_score: p.away_score !== null ? p.away_score.toString() : '',
            prediction_id: p.id,
          };
        });
        setDailyPredictions(loadedPredictions);
      }

      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true });
      if (teamsError) throw teamsError;
      setTeams(teamsData || []);

      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('id, name')
        .order('name', { ascending: true });
      if (groupsError) throw groupsError;
      setGroups(groupsData || []);

      if (user) {
        const { data: groupPredData, error: groupPredError } = await supabase
          .from('group_predictions')
          .select('*')
          .eq('user_id', user.id);
        if (groupPredError) throw groupPredError;

        const loadedGroupPredictions: { [groupId: string]: GroupPredictionState } = {};
        (groupPredData || []).forEach(gp => {
          loadedGroupPredictions[gp.group_id] = {
            group_id: gp.group_id,
            predicted_first_team_id: gp.predicted_first_team_id,
            predicted_second_team_id: gp.predicted_second_team_id,
            prediction_id: gp.id,
          };
        });
        setGroupPredictions(loadedGroupPredictions);
      }

      if (user) {
        const { data: finalPredData, error: finalPredError } = await supabase
          .from('final_predictions')
          .select('id, champion_id, vice_champion_id, third_place_id, fourth_place_id, final_home_score, final_away_score')
          .eq('user_id', user.id)
          .single();

        if (finalPredError && finalPredError.code !== 'PGRST116') {
          throw finalPredError;
        }
        if (finalPredData) {
          setFinalPrediction({
            champion_id: finalPredData.champion_id,
            vice_champion_id: finalPredData.vice_champion_id,
            third_place_id: finalPredData.third_place_id,
            fourth_place_id: finalPredData.fourth_place_id,
            final_home_score: finalPredData.final_home_score,
            final_away_score: finalPredData.final_away_score,
            prediction_id: finalPredData.id,
          });
        }
      }
    } catch (error: any) {
      console.error("Erro ao carregar dados iniciais:", error);
      toast.error("Erro ao carregar dados: " + error.message);
      // Verificação de erro de autenticação
      if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
        await signOut();
      }
    } finally {
      setLoading(false);
    }
  }, [user, signOut]); // <-- signOut adicionado como dependência

  useEffect(() => {
    if(user) { // Apenas busca os dados se o usuário estiver logado
        fetchInitialData();
    } else { // Se não houver usuário, para de carregar
        setLoading(false);
    }
  }, [user, fetchInitialData]);

  // ... (o resto das suas funções `handle...` e `useMemo` permanecem aqui)

  const handleSaveDailyPrediction = async (matchId: string) => {
    // ... (lógica interna da função permanece a mesma)
    try {
      // ... (lógica do try)
    } catch (error: any) {
      toast.error(`Erro ao salvar palpite: ${error.details || error.message || error.toString()}`);
      // Verificação de erro de autenticação
      if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
        await signOut();
      }
    } finally {
      setSubmittingMatchId(null);
    }
  };

  const handleSaveGroupPrediction = useCallback(async (groupId: string) => {
    // ... (lógica interna da função permanece a mesma)
    try {
      // ... (lógica do try)
    } catch (error: any) {
      toast.error(`Erro ao salvar palpite de grupo: ${error.message || error.toString()}`);
      // Verificação de erro de autenticação
      if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
        await signOut();
      }
    } finally {
      setSubmittingMatchId(null);
    }
  }, [user, groupPredictions, groups, signOut]); // <-- signOut adicionado como dependência

  const handleSaveFinalPrediction = useCallback(async () => {
    // ... (lógica interna da função permanece a mesma)
    try {
        // ... (lógica do try)
    } catch (error: any) {
      toast.error(`Erro ao salvar palpite final: ${error.message || error.toString()}`);
      // Verificação de erro de autenticação
      if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
        await signOut();
      }
    } finally {
      setSubmittingMatchId(null);
    }
  }, [user, finalPrediction, signOut]); // <-- signOut adicionado como dependência
  
  // ... (handleScoreChange, handleGroupTeamChange, handleFinalPredictionChange, handlePrintReceipt)
  // ... (Essas funções não fazem chamadas de API, então não precisam de try/catch para isso)

  // ... (toda a sua lógica de renderização JSX permanece aqui)
  // ... (ela é muito longa e específica, então não vou colá-la para não substituir seu layout)
  
  // Apenas para garantir, aqui está a estrutura básica de retorno que você tinha:
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[calc(100vh-64px)]">
          <Loader2 className="h-10 w-10 animate-spin text-fifa-blue" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    // O ProtectedRoute já deve cuidar disso, mas como fallback
    navigate("/login");
    return null; 
  }

  // ... O resto do seu JSX principal com as abas ...
  return (
    <Layout>
      {/* ... todo o seu JSX vai aqui ... */}
    </Layout>
  );
};

export default Palpites;