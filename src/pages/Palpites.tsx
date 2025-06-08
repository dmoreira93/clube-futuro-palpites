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
import { useToast } from "@/components/ui/use-toast"; // <-- 1. MUDANÇA: Importação correta do toast
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
  const { user, signOut } = useAuth(); // <-- 3. MUDANÇA: Pega a função signOut
  const { toast } = useToast(); // <-- 2. MUDANÇA: Usa o hook do shadcn/ui
  const navigate = useNavigate();

  // Seus states originais são mantidos...
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
    if (!user) return; // Se não houver usuário, não faz nada
    setLoading(true);
    try {
      // Toda a sua lógica de buscar dados (Promise.all) foi movida para cá
      const [matchesRes, teamsRes, groupsRes, dailyPredsRes, groupPredsRes, finalPredRes] = await Promise.all([
          supabase.from("matches").select("*, home_team:home_team_id(*), away_team:away_team_id(*)").order("match_date", { ascending: true }),
          supabase.from("teams").select("*").order("name", { ascending: true }),
          supabase.from("groups").select("id, name").order("name", { ascending: true }),
          supabase.from("match_predictions").select("*").eq("user_id", user.id),
          supabase.from("group_predictions").select("*").eq("user_id", user.id),
          supabase.from("final_predictions").select('*').eq("user_id", user.id).single(),
      ]);

      // Verificação de erros para cada chamada
      if (matchesRes.error) throw matchesRes.error;
      if (teamsRes.error) throw teamsRes.error;
      if (groupsRes.error) throw groupsRes.error;
      if (dailyPredsRes.error) throw dailyPredsRes.error;
      if (groupPredsRes.error) throw groupPredsRes.error;
      if (finalPredRes.error && finalPredRes.error.code !== 'PGRST116') throw finalPredRes.error;

      // Processamento dos dados (mantido do seu original)
      setAllMatches(matchesRes.data || []);
      setTeams(teamsRes.data || []);
      setGroups(groupsRes.data || []);
      
      const loadedPredictions: { [matchId: string]: LocalPrediction } = {};
      (dailyPredsRes.data || []).forEach(p => {
          loadedPredictions[p.match_id] = { match_id: p.match_id, home_score: p.home_score?.toString() ?? '', away_score: p.away_score?.toString() ?? '', prediction_id: p.id };
      });
      setDailyPredictions(loadedPredictions);
      
      const loadedGroupPredictions: { [groupId: string]: GroupPredictionState } = {};
      (groupPredsRes.data || []).forEach(gp => {
          loadedGroupPredictions[gp.group_id] = { group_id: gp.group_id, predicted_first_team_id: gp.predicted_first_team_id, predicted_second_team_id: gp.predicted_second_team_id, prediction_id: gp.id };
      });
      setGroupPredictions(loadedGroupPredictions);

      if (finalPredRes.data) {
          setFinalPrediction({ ...finalPredRes.data, prediction_id: finalPredRes.data.id });
      }

    } catch (error: any) {
      console.error("Erro ao carregar dados iniciais:", error);
      toast({ title: "Erro ao Carregar Dados", description: error.message, variant: "destructive" });
      // 4. MUDANÇA: Adicionada lógica de signOut
      if (error?.message?.includes('JWT') || error?.code === 'PGRST301') {
        await signOut();
      }
    } finally {
      setLoading(false);
    }
  }, [user, signOut, toast]); // 5. MUDANÇA: Adicionadas dependências

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // ... (suas funções de handleScoreChange, handleGroupTeamChange, handleFinalPredictionChange)

  // As 3 funções de salvar agora com o tratamento de erro e toast corretos
  const handleSaveDailyPrediction = async (matchId: string) => {
    // ... Lógica de validação do seu arquivo original ...
    try {
      // ... Lógica de upsert do seu arquivo original ...
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
    // ... Lógica de validação do seu arquivo original ...
    try {
      // ... Lógica de upsert do seu arquivo original ...
      toast({ title: "Sucesso!", description: `Palpite do grupo ${groups.find(g => g.id === groupId)?.name || ''} salvo!`});
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
    // ... Lógica de validação do seu arquivo original ...
    try {
      // ... Lógica de upsert do seu arquivo original ...
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

  // ... (Sua função handlePrintReceipt e todo o seu JSX de retorno permanecem os mesmos)
  return (
      <Layout>
          {/* ... Todo o seu JSX de 800+ linhas vai aqui ... */}
      </Layout>
  );
};

export default Palpites;