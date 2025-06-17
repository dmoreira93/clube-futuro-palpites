// src/pages/Palpites.tsx (VERSÃO ATUALIZADA E INTEGRADA)

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Loader2, Printer } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Match, Team } from "@/types/matches";
import { format, parseISO, isAfter } from "date-fns"; // Importa a função 'isAfter'
import { ptBR } from "date-fns/locale";
import ReactDOMServer from 'react-dom/server';
import PredictionReceipt from '@/components/home/predictions/PredictionReceipt';

// Interfaces (sem alteração)
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
  runner_up_id: string | null; 
  third_place_id: string | null;
  fourth_place_id: string | null;
  final_home_score: number | null;
  final_away_score: number | null;
  prediction_id?: string;
}

// A data fixa foi REMOVIDA
// const OVERALL_PREDICTION_CUTOFF_DATE = parseISO("2025-06-14T18:00:00-03:00");

const Palpites = () => {
    // Agora pegamos o 'pool' do contexto também
    const { user, pool } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    // Seus 'useState' e 'useCallback' continuam exatamente os mesmos
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submittingMatchId, setSubmittingMatchId] = useState<string | null>(null);
    const [allMatches, setAllMatches] = useState<Match[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
    const [dailyPredictions, setDailyPredictions] = useState<{ [matchId: string]: LocalPrediction }>({});
    const [groupPredictions, setGroupPredictions] = useState<{ [groupId: string]: GroupPredictionState }>({});
    const [finalPrediction, setFinalPrediction] = useState<FinalPredictionState>({
        champion_id: null, runner_up_id: null, third_place_id: null, fourth_place_id: null,
        final_home_score: null, final_away_score: null,
    });

    const fetchInitialData = useCallback(async () => {
        // ... (toda a sua lógica de fetch continua idêntica)
    }, [user, toast]);
    
    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    // ... (toda a sua lógica de handlers e memos continua idêntica) ...

    if (loading) { return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-fifa-blue" /></div>; }
    if (!user) { navigate("/login"); return null; }
    if (error) { return <div className="p-4 text-center"><Card>...</Card></div>; }

    // --- NOVA LÓGICA DE PRAZO DINÂMICA ---
    // Verifica se a data atual é posterior à data limite definida no bolão
    const isDeadlineReached = pool?.prediction_deadline 
        ? isAfter(new Date(), new Date(pool.prediction_deadline))
        : false;

    // Formata a data limite para exibição amigável
    const deadlineFormatted = pool?.prediction_deadline 
        ? format(new Date(pool.prediction_deadline), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
        : "Não definido";
    
    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-center text-fifa-blue mb-6">Meus Palpites</h1>
            
            {/* Mensagem de alerta agora é dinâmica */}
            {isDeadlineReached && (
              <Alert variant="destructive" className="mb-6">
                <AlertTitle>Prazo Encerrado!</AlertTitle>
                <AlertDescription>O prazo para enviar ou modificar palpites ({deadlineFormatted}) encerrou.</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="daily" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="daily">Partidas</TabsTrigger>
                    <TabsTrigger value="groups">Grupos</TabsTrigger>
                    <TabsTrigger value="final">Final</TabsTrigger>
                </TabsList>
                
                <TabsContent value="daily">
                    <Card>
                        <CardHeader><CardTitle className="text-xl">Palpites das Partidas (Fase de Grupos)</CardTitle><CardDescription>Salve individualmente. O prazo geral é {deadlineFormatted}, mas cada jogo trava no seu horário de início.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            {groupStageMatches.map(match => {
                                // Lógica de bloqueio respeita tanto o prazo geral quanto o horário da partida
                                const canPredict = !isDeadlineReached && (parseISO(match.match_date).getTime() > Date.now());
                                const prediction = dailyPredictions[match.id] || { home_score: '', away_score: '' };
                                return (
                                    <Card key={match.id} className={`p-4 ${!canPredict ? 'bg-gray-100 opacity-70' : ''}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="font-semibold">{match.home_team?.name} vs {match.away_team?.name}</p>
                                            <p className="text-sm text-gray-500">{format(parseISO(match.match_date), 'dd/MM HH:mm', { locale: ptBR })}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Input type="number" min="0" className="w-20 text-center" value={prediction.home_score ?? ''} onChange={e => handleScoreChange(match.id, 'home', e.target.value)} disabled={!canPredict || submittingMatchId === match.id} />
                                            <span>x</span>
                                            <Input type="number" min="0" className="w-20 text-center" value={prediction.away_score ?? ''} onChange={e => handleScoreChange(match.id, 'away', e.target.value)} disabled={!canPredict || submittingMatchId === match.id} />
                                            {canPredict && <Button size="sm" className="ml-auto" onClick={() => handleSaveDailyPrediction(match.id)} disabled={submittingMatchId === match.id}>{submittingMatchId === match.id ? <Loader2 className="animate-spin" /> : (prediction.prediction_id ? 'Atualizar' : 'Salvar')}</Button>}
                                        </div>
                                    </Card>
                                );
                            })}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="groups">
                    <Card>
                         <CardHeader><CardTitle className="text-xl">Palpites dos Grupos</CardTitle><CardDescription>Selecione os classificados de cada grupo. Prazo final: {deadlineFormatted}.</CardDescription></CardHeader>
                         <CardContent className="space-y-6">
                             {groups.map(group => {
                                const prediction = groupPredictions[group.id] || {};
                                return (
                                    <Card key={group.id} className={`p-4 ${isDeadlineReached ? 'bg-gray-100' : ''}`}>
                                        <h3 className="text-lg font-semibold mb-3">Grupo {group.name}</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <Label>1º Lugar</Label>
                                                <Select onValueChange={(value) => handleGroupTeamChange(group.id, 'first', value)} value={prediction.predicted_first_team_id || ''} disabled={isDeadlineReached || submittingMatchId === group.id}><SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger><SelectContent>{teams.filter(t => t.group_id === group.id).map(team => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}</SelectContent></Select>
                                            </div>
                                            <div>
                                                <Label>2º Lugar</Label>
                                                <Select onValueChange={(value) => handleGroupTeamChange(group.id, 'second', value)} value={prediction.predicted_second_team_id || ''} disabled={isDeadlineReached || submittingMatchId === group.id}><SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger><SelectContent>{teams.filter(t => t.group_id === group.id).map(team => <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>)}</SelectContent></Select>
                                            </div>
                                        </div>
                                        {!isDeadlineReached && <Button className="mt-4" onClick={() => handleSaveGroupPrediction(group.id)} disabled={submittingMatchId === group.id}>{submittingMatchId === group.id ? <Loader2 className="animate-spin" /> : (prediction.prediction_id ? `Atualizar Grupo ${group.name}` : `Salvar Grupo ${group.name}`)}</Button>}
                                    </Card>
                                );
                             })}
                         </CardContent>
                     </Card>
                </TabsContent>

                <TabsContent value="final">
                    <Card>
                        <CardHeader><CardTitle className="text-xl">Palpite da Fase Final</CardTitle><CardDescription>Defina os finalistas e o placar da grande final. Prazo final: {deadlineFormatted}.</CardDescription></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><Label>Campeão</Label><Select onValueChange={v => handleFinalPredictionChange('champion_id', v)} value={finalPrediction.champion_id || ''} disabled={isDeadlineReached}><SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger><SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
                                <div><Label>Vice-Campeão</Label><Select onValueChange={v => handleFinalPredictionChange('runner_up_id', v)} value={finalPrediction.runner_up_id || ''} disabled={isDeadlineReached}><SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger><SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
                                <div><Label>3º Lugar</Label><Select onValueChange={v => handleFinalPredictionChange('third_place_id', v)} value={finalPrediction.third_place_id || ''} disabled={isDeadlineReached}><SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger><SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
                                <div><Label>4º Lugar</Label><Select onValueChange={v => handleFinalPredictionChange('fourth_place_id', v)} value={finalPrediction.fourth_place_id || ''} disabled={isDeadlineReached}><SelectTrigger><SelectValue placeholder="Selecione..."/></SelectTrigger><SelectContent>{teams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent></Select></div>
                            </div>
                            <div>
                                <Label>Placar da Final (Campeão x Vice)</Label>
                                <div className="flex items-center gap-2">
                                    <Input type="number" min="0" className="w-24 text-center" value={finalPrediction.final_home_score ?? ''} onChange={e => handleFinalPredictionChange('final_home_score', e.target.value === '' ? null : parseInt(e.target.value))} disabled={isDeadlineReached} />
                                    <span>x</span>
                                    <Input type="number" min="0" className="w-24 text-center" value={finalPrediction.final_away_score ?? ''} onChange={e => handleFinalPredictionChange('final_away_score', e.target.value === '' ? null : parseInt(e.target.value))} disabled={isDeadlineReached} />
                                </div>
                            </div>
                            {!isDeadlineReached && <Button onClick={handleSaveFinalPrediction} disabled={submittingMatchId === 'final'}>{submittingMatchId === 'final' ? <Loader2 className="animate-spin mr-2"/> : null} {finalPrediction.prediction_id ? 'Atualizar Palpite Final' : 'Salvar Palpite Final'}</Button>}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            <Card className="mt-6">
                <CardContent className="p-6">
                    <Button className="w-full" onClick={handlePrintReceipt}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir Comprovante de Palpites
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default Palpites;