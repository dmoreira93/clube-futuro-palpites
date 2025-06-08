import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Loader2, Printer, Save } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Match, Team } from "@/types/matches";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactDOMServer from 'react-dom/server';
import PredictionReceipt from '@/components/home/predictions/PredictionReceipt';

// Interfaces
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
  const { user } = useAuth(); // Removido signOut daqui para evitar chamadas acidentais
  const { toast } = useToast();
  const navigate = useNavigate();

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // State para controlar erro na UI
  const [submittingMatchId, setSubmittingMatchId] = useState<string | null>(null);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [dailyPredictions, setDailyPredictions] = useState<{ [matchId: string]: LocalPrediction }>({});
  const [groupPredictions, setGroupPredictions] = useState<{ [groupId: string]: GroupPredictionState }>({});
  const [finalPrediction, setFinalPrediction] = useState<FinalPredictionState>({
    champion_id: null, vice_champion_id: null, third_place_id: null, fourth_place_id: null,
    final_home_score: null, final_away_score: null,
  });

  const fetchInitialData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Matches
      const { data: matchesData, error: matchesError } = await supabase.from('matches').select('*, home_team:home_team_id(*), away_team:away_team_id(*)').order('match_date', { ascending: true });
      if (matchesError) throw new Error(`Buscando Partidas: ${matchesError.message}`);
      setAllMatches(matchesData || []);

      // 2. Fetch User's Match Predictions
      const { data: predictionsData, error: predictionsError } = await supabase.from('match_predictions').select('*').eq('user_id', user.id);
      if (predictionsError) throw new Error(`Buscando Palpites de Partida: ${predictionsError.message}`);
      const loadedPredictions: { [matchId: string]: LocalPrediction } = {};
      (predictionsData || []).forEach(p => {
        loadedPredictions[p.match_id] = { match_id: p.match_id, home_score: p.home_score !== null ? String(p.home_score) : '', away_score: p.away_score !== null ? String(p.away_score) : '', prediction_id: p.id };
      });
      setDailyPredictions(loadedPredictions);

      // 3. Fetch Teams
      const { data: teamsData, error: teamsError } = await supabase.from('teams').select('*').order('name', { ascending: true });
      if (teamsError) throw new Error(`Buscando Times: ${teamsError.message}`);
      setTeams(teamsData || []);

      // 4. Fetch Groups
      const { data: groupsData, error: groupsError } = await supabase.from('groups').select('id, name').order('name', { ascending: true });
      if (groupsError) throw new Error(`Buscando Grupos: ${groupsError.message}`);
      setGroups(groupsData || []);

      // 5. Fetch User's Group Predictions
      const { data: groupPredData, error: groupPredError } = await supabase.from('group_predictions').select('*').eq('user_id', user.id);
      if (groupPredError) throw new Error(`Buscando Palpites de Grupo: ${groupPredError.message}`);
      const loadedGroupPredictions: { [groupId: string]: GroupPredictionState } = {};
      (groupPredData || []).forEach(gp => {
        loadedGroupPredictions[gp.group_id] = { group_id: gp.group_id, predicted_first_team_id: gp.predicted_first_team_id, predicted_second_team_id: gp.predicted_second_team_id, prediction_id: gp.id };
      });
      setGroupPredictions(loadedGroupPredictions);

      // 6. Fetch User's Final Predictions
      const { data: finalPredData, error: finalPredError } = await supabase.from('final_predictions').select('*').eq('user_id', user.id).single();
      if (finalPredError && finalPredError.code !== 'PGRST116') throw new Error(`Buscando Palpites Finais: ${finalPredError.message}`);
      if (finalPredData) setFinalPrediction({ ...finalPredData, prediction_id: finalPredData.id });

    } catch (err: any) {
      console.error("ERRO FINAL AO CARREGAR DADOS:", err);
      setError(err.message); // Guarda a mensagem de erro para exibir na UI
      toast({
        title: "Erro ao Carregar Dados",
        description: err.message,
        variant: "destructive",
        duration: 10000,
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // ... O resto do seu arquivo (handleScoreChange, JSX, etc.) permanece exatamente o mesmo
  
  const groupStageMatches = useMemo(() => allMatches.filter(match => match.stage === "Fase de Grupos"), [allMatches]);
  const handleScoreChange = useCallback((matchId: string, type: 'home' | 'away', value: string) => { /* ... */ }, []);
  const handleGroupTeamChange = useCallback((groupId: string, type: 'first' | 'second', teamId: string) => { /* ... */ }, []);
  const handleFinalPredictionChange = useCallback((field: keyof FinalPredictionState, value: string | number | null) => { /* ... */ }, []);
  const handleSaveDailyPrediction = async (matchId: string) => { /* ... */ };
  const handleSaveGroupPrediction = useCallback(async (groupId: string) => { /* ... */ }, [/* ... */]);
  const handleSaveFinalPrediction = useCallback(async () => { /* ... */ }, [/* ... */]);
  const handlePrintReceipt = useCallback(() => { /* ... */ }, [/* ... */]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[calc(100vh-150px)]"><Loader2 className="h-10 w-10 animate-spin text-fifa-blue" /></div>
      </Layout>
    );
  }

  // Se o usuário não estiver logado (após o carregamento inicial), redireciona
  if (!user) {
    navigate("/login");
    return null;
  }

  // Se ocorreu um erro durante o fetch, exibe uma mensagem de erro em vez da página em branco
  if (error) {
    return (
        <Layout>
            <div className="container mx-auto p-4 text-center">
                <Card className="max-w-md mx-auto mt-10 border-red-500">
                    <CardHeader><CardTitle className="text-red-600">Ocorreu um Erro</CardTitle></CardHeader>
                    <CardContent>
                        <p>Não foi possível carregar os dados da página de palpites.</p>
                        <p className="mt-2 text-sm text-gray-500"><strong>Detalhe do Erro:</strong> {error}</p>
                        <Button className="mt-4" onClick={() => fetchInitialData()}>Tentar Novamente</Button>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
  }
  
  const isGlobalCutoffReached = Date.now() >= OVERALL_PREDICTION_CUTOFF_DATE.getTime();
  const globalCutoffFormatted = format(OVERALL_PREDICTION_CUTOFF_DATE, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  return (
    <Layout>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {/* Aqui entra todo o seu JSX original da página de palpites, que agora deve renderizar corretamente */}
        <h1 className="text-2xl font-bold">Meus Palpites</h1>
        {/* ...e o resto do seu conteúdo... */}
      </div>
    </Layout>
  );
};

export default Palpites;