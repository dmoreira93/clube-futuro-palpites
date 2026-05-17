import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertTriangle, Save, Trophy, Medal, Lock, Wallet } from "lucide-react"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Match, Team } from "@/types/matches";
import { format, parseISO, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

// Interfaces Locais
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
  final_home_score: string; 
  final_away_score: string;
  prediction_id?: string;
}

const Palpites = () => {
    const { user, activePool: pool, userParticipations } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submittingId, setSubmittingId] = useState<string | null>(null);
    
    // Novo Estado: Regras do Campeonato
    const [champRules, setChampRules] = useState({ has_groups: true, has_final: true });

    const [allMatches, setAllMatches] = useState<Match[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
    
    const [dailyPredictions, setDailyPredictions] = useState<{ [matchId: string]: LocalPrediction }>({});
    const [groupPredictions, setGroupPredictions] = useState<{ [groupId: string]: GroupPredictionState }>({});
    const [finalPrediction, setFinalPrediction] = useState<FinalPredictionState>({
        champion_id: null, runner_up_id: null, third_place_id: null, fourth_place_id: null,
        final_home_score: '', final_away_score: '',
    });

    // --- REGRA DE BLOQUEIO 1: PRAZO (MODIFICADO) ---
    const isDeadlineLocked = useMemo(() => {
        if (!pool) return true;
        
        // 1. Data Limite do Bolão (Prioridade Absoluta)
        if (pool.prediction_deadline) {
            return isAfter(new Date(), new Date(pool.prediction_deadline));
        }

        // 2. Início do Campeonato (Fallback)
        if (allMatches.length > 0) {
            const firstMatchDate = new Date(Math.min(...allMatches.map(m => new Date(m.match_date).getTime())));
            return isAfter(new Date(), firstMatchDate);
        }

        return false;
    }, [pool, allMatches]);

    // --- REGRA DE BLOQUEIO 2: PAGAMENTO ---
    const isPaymentLocked = useMemo(() => {
        if (!pool?.payment_required) return false;
        
        // Imunidade do Dono
        if (pool.owner_id === user?.id) return false;
        
        const myPart = userParticipations.find(p => p.pool_id === pool.id);
        return myPart?.payment_status !== 'paid';
    }, [pool, userParticipations, user?.id]);

    const isLocked = isDeadlineLocked || isPaymentLocked;

    const deadlineMessage = useMemo(() => {
        if (!pool?.prediction_deadline) return "o início do campeonato";
        return format(new Date(pool.prediction_deadline), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    }, [pool]);

    const fetchInitialData = useCallback(async () => {
        if (!user || !pool?.championship_id) { setLoading(false); return; }

        setLoading(true);
        try {
            // 0. BUSCAR REGRAS DO CAMPEONATO
            const { data: champData } = await supabase
                .from('championships')
                .select('has_group_stage, has_final_match')
                .eq('id', pool.championship_id)
                .single();
            
            // Define as regras (se não vier do banco, assume TRUE como padrão antigo)
            if (champData) {
                setChampRules({
                    has_groups: champData.has_group_stage ?? true,
                    has_final: champData.has_final_match ?? true
                });
            }

            // 1. Buscar Partidas
            const { data: matchesData } = await supabase
                .from('matches')
                .select('*, home_team:home_team_id(*), away_team:away_team_id(*)')
                .eq('championship_id', pool.championship_id)
                .order('match_date', { ascending: true });
            setAllMatches(matchesData || []);

            // 2. Buscar Times
            const { data: teamsData } = await supabase.from('teams').select('*').order('name', { ascending: true });
            setTeams(teamsData || []);

            // 3. Buscar Grupos (SÓ SE O CAMPEONATO TIVER)
            if (champData?.has_group_stage !== false) {
                const { data: groupsData } = await supabase
                    .from('groups')
                    .select('id, name')
                    .eq('championship_id', pool.championship_id)
                    .order('name', { ascending: true });
                setGroups(groupsData || []);
            }

            // 4. Carregar Palpites Existentes
            if (user && pool) {
                // Jogos
                const { data: preds } = await supabase.from('match_predictions').select('*').eq('user_id', user.id).eq('pool_id', pool.id);
                const loadedPreds: any = {};
                preds?.forEach(p => loadedPreds[p.match_id] = { 
                    match_id: p.match_id, 
                    home_score: p.home_score?.toString() || '', 
                    away_score: p.away_score?.toString() || '', 
                    prediction_id: p.id 
                });
                setDailyPredictions(loadedPreds);

                // Grupos
                if (champData?.has_group_stage !== false) {
                    const { data: gPreds } = await supabase.from('group_predictions').select('*').eq('user_id', user.id).eq('pool_id', pool.id);
                    const loadedGroupPreds: any = {};
                    gPreds?.forEach(p => loadedGroupPreds[p.group_id] = {
                        group_id: p.group_id,
                        predicted_first_team_id: p.predicted_first_team_id,
                        predicted_second_team_id: p.predicted_second_team_id,
                        prediction_id: p.id
                    });
                    setGroupPredictions(loadedGroupPreds);
                }

                // Final
                if (champData?.has_final_match !== false) {
                    const { data: fPred } = await supabase.from('final_predictions').select('*').eq('user_id', user.id).eq('pool_id', pool.id).maybeSingle();
                    if (fPred) {
                        setFinalPrediction({
                            champion_id: fPred.champion_id,
                            runner_up_id: fPred.runner_up_id,
                            third_place_id: fPred.third_place_id,
                            fourth_place_id: fPred.fourth_place_id,
                            final_home_score: fPred.final_home_score?.toString() || '',
                            final_away_score: fPred.final_away_score?.toString() || '',
                            prediction_id: fPred.id
                        });
                    }
                }
            }

        } catch (err: any) {
            console.error(err);
            toast({ title: "Erro", description: "Falha ao carregar dados.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [user, pool, toast]);
    
    useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

    // --- HANDLERS ---

    const handleMatchSave = async (matchId: string) => {
        if (isLocked) return;
        const p = dailyPredictions[matchId];
        if (!p || !p.home_score || !p.away_score) return toast({ title: "Preencha o placar", variant: "destructive" });

        setSubmittingId(matchId);
        try {
            const { error } = await supabase.from('match_predictions').upsert({
                match_id: matchId,
                user_id: user!.id,
                pool_id: pool!.id,
                home_score: parseInt(p.home_score),
                away_score: parseInt(p.away_score)
            }, { onConflict: 'user_id, pool_id, match_id' });

            if (error) throw error;
            toast({ title: "Salvo!", description: "Palpite de jogo atualizado." });
        } catch (e: any) {
            toast({ title: "Erro", description: e.message, variant: "destructive" });
        } finally { setSubmittingId(null); }
    };

    const handleGroupSave = async (groupId: string) => {
        if (isLocked) return;
        const p = groupPredictions[groupId];
        if (!p || !p.predicted_first_team_id || !p.predicted_second_team_id) return toast({ title: "Selecione os dois times", variant: "destructive" });
        if (p.predicted_first_team_id === p.predicted_second_team_id) return toast({ title: "Times iguais", description: "Selecione times diferentes para 1º e 2º.", variant: "destructive" });

        setSubmittingId(groupId);
        try {
            const { error } = await supabase.from('group_predictions').upsert({
                group_id: groupId,
                user_id: user!.id,
                pool_id: pool!.id,
                predicted_first_team_id: p.predicted_first_team_id,
                predicted_second_team_id: p.predicted_second_team_id
            }, { onConflict: 'user_id, pool_id, group_id' });

            if (error) throw error;
            toast({ title: "Salvo!", description: `Grupo ${groups.find(g => g.id === groupId)?.name} atualizado.` });
        } catch (e: any) {
            toast({ title: "Erro", description: e.message, variant: "destructive" });
        } finally { setSubmittingId(null); }
    };

    const handleFinalSave = async () => {
        if (isLocked) return;
        const f = finalPrediction;
        if (!f.champion_id || !f.runner_up_id || !f.third_place_id || !f.fourth_place_id || !f.final_home_score || !f.final_away_score) {
            return toast({ title: "Incompleto", description: "Preencha todos os campos da final (Pódio e Placar).", variant: "destructive" });
        }
        
        const podio = [f.champion_id, f.runner_up_id, f.third_place_id, f.fourth_place_id];
        if (new Set(podio).size !== podio.length) return toast({ title: "Times repetidos", description: "Os times do pódio devem ser diferentes.", variant: "destructive" });

        setSubmittingId('final');
        try {
            const { error } = await supabase.from('final_predictions').upsert({
                user_id: user!.id,
                pool_id: pool!.id,
                champion_id: f.champion_id,
                runner_up_id: f.runner_up_id,
                third_place_id: f.third_place_id,
                fourth_place_id: f.fourth_place_id,
                final_home_score: parseInt(f.final_home_score),
                final_away_score: parseInt(f.final_away_score)
            }, { onConflict: 'user_id, pool_id' });

            if (error) throw error;
            toast({ title: "Salvo!", description: "Seu palpite final foi registrado." });
        } catch (e: any) {
            toast({ title: "Erro", description: e.message, variant: "destructive" });
        } finally { setSubmittingId(null); }
    };

    // Alerta Dinâmico
    const AlertHeader = () => {
        if (isPaymentLocked) {
            return (
                <Alert variant="destructive" className="mb-8 bg-yellow-50 border-yellow-200">
                    <Wallet className="h-5 w-5 text-yellow-600" />
                    <AlertTitle className="text-yellow-800">Pagamento Pendente</AlertTitle>
                    <AlertDescription className="text-yellow-700">
                        O envio de palpites está bloqueado até que o seu pagamento seja confirmado pelo administrador do bolão.
                    </AlertDescription>
                </Alert>
            );
        }
        if (isDeadlineLocked) {
            return (
                <Alert variant="destructive" className="mb-8 bg-red-50 border-red-200">
                    <Lock className="h-5 w-5 text-red-600" />
                    <AlertTitle className="text-red-800">Apostas Encerradas</AlertTitle>
                    <AlertDescription className="text-red-700">
                        O prazo para envio de palpites encerrou em {deadlineMessage}.
                    </AlertDescription>
                </Alert>
            );
        }
        return (
            <Alert className="mb-8 bg-blue-50 border-blue-200">
                <Save className="h-5 w-5 text-blue-600" />
                <AlertTitle className="text-blue-800">Apostas Abertas</AlertTitle>
                <AlertDescription className="text-blue-700">
                    Preencha seus palpites e não esqueça de salvar! Encerramento: {deadlineMessage}.
                </AlertDescription>
            </Alert>
        );
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-10 w-10 animate-spin text-fifa-blue" /></div>;
    if (!pool) return null;

    // Helper para definir largura das abas no CSS Grid
    const getGridCols = () => {
        let cols = 1; // Jogos é sempre fixo
        if (champRules.has_groups) cols++;
        if (champRules.has_final) cols++;
        return `grid-cols-${cols}`;
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-5xl">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-fifa-blue mb-2">Meus Palpites</h1>
              <p className="text-gray-500">Preencha seus palpites para o bolão <strong>{pool.name}</strong></p>
            </div>
            
            <AlertHeader />

            <Tabs defaultValue="daily" className="w-full">
                <TabsList className={`grid w-full ${getGridCols()} mb-8 h-12`}>
                    <TabsTrigger value="daily" className="text-base">Jogos</TabsTrigger>
                    
                    {champRules.has_groups && (
                        <TabsTrigger value="groups" className="text-base">Grupos</TabsTrigger>
                    )}
                    
                    {champRules.has_final && (
                        <TabsTrigger value="final" className="text-base">Finais</TabsTrigger>
                    )}
                </TabsList>
                
                {/* --- ABA 1: PARTIDAS --- */}
                <TabsContent value="daily" className="space-y-6">
                    {allMatches.length === 0 ? <p className="text-center py-4 text-gray-500">Nenhuma partida encontrada.</p> :
                        allMatches.map(match => {
                            const p = dailyPredictions[match.id] || { home_score: '', away_score: '' };
                            return (
                                <Card key={match.id} className={`overflow-hidden transition-opacity ${isLocked ? 'opacity-80' : ''}`}>
                                    <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        {/* Info do Jogo */}
                                        <div className="flex-1 w-full flex items-center justify-center sm:justify-start gap-4 text-center sm:text-left">
                                            <div className="text-xs text-gray-400 font-mono hidden sm:block">
                                                {format(parseISO(match.match_date), 'dd/MM HH:mm')}
                                            </div>
                                            <div className="flex items-center gap-2 flex-1 justify-end">
                                                <span className="font-bold text-gray-700">{match.home_team?.name}</span>
                                            </div>
                                            <span className="text-gray-300 font-light">X</span>
                                            <div className="flex items-center gap-2 flex-1 justify-start">
                                                <span className="font-bold text-gray-700">{match.away_team?.name}</span>
                                            </div>
                                        </div>

                                        {/* Inputs de Placar */}
                                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                            <Input 
                                                type="number" min="0" className="w-14 text-center font-bold text-lg h-10 p-0" 
                                                value={p.home_score} 
                                                onChange={e => setDailyPredictions(prev => ({...prev, [match.id]: {...(prev[match.id] || {match_id: match.id}), home_score: e.target.value}}))}
                                                disabled={isLocked || submittingId === match.id}
                                            />
                                            <span className="text-gray-400">-</span>
                                            <Input 
                                                type="number" min="0" className="w-14 text-center font-bold text-lg h-10 p-0" 
                                                value={p.away_score}
                                                onChange={e => setDailyPredictions(prev => ({...prev, [match.id]: {...(prev[match.id] || {match_id: match.id}), away_score: e.target.value}}))}
                                                disabled={isLocked || submittingId === match.id}
                                            />
                                            {!isLocked && (
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-10 w-10 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    onClick={() => handleMatchSave(match.id)}
                                                    disabled={submittingId === match.id}
                                                >
                                                    {submittingId === match.id ? <Loader2 className="h-5 w-5 animate-spin"/> : <Save className="h-5 w-5"/>}
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })
                    }
                </TabsContent>

{/* --- ABA 2: GRUPOS --- */}
{champRules.has_groups && (
    <TabsContent value="groups" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groups.map(group => {
                const p = groupPredictions[group.id] || { group_id: group.id, predicted_first_team_id: null, predicted_second_team_id: null };

                // FILTRO DIRETO E LIMPO: Busca na tabela de times apenas quem pertence a este grupo
                const teamsInThisGroup = teams
                    .filter(t => t.group_id === group.id)
                    .sort((a, b) => a.name.localeCompare(b.name));

                return (
                    <Card key={group.id} className="border-t-4 border-t-fifa-blue">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{group.name}</CardTitle>
                            <CardDescription>Quem passa de fase?</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            
                            {/* 1º COLOCADO */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 flex items-center gap-2">
                                    <Trophy className="h-4 w-4 text-yellow-500"/> 1º Colocado
                                </label>
                                <Select 
                                    disabled={isLocked} 
                                    value={p.predicted_first_team_id || ''} 
                                    onValueChange={(val) => setGroupPredictions(prev => ({
                                        ...prev, 
                                        [group.id]: {
                                            ...(prev[group.id] || { group_id: group.id }), 
                                            predicted_first_team_id: val,
                                            // Se o usuário mudar o 1º colocado para o mesmo time que estava no 2º, limpa o 2º
                                            predicted_second_team_id: prev[group.id]?.predicted_second_team_id === val ? null : prev[group.id]?.predicted_second_team_id
                                        }
                                    }))}
                                >
                                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                    <SelectContent>
                                        {teamsInThisGroup.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {/* 2º COLOCADO (Com regra de bloqueio visual) */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 flex items-center gap-2">
                                    <Medal className="h-4 w-4 text-gray-400"/> 2º Colocado
                                </label>
                                <Select 
                                    disabled={isLocked || !p.predicted_first_team_id} 
                                    value={p.predicted_second_team_id || ''} 
                                    onValueChange={(val) => setGroupPredictions(prev => ({
                                        ...prev, 
                                        [group.id]: {
                                            ...(prev[group.id] || { group_id: group.id }), 
                                            predicted_second_team_id: val
                                        }
                                    }))}
                                >
                                    <SelectTrigger><SelectValue placeholder={p.predicted_first_team_id ? "Selecione..." : "Selecione o 1º..."} /></SelectTrigger>
                                    <SelectContent>
                                        {teamsInThisGroup.map(t => {
                                            const isSelectedAsFirst = t.id === p.predicted_first_team_id;
                                            return (
                                                <SelectItem 
                                                    key={t.id} 
                                                    value={t.id}
                                                    disabled={isSelectedAsFirst}
                                                    className={isSelectedAsFirst ? "opacity-40 line-through pointer-events-none" : ""}
                                                >
                                                    {t.name} {isSelectedAsFirst && " (Já selecionado)"}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {!isLocked && (
                                <Button className="w-full mt-2" onClick={() => handleGroupSave(group.id)} disabled={submittingId === group.id}>
                                    {submittingId === group.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>} 
                                    Salvar Grupo
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    </TabsContent>
)}

{/* --- ABA 3: FINAL --- */}
{champRules.has_final && (
    <TabsContent value="final">
        <Card className="border-t-4 border-t-fifa-gold shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl text-fifa-blue">
                    <Trophy className="h-8 w-8 text-yellow-500"/> O Grande Final
                </CardTitle>
                <CardDescription>Quem levará a taça? Defina o pódio e o placar da finalíssima.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                
                {/* PÓDIO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-700 border-b pb-2">Pódio do Campeonato</h3>
                        <div className="space-y-3">
                            {[
                                { label: "Campeão", icon: <Trophy className="h-4 w-4 text-yellow-500"/>, field: 'champion_id' },
                                { label: "Vice-Campeão", icon: <Medal className="h-4 w-4 text-gray-400"/>, field: 'runner_up_id' },
                                { label: "3º Lugar", icon: <Medal className="h-4 w-4 text-orange-400"/>, field: 'third_place_id' },
                                { label: "4º Lugar", icon: <Medal className="h-4 w-4 text-blue-300"/>, field: 'fourth_place_id' },
                            ].map((item: any) => {
                                // 1. FILTRO: Puxa apenas os times que pertencem a este campeonato específico
                                const championshipTeams = teams
                                    .filter(t => t.championship_id === pool?.championship_id)
                                    .sort((a, b) => a.name.localeCompare(b.name));

                                return (
                                    <div key={item.field}>
                                        <label className="text-sm font-medium text-gray-600 flex items-center gap-2 mb-1">
                                            {item.icon} {item.label}
                                        </label>
                                        <Select 
                                            disabled={isLocked}
                                            value={finalPrediction[item.field as keyof FinalPredictionState] as string || ''}
                                            onValueChange={(val) => setFinalPrediction(prev => {
                                                const updated = { ...prev, [item.field]: val };
                                                
                                                // Limpeza automática se o usuário selecionar o mesmo time em outra posição do pódio
                                                if (item.field !== 'champion_id' && updated.champion_id === val) updated.champion_id = null;
                                                if (item.field !== 'runner_up_id' && updated.runner_up_id === val) updated.runner_up_id = null;
                                                if (item.field !== 'third_place_id' && updated.third_place_id === val) updated.third_place_id = null;
                                                if (item.field !== 'fourth_place_id' && updated.fourth_place_id === val) updated.fourth_place_id = null;
                                                
                                                // Restaura o valor que o usuário acabou de clicar para não ser apagado pela limpeza
                                                updated[item.field as keyof FinalPredictionState] = val as any;
                                                return updated;
                                            })}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Selecione o time..." /></SelectTrigger>
                                            <SelectContent>
                                                {championshipTeams.map(t => {
                                                    // 2. BLOQUEIO: Verifica se a seleção já ocupa outro lugar do pódio
                                                    const isUsedElsewhere = 
                                                        (item.field !== 'champion_id' && finalPrediction.champion_id === t.id) ||
                                                        (item.field !== 'runner_up_id' && finalPrediction.runner_up_id === t.id) ||
                                                        (item.field !== 'third_place_id' && finalPrediction.third_place_id === t.id) ||
                                                        (item.field !== 'fourth_place_id' && finalPrediction.fourth_place_id === t.id);

                                                    return (
                                                        <SelectItem 
                                                            key={t.id} 
                                                            value={t.id}
                                                            disabled={isUsedElsewhere}
                                                            className={isUsedElsewhere ? "opacity-40 line-through pointer-events-none" : ""}
                                                        >
                                                            {t.name} {isUsedElsewhere && " (Já selecionado)"}
                                                        </SelectItem>
                                                    );
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* PLACAR DA FINAL */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-700 border-b pb-2">Placar da Final</h3>
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 text-center">
                            <p className="text-sm text-gray-500 mb-4">Qual será o resultado exato do jogo final?</p>
                            <div className="flex items-center justify-center gap-4">
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Campeão</span>
                                    <Input 
                                        type="number" min="0" className="w-20 text-center text-2xl h-14 font-bold" 
                                        value={finalPrediction.final_home_score}
                                        onChange={(e) => setFinalPrediction(prev => ({...prev, final_home_score: e.target.value}))}
                                        disabled={isLocked}
                                    />
                                </div>
                                <span className="text-2xl font-light text-gray-300">X</span>
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Vice</span>
                                    <Input 
                                        type="number" min="0" className="w-20 text-center text-2xl h-14 font-bold" 
                                        value={finalPrediction.final_away_score}
                                        onChange={(e) => setFinalPrediction(prev => ({...prev, final_away_score: e.target.value}))}
                                        disabled={isLocked}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {!isLocked && (
                    <div className="flex justify-end pt-4 border-t">
                        <Button size="lg" className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold" onClick={handleFinalSave} disabled={submittingId === 'final'}>
                            {submittingId === 'final' ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Save className="mr-2 h-5 w-5"/>}
                            Salvar Palpite Final
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    </TabsContent>
)};

export default Palpites;