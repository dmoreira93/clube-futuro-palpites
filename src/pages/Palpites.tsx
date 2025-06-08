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
    const { user, signOut } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

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
        }
        setLoading(true);
        setError(null);
        try {
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
            toast({ title: "Erro ao Carregar Dados", description: err.message, variant: "destructive", duration: 10000 });
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
    const handleSaveDailyPrediction = async (matchId: string) => { /* ... sua lógica original ... */ };
    const handleSaveGroupPrediction = useCallback(async (groupId: string) => { /* ... sua lógica original ... */ }, [user, groupPredictions, groups, toast]);
    const handleSaveFinalPrediction = useCallback(async () => { /* ... sua lógica original ... */ }, [user, finalPrediction, toast]);
    const handlePrintReceipt = useCallback(() => { /* ... sua lógica original ... */ }, [user, dailyPredictions, allMatches, teams, groupPredictions, groups, finalPrediction, toast]);

    if (loading) {
        return <Layout><div className="flex justify-center items-center h-[calc(100vh-150px)]"><Loader2 className="h-10 w-10 animate-spin text-fifa-blue" /></div></Layout>;
    }
    if (!user) {
        navigate("/login");
        return null;
    }
    if (error) {
        return <Layout><div className="container mx-auto p-4 text-center"><Card className="max-w-md mx-auto mt-10 border-red-500"><CardHeader><CardTitle className="text-red-600">Ocorreu um Erro</CardTitle></CardHeader><CardContent><p>Não foi possível carregar os dados da página de palpites.</p><p className="mt-2 text-sm text-gray-500"><strong>Detalhe do Erro:</strong> {error}</p><Button className="mt-4" onClick={() => fetchInitialData()}>Tentar Novamente</Button></CardContent></Card></div></Layout>;
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
                                    Preencha seus placares para cada partida e salve individualmente. O prazo geral para todos os palpites é {globalCutoffFormatted}.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {groupStageMatches.length > 0 ? groupStageMatches.map(match => {
                                    const canPredict = !isGlobalCutoffReached && (parseISO(match.match_date).getTime() > Date.now());
                                    const prediction = dailyPredictions[match.id] || { home_score: '', away_score: '' };
                                    return (
                                        <Card key={match.id} className={`p-4 ${!canPredict ? 'bg-gray-100 opacity-70' : ''}`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="font-semibold">{match.home_team?.name} vs {match.away_team?.name}</p>
                                                <p className="text-sm text-gray-500">{format(parseISO(match.match_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Input type="number" min="0" className="w-16 text-center" value={prediction.home_score} onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)} disabled={!canPredict} />
                                                <span className="font-bold">x</span>
                                                <Input type="number" min="0" className="w-16 text-center" value={prediction.away_score} onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)} disabled={!canPredict} />
                                                {canPredict && <Button size="sm" className="ml-auto" onClick={() => handleSaveDailyPrediction(match.id)}>{prediction.prediction_id ? 'Atualizar' : 'Salvar'}</Button>}
                                            </div>
                                        </Card>
                                    );
                                }) : <p>Nenhuma partida encontrada.</p>}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="groups">
                        <Card>
                             <CardHeader>
                                <CardTitle className="text-xl">Palpites dos Grupos</CardTitle>
                                <CardDescription>
                                     Selecione os dois times que você acredita que se classificarão em cada grupo.
                                     Prazo final: {globalCutoffFormatted}.
                                 </CardDescription>
                             </CardHeader>
                             <CardContent className="space-y-6">
                                 {groups.map(group => (
                                     <Card key={group.id} className="p-4">
                                         <h3 className="text-lg font-semibold mb-3">Grupo {group.name}</h3>
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             <div>
                                                 <Label>1º Lugar</Label>
                                                 <Select onValueChange={(value) => handleGroupTeamChange(group.id, 'first', value)} value={groupPredictions[group.id]?.predicted_first_team_id || ''} disabled={isGlobalCutoffReached}>
                                                     <SelectTrigger><SelectValue placeholder="Selecione o 1º lugar" /></SelectTrigger>
                                                     <SelectContent>
                                                         {teams.filter(t => t.group_id === group.id).map(team => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}
                                                     </SelectContent>
                                                 </Select>
                                             </div>
                                             <div>
                                                 <Label>2º Lugar</Label>
                                                 <Select onValueChange={(value) => handleGroupTeamChange(group.id, 'second', value)} value={groupPredictions[group.id]?.predicted_second_team_id || ''} disabled={isGlobalCutoffReached}>
                                                     <SelectTrigger><SelectValue placeholder="Selecione o 2º lugar" /></SelectTrigger>
                                                     <SelectContent>
                                                         {teams.filter(t => t.group_id === group.id).map(team => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}
                                                     </SelectContent>
                                                 </Select>
                                             </div>
                                         </div>
                                         {!isGlobalCutoffReached && <Button className="mt-4" onClick={() => handleSaveGroupPrediction(group.id)}>Salvar Palpites do Grupo {group.name}</Button>}
                                     </Card>
                                 ))}
                             </CardContent>
                         </Card>
                    </TabsContent>

                    <TabsContent value="final">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Palpite da Fase Final</CardTitle>
                                <CardDescription>
                                    Preencha seus palpites para o Campeão, Vice, 3º e 4º lugares, e o placar da final.
                                    Prazo final: {globalCutoffFormatted}.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label>Campeão</Label>
                                        <Select onValueChange={(value) => handleFinalPredictionChange('champion_id', value)} value={finalPrediction.champion_id || ''} disabled={isGlobalCutoffReached}>
                                            <SelectTrigger><SelectValue placeholder="Selecione o Campeão" /></SelectTrigger>
                                            <SelectContent>{teams.map(team => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Vice-Campeão</Label>
                                        <Select onValueChange={(value) => handleFinalPredictionChange('vice_champion_id', value)} value={finalPrediction.vice_champion_id || ''} disabled={isGlobalCutoffReached}>
                                            <SelectTrigger><SelectValue placeholder="Selecione o Vice-Campeão" /></SelectTrigger>
                                            <SelectContent>{teams.map(team => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>3º Lugar</Label>
                                        <Select onValueChange={(value) => handleFinalPredictionChange('third_place_id', value)} value={finalPrediction.third_place_id || ''} disabled={isGlobalCutoffReached}>
                                            <SelectTrigger><SelectValue placeholder="Selecione o 3º Lugar" /></SelectTrigger>
                                            <SelectContent>{teams.map(team => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>4º Lugar</Label>
                                        <Select onValueChange={(value) => handleFinalPredictionChange('fourth_place_id', value)} value={finalPrediction.fourth_place_id || ''} disabled={isGlobalCutoffReached}>
                                            <SelectTrigger><SelectValue placeholder="Selecione o 4º Lugar" /></SelectTrigger>
                                            <SelectContent>{teams.map(team => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div>
                                    <Label>Placar da Final (Campeão vs Vice)</Label>
                                    <div className="flex items-center gap-2">
                                        <Input type="number" min="0" className="w-24 text-center" value={finalPrediction.final_home_score ?? ''} onChange={(e) => handleFinalPredictionChange('final_home_score', e.target.value === '' ? null : parseInt(e.target.value))} disabled={isGlobalCutoffReached} />
                                        <span className="font-bold">x</span>
                                        <Input type="number" min="0" className="w-24 text-center" value={finalPrediction.final_away_score ?? ''} onChange={(e) => handleFinalPredictionChange('final_away_score', e.target.value === '' ? null : parseInt(e.target.value))} disabled={isGlobalCutoffReached} />
                                    </div>
                                </div>
                                {!isGlobalCutoffReached && <Button onClick={handleSaveFinalPrediction}>Salvar Palpite da Final</Button>}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <Card className="mt-6">
                    <CardContent className="p-6">
                        <Button className="w-full" onClick={handlePrintReceipt}><Printer className="mr-2 h-4 w-4" />Imprimir Comprovante de Palpites</Button>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default Palpites;