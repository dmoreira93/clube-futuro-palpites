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
        if (!user) { setLoading(false); return; }
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

    const handleSaveDailyPrediction = useCallback(async (matchId: string) => {
        if (!user) { toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" }); return; }
        const prediction = dailyPredictions[matchId];
        if (!prediction || !prediction.home_score || !prediction.away_score) { toast({ title: "Erro", description: "Preencha ambos os placares.", variant: "destructive" }); return; }
        setSubmittingMatchId(matchId);
        try {
            const payload = { match_id: matchId, user_id: user.id, home_score: parseInt(prediction.home_score), away_score: parseInt(prediction.away_score) };
            const { data, error } = await supabase.from('match_predictions').upsert(payload, { onConflict: 'match_id, user_id' }).select().single();
            if (error) throw error;
            if (data) {
                setDailyPredictions(prev => ({ ...prev, [matchId]: { ...prev[matchId], prediction_id: data.id } }));
                toast({ title: "Sucesso!", description: `Palpite salvo!` });
            }
        } catch (error: any) {
            toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
        } finally {
            setSubmittingMatchId(null);
        }
    }, [user, dailyPredictions, toast]);
    
    const handleSaveGroupPrediction = useCallback(async (groupId: string) => {
        if (!user) { toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" }); return; }
        const prediction = groupPredictions[groupId];
        if (!prediction || !prediction.predicted_first_team_id || !prediction.predicted_second_team_id) { toast({ title: "Erro", description: "Selecione os dois times.", variant: "destructive" }); return; }
        setSubmittingMatchId(groupId);
        try {
            const payload = { group_id: groupId, user_id: user.id, predicted_first_team_id: prediction.predicted_first_team_id, predicted_second_team_id: prediction.predicted_second_team_id };
            const { data, error } = await supabase.from('group_predictions').upsert(payload, { onConflict: 'group_id, user_id' }).select().single();
            if (error) throw error;
            if (data) {
                setGroupPredictions(prev => ({ ...prev, [groupId]: { ...prev[groupId], prediction_id: data.id }}));
                toast({ title: "Sucesso!", description: `Palpite do grupo ${groups.find(g => g.id === groupId)?.name} salvo!` });
            }
        } catch (error: any) {
            toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
        } finally {
            setSubmittingMatchId(null);
        }
    }, [user, groupPredictions, groups, toast]);
    
    const handleSaveFinalPrediction = useCallback(async () => {
        if (!user) { toast({ title: "Erro", description: "Você precisa estar logado.", variant: "destructive" }); return; }
        if (!finalPrediction.champion_id || !finalPrediction.vice_champion_id || !finalPrediction.third_place_id || !finalPrediction.fourth_place_id || finalPrediction.final_home_score === null || finalPrediction.final_away_score === null) {
            toast({ title: "Erro de Validação", description: "Por favor, preencha todos os campos do palpite da final.", variant: "destructive" }); return;
        }
        setSubmittingMatchId('final');
        try {
            const payload = { user_id: user.id, champion_id: finalPrediction.champion_id, vice_champion_id: finalPrediction.vice_champion_id, third_place_id: finalPrediction.third_place_id, fourth_place_id: finalPrediction.fourth_place_id, final_home_score: finalPrediction.final_home_score, final_away_score: finalPrediction.final_away_score };
            const { data, error } = await supabase.from('final_predictions').upsert(payload, { onConflict: 'user_id' }).select().single();
            if (error) throw error;
            if (data) {
                setFinalPrediction(prev => ({ ...prev, prediction_id: data.id }));
                toast({ title: "Sucesso!", description: "Seu palpite da final foi salvo!" });
            }
        } catch (error: any) {
            toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
        } finally {
            setSubmittingMatchId(null);
        }
    }, [user, finalPrediction, toast]);

    const handlePrintReceipt = useCallback(() => {
    if (!user) {
      toast({ title: "Erro", description: "Você precisa estar logado para gerar o comprovante.", variant: "destructive" });
      return;
    }
  
    // 1. Coleta e formata os palpites de partidas
    const userMatchPredictionsForReceipt = Object.values(dailyPredictions)
      .map(p => {
        const match = allMatches.find(m => m.id === p.match_id);
        if (!match || p.home_score.trim() === "" || p.away_score.trim() === "") return null;
        return {
          match: match,
          home_score_prediction: parseInt(p.home_score, 10),
          away_score_prediction: parseInt(p.away_score, 10),
        };
      }).filter((p): p is NonNullable<typeof p> => p !== null);
  
    // 2. Coleta e formata os palpites de grupos
    const userGroupPredictionsForReceipt = Object.values(groupPredictions)
      .map(gp => {
        if (!gp.predicted_first_team_id || !gp.predicted_second_team_id) return null;
        const group = groups.find(g => g.id === gp.group_id);
        const firstTeam = teams.find(t => t.id === gp.predicted_first_team_id);
        const secondTeam = teams.find(t => t.id === gp.predicted_second_team_id);
        if (!group || !firstTeam || !secondTeam) return null;
        return { group_name: group.name, predicted_first_team: firstTeam, predicted_second_team: secondTeam };
      }).filter((p): p is NonNullable<typeof p> => p !== null);
  
    // 3. Coleta e formata o palpite final
    const getTeamById = (id: string | null) => teams.find(t => t.id === id);
    const finalPredictionReceipt = {
        champion: getTeamById(finalPrediction.champion_id),
        vice_champion: getTeamById(finalPrediction.vice_champion_id),
        third_place: getTeamById(finalPrediction.third_place_id),
        fourth_place: getTeamById(finalPrediction.fourth_place_id),
        final_home_score: finalPrediction.final_home_score,
        final_away_score: finalPrediction.final_away_score,
    };
    
    // Verifica se há pelo menos um palpite para imprimir
    if (userMatchPredictionsForReceipt.length === 0 && userGroupPredictionsForReceipt.length === 0 && !finalPredictionReceipt.champion) {
        toast({ title: "Atenção", description: "Nenhum palpite completo para gerar o comprovante.", variant: "default" });
        return;
    }

    // 4. Gera e abre a janela de impressão
    const dateGenerated = new Date();
    const receiptHtml = ReactDOMServer.renderToString(
      <PredictionReceipt
        user={user}
        predictions={userMatchPredictionsForReceipt as any}
        groupPredictions={userGroupPredictionsForReceipt}
        finalPrediction={finalPredictionReceipt as any}
        dateGenerated={dateGenerated}
      />
    );
  
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<!DOCTYPE html><html><head><title>Comprovante de Palpites</title></head><body>${receiptHtml}</body></html>`);
      printWindow.document.close();
      printWindow.focus();
      // Adiciona um pequeno delay para garantir que o conteúdo foi renderizado antes de imprimir
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  }, [user, dailyPredictions, allMatches, teams, groupPredictions, groups, finalPrediction, toast]);

export default Palpites;