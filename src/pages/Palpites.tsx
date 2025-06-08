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
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    if (!user) {
        setLoading(false);
        return;
    };
    setLoading(true);
    setError(null);

    try {
      // Fetching data sequentially for better error handling
      const { data: matchesData, error: matchesError } = await supabase.from('matches').select('*, home_team:home_team_id(*), away_team:away_team_id(*)').order('match_date', { ascending: true });
      if (matchesError) throw new Error(`Buscando Partidas: ${matchesError.message}`);
      setAllMatches(matchesData || []);

      const { data: predictionsData, error: predictionsError } = await supabase.from('match_predictions').select('*').eq('user_id', user.id);
      if (predictionsError) throw new Error(`Buscando Palpites de Partida: ${predictionsError.message}`);
      const loadedPredictions: { [matchId: string]: LocalPrediction } = {};
      (predictionsData || []).forEach(p => {
        loadedPredictions[p.match_id] = { match_id: p.match_id, home_score: p.home_score !== null ? String(p.home_score) : '', away_score: p.away_score !== null ? String(p.away_score) : '', prediction_id: p.id };
      });
      setDailyPredictions(loadedPredictions);

      const { data: teamsData, error: teamsError } = await supabase.from('teams').select('*').order('name', { ascending: true });
      if (teamsError) throw new Error(`Buscando Times: ${teamsError.message}`);
      setTeams(teamsData || []);

      const { data: groupsData, error: groupsError } = await supabase.from('groups').select('id, name').order('name', { ascending: true });
      if (groupsError) throw new Error(`Buscando Grupos: ${groupsError.message}`);
      setGroups(groupsData || []);

      const { data: groupPredData, error: groupPredError } = await supabase.from('group_predictions').select('*').eq('user_id', user.id);
      if (groupPredError) throw new Error(`Buscando Palpites de Grupo: ${groupPredError.message}`);
      const loadedGroupPredictions: { [groupId: string]: GroupPredictionState } = {};
      (groupPredData || []).forEach(gp => {
        loadedGroupPredictions[gp.group_id] = { group_id: gp.group_id, predicted_first_team_id: gp.predicted_first_team_id, predicted_second_team_id: gp.predicted_second_team_id, prediction_id: gp.id };
      });
      setGroupPredictions(loadedGroupPredictions);

      const { data: finalPredData, error: finalPredError } = await supabase.from('final_predictions').select('*').eq('user_id', user.id).single();
      if (finalPredError && finalPredError.code !== 'PGRST116') throw new Error(`Buscando Palpites Finais: ${finalPredError.message}`);
      if (finalPredData) setFinalPrediction({ ...(finalPredData as FinalPredictionState), prediction_id: finalPredData.id });

    } catch (err: any) {
      console.error("ERRO FINAL AO CARREGAR DADOS:", err);
      setError(err.message);
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
  
  const groupStageMatches = useMemo(() => allMatches.filter(match => match.stage === "Fase de Grupos"), [allMatches]);
  
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
    if (!user) {
      toast({ title: "Erro", description: "Você precisa estar logado para salvar seu palpite.", variant: "destructive" });
      return;
    }

    if (Date.now() >= OVERALL_PREDICTION_CUTOFF_DATE.getTime()) {
      toast({ title: "Prazo Encerrado", description: `O prazo para todos os palpites encerrou em ${format(OVERALL_PREDICTION_CUTOFF_DATE, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.`, variant: "destructive" });
      return;
    }
    
    // ... (resto da sua lógica de salvar palpite diário)
  };

  const handleSaveGroupPrediction = useCallback(async (groupId: string) => {
    // ... (sua lógica de salvar palpite de grupo)
  }, [user, groupPredictions, groups, toast]);

  const handleSaveFinalPrediction = useCallback(async () => {
    // ... (sua lógica de salvar palpite final)
  }, [user, finalPrediction, toast]);

  const handlePrintReceipt = useCallback(() => {
    // ... (sua lógica de imprimir)
  }, [user, dailyPredictions, allMatches, teams, groupPredictions, groups, finalPrediction, toast]);


  if (loading) {
    return (
      <Layout><div className="flex justify-center items-center h-[calc(100vh-150px)]"><Loader2 className="h-10 w-10 animate-spin text-fifa-blue" /></div></Layout>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }
  
  if (error) {
    return (
        <Layout>
            <div className="container mx-auto p-4 text-center"><Card className="max-w-md mx-auto mt-10 border-red-500"><CardHeader><CardTitle className="text-red-600">Ocorreu um Erro</CardTitle></CardHeader><CardContent><p>Não foi possível carregar os dados da página de palpites.</p><p className="mt-2 text-sm text-gray-500"><strong>Detalhe do Erro:</strong> {error}</p><Button className="mt-4" onClick={() => fetchInitialData()}>Tentar Novamente</Button></CardContent></Card></div>
        </Layout>
    );
  }

  const isGlobalCutoffReached = Date.now() >= OVERALL_PREDICTION_CUTOFF_DATE.getTime();
  const globalCutoffFormatted = format(OVERALL_PREDICTION_CUTOFF_DATE, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  
  return (
    <Layout>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-center text-fifa-blue mb-6">Meus Palpites</h1>
        {isGlobalCutoffReached && (
          <Alert variant="destructive" className="mb-6"><AlertTitle>Prazo Encerrado!</AlertTitle><AlertDescription>O prazo para enviar ou modificar palpites encerrou em {globalCutoffFormatted}. Você ainda pode visualizar seus palpites.</AlertDescription></Alert>
        )}
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="daily">Partidas (Fase de Grupos)</TabsTrigger>
            <TabsTrigger value="groups">Grupos</TabsTrigger>
            <TabsTrigger value="final">Final</TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Palpites das Partidas (Fase de Grupos)</CardTitle>
                <CardDescription>
                  Preencha seus placares para cada partida da fase de grupos e clique em "Salvar Palpite" ou "Atualizar Palpite" individualmente.
                  {isGlobalCutoffReached ? ` O prazo para todos os palpites encerrou em ${globalCutoffFormatted}.` : ` O prazo para palpitar em uma partida encerra no horário do jogo. O prazo geral para todos os palpites é ${globalCutoffFormatted}.`}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {groupStageMatches.length === 0 ? (<p className="text-center text-gray-500">Nenhuma partida da fase de grupos encontrada.</p>) : (
                  groupStageMatches.map(match => {
                    const matchDate = parseISO(match.match_date);
                    const canPredictMatchIndividually = matchDate.getTime() > Date.now();
                    const canPredictGlobally = !isGlobalCutoffReached;
                    const canPredict = canPredictMatchIndividually && canPredictGlobally;
                    const prediction = dailyPredictions[match.id] || { match_id: match.id, home_score: '', away_score: '' };
                    const isPredictionFilled = prediction.home_score.trim() !== "" && prediction.away_score.trim() !== "";
                    return (
                      <Card key={match.id} className={`p-4 ${!canPredict ? 'bg-gray-100 opacity-80' : ''}`}>
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <p className="text-lg font-semibold">{(match.home_team as Team)?.name || 'A Definir'} vs {(match.away_team as Team)?.name || 'A Definir'}</p>
                            <p className="text-sm text-gray-600">{format(matchDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                          </div>
                          {!canPredict && (<span className="text-red-500 font-semibold text-sm">{isGlobalCutoffReached ? `Prazo global encerrado` : `Prazo da partida encerrado`}</span>)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input type="number" min="0" className="w-16 text-center" placeholder="0" value={prediction.home_score} onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)} disabled={submittingMatchId === match.id || !canPredict}/>
                          <span className="text-xl font-bold">x</span>
                          <Input type="number" min="0" className="w-16 text-center" placeholder="0" value={prediction.away_score} onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)} disabled={submittingMatchId === match.id || !canPredict}/>
                          {canPredict && isPredictionFilled && (<Button className={`ml-auto ${prediction.prediction_id ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`} onClick={() => handleSaveDailyPrediction(match.id)} disabled={submittingMatchId === match.id}>{submittingMatchId === match.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (prediction.prediction_id ? "Atualizar" : <Save className="h-4 w-4"/> )}{!submittingMatchId && !prediction.prediction_id && <span className="ml-1">Salvar</span>}</Button>)}
                        </div>
                      </Card>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* O JSX para as abas 'groups' e 'final' continua aqui, igual ao seu arquivo original */}

        </Tabs>
        <Card className="mt-6">
          <CardContent className="p-6 space-y-4">
            <Button className="w-full bg-gray-600 hover:bg-gray-700 text-white" onClick={handlePrintReceipt} disabled={submittingMatchId !== null || !user }><Printer className="mr-2 h-4 w-4" />Imprimir Comprovante</Button>
            <p className="text-sm text-gray-500 text-center">Atenção: Salve cada palpite de partida individualmente. Para Grupos e Final, use os botões "Salvar/Atualizar Palpite" específicos de cada seção.</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Palpites;