// src/pages/Palpites.tsx
import { useState, useEffect, useCallback } from "react";
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
import { Volleyball as SoccerBallIcon, Trophy as TrophyIcon, Users as UsersIcon, Loader2, Printer } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Match, Team } from "@/types/matches"; // Certifique-se de que 'Team' está em '@/types/matches' ou importe de '@/utils/pointsCalculator/types'
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactDOMServer from 'react-dom/server'; // Importação NECESSÁRIA para renderizar HTML em string
import PredictionReceipt from '@/components/home/predictions/PredictionReceipt'; // Importar o componente do comprovante

// --- INTERFACES PARA O ESTADO ---
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
  third_place_id: string | null; // NOVO CAMPO
  fourth_place_id: string | null; // NOVO CAMPO
  final_home_score: number | null;
  final_away_score: number | null;
  prediction_id?: string;
}

// --- COMPONENTE PRINCIPAL ---
const Palpites = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);

  // Estados para os palpites
  const [dailyPredictions, setDailyPredictions] = useState<{ [matchId: string]: LocalPrediction }>({});
  const [groupPredictions, setGroupPredictions] = useState<{ [groupId: string]: GroupPredictionState }>({});
  const [finalPrediction, setFinalPrediction] = useState<FinalPredictionState>({
    champion_id: null,
    vice_champion_id: null,
    third_place_id: null, // Inicializa novo campo
    fourth_place_id: null, // Inicializa novo campo
    final_home_score: null,
    final_away_score: null,
  });

  // Datas de corte (ajuste conforme a data real do seu bolão)
  const globalPredictionCutoffDate = parseISO("2026-06-12T12:00:00-03:00"); // Data de início do torneio ou global
  const finalPredictionCutoffDate = parseISO("2026-07-01T12:00:00-03:00"); // Exemplo: Antes do início da fase final

  // --- FUNÇÕES DE CARREGAMENTO DE DADOS ---

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Carregar Partidas e Palpites Diários
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*, home_team:home_team_id(*), away_team:away_team_id(*)')
        .order('match_date', { ascending: true });

      if (matchesError) throw matchesError;
      setMatches(matchesData || []); // Adiciona '|| []' para segurança

      if (user) {
        const { data: predictionsData, error: predictionsError } = await supabase
          .from('match_predictions')
          .select('*')
          .eq('user_id', user.id);

        if (predictionsError) throw predictionsError;

        const loadedPredictions: { [matchId: string]: LocalPrediction } = {};
        (predictionsData || []).forEach(p => { // Adiciona '|| []' para segurança
          loadedPredictions[p.match_id] = {
            match_id: p.match_id,
            home_score: p.home_score !== null ? p.home_score.toString() : '', // Evita null no toString
            away_score: p.away_score !== null ? p.away_score.toString() : '', // Evita null no toString
            prediction_id: p.id,
          };
        });
        setDailyPredictions(loadedPredictions);
      }

      // 2. Carregar Times e Grupos
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .order('name', { ascending: true });
      if (teamsError) throw teamsError;
      setTeams(teamsData || []); // Adiciona '|| []' para segurança

      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('id, name')
        .order('name', { ascending: true });
      if (groupsError) throw groupsError;
      setGroups(groupsData || []); // Adiciona '|| []' para segurança

      // 3. Carregar Palpites de Grupo
      if (user) {
        const { data: groupPredData, error: groupPredError } = await supabase
          .from('group_predictions')
          .select('*')
          .eq('user_id', user.id);

        if (groupPredError) throw groupPredError;

        const loadedGroupPredictions: { [groupId: string]: GroupPredictionState } = {};
        (groupPredData || []).forEach(gp => { // Adiciona '|| []' para segurança
          loadedGroupPredictions[gp.group_id] = {
            group_id: gp.group_id,
            predicted_first_team_id: gp.predicted_first_team_id,
            predicted_second_team_id: gp.predicted_second_team_id,
            prediction_id: gp.id,
          };
        });
        setGroupPredictions(loadedGroupPredictions);
      }

      // 4. Carregar Palpites da Final
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
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleScoreChange = useCallback((matchId: string, type: 'home' | 'away', value: string) => {
    setDailyPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || { match_id: matchId, home_score: '', away_score: '' }), // Garante que o objeto base exista
        [type === 'home' ? 'home_score' : 'away_score']: value,
      }
    }));
  }, []);

  const handleGroupTeamChange = useCallback((groupId: string, type: 'first' | 'second', teamId: string) => {
    setGroupPredictions(prev => ({
      ...prev,
      [groupId]: {
        ...(prev[groupId] || { group_id: groupId, predicted_first_team_id: null, predicted_second_team_id: null }),
        [type === 'first' ? 'predicted_first_team_id' : 'predicted_second_team_id']: teamId || null,
      }
    }));
  }, []);

  const handleFinalPredictionChange = useCallback((field: keyof FinalPredictionState, value: string | number | null) => {
    setFinalPrediction(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleSaveDailyPrediction = async (matchId: string) => {
    if (!user) {
      toast.error("Você precisa estar logado para salvar seu palpite.");
      return;
    }

    const prediction = dailyPredictions[matchId];
    if (!prediction || prediction.home_score === "" || prediction.away_score === "") {
      toast.error("Por favor, preencha ambos os placares para o palpite.");
      return;
    }

    const homeScoreNum = parseInt(prediction.home_score, 10);
    const awayScoreNum = parseInt(prediction.away_score, 10);

    if (isNaN(homeScoreNum) || isNaN(awayScoreNum) || homeScoreNum < 0 || awayScoreNum < 0) {
      toast.error("Os placares devem ser números válidos e não negativos.");
      return;
    }

    const match = matches.find(m => m.id === matchId);
    if (!match) {
      toast.error("Partida não encontrada.");
      return;
    }

    const matchDate = parseISO(match.match_date);
    if (matchDate.getTime() <= Date.now()) {
      toast.error("O prazo para palpites desta partida já encerrou.");
      return;
    }

    setSubmitting(true);
    try {
      let data, error;
      const payload = {
        match_id: matchId,
        user_id: user.id,
        home_score: homeScoreNum,
        away_score: awayScoreNum,
      };

      if (prediction.prediction_id) {
        ({ data, error } = await supabase
          .from('match_predictions')
          .update({
            home_score: payload.home_score,
            away_score: payload.away_score,
            updated_at: new Date().toISOString(),
          })
          .eq('id', prediction.prediction_id)
          .select()
          .single());
      } else {
        ({ data, error } = await supabase
          .from('match_predictions')
          .insert(payload)
          .select()
          .single());
      }

      if (error) throw error;

      if (data) { // Verifica se data não é null
        setDailyPredictions(prev => ({
          ...prev,
          [matchId]: { ...prev[matchId], prediction_id: data.id }
        }));
      }
      toast.success("Palpite salvo com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar palpite:", error);
      toast.error(`Erro ao salvar palpite: ${error.message || error.toString()}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitBets = async () => { // Botão "Confirmar Palpites da Aba Partidas"
    if (!user) {
      toast.error("Você precisa estar logado para confirmar os palpites.");
      return;
    }
    setSubmitting(true);

    const predictionsToUpsert = Object.values(dailyPredictions)
      .filter(p => {
        const homeScoreNum = parseInt(p.home_score, 10);
        const awayScoreNum = parseInt(p.away_score, 10);
        const homeScoreValid = p.home_score !== "" && !isNaN(homeScoreNum) && homeScoreNum >= 0;
        const awayScoreValid = p.away_score !== "" && !isNaN(awayScoreNum) && awayScoreNum >= 0;
        const match = matches.find(m => m.id === p.match_id);
        const canPredict = match && parseISO(match.match_date).getTime() > Date.now();
        return homeScoreValid && awayScoreValid && canPredict;
      })
      .map(p => ({
        // Se p.prediction_id existir, inclua-o para que o upsert possa ATUALIZAR.
        // Se não existir, o upsert fará um INSERT.
        // A chave de conflito no Supabase deve ser (user_id, match_id).
        ...(p.prediction_id && { id: p.prediction_id }), 
        match_id: p.match_id,
        user_id: user.id,
        home_score: parseInt(p.home_score, 10),
        away_score: parseInt(p.away_score, 10),
      }));

    if (predictionsToUpsert.length === 0) {
      toast.info("Nenhum palpite válido para salvar/atualizar ou todos os prazos encerraram.");
      setSubmitting(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('match_predictions')
        .upsert(predictionsToUpsert, { onConflict: 'user_id, match_id' });

      if (error) throw error;

      toast.success("Palpites das partidas salvos/atualizados com sucesso!");
      await fetchInitialData(); // Recarrega os dados para pegar os prediction_ids atualizados
    } catch (error: any) {
      console.error("Erro ao salvar palpites das partidas:", error);
      toast.error(`Erro ao salvar palpites das partidas: ${error.message || error.toString()}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveGroupPrediction = useCallback(async (groupId: string) => {
    if (!user) {
      toast.error("Você precisa estar logado para salvar seu palpite de grupo.");
      return;
    }
    if (globalPredictionCutoffDate.getTime() <= Date.now()) {
      toast.error("O prazo para palpites de grupo já encerrou.");
      return;
    }
    const prediction = groupPredictions[groupId];
    if (!prediction || !prediction.predicted_first_team_id || !prediction.predicted_second_team_id) {
      toast.error("Por favor, selecione os dois times classificados para o grupo.");
      return;
    }
    if (prediction.predicted_first_team_id === prediction.predicted_second_team_id) {
      toast.error("Os times do 1º e 2º lugar não podem ser os mesmos.");
      return;
    }
    setSubmitting(true);
    try {
      let data, error;
      const payload = {
        group_id: groupId,
        user_id: user.id,
        predicted_first_team_id: prediction.predicted_first_team_id,
        predicted_second_team_id: prediction.predicted_second_team_id,
      };
      if (prediction.prediction_id) {
        ({ data, error } = await supabase
          .from('group_predictions')
          .update({
            predicted_first_team_id: payload.predicted_first_team_id,
            predicted_second_team_id: payload.predicted_second_team_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', prediction.prediction_id)
          .select().single());
      } else {
        ({ data, error } = await supabase
          .from('group_predictions')
          .insert(payload)
          .select().single());
      }
      if (error) throw error;
      
      if(data) { // Verifica se data não é null
        setGroupPredictions(prev => ({
          ...prev,
          [groupId]: { ...prev[groupId], prediction_id: data.id }
        }));
      }
      toast.success(`Palpite do grupo ${groups.find(g => g.id === groupId)?.name || ''} salvo com sucesso!`);
    } catch (error: any) {
      console.error("Erro ao salvar palpite de grupo:", error);
      toast.error(`Erro ao salvar palpite de grupo: ${error.message || error.toString()}`);
    } finally {
      setSubmitting(false);
    }
  }, [user, groupPredictions, groups, globalPredictionCutoffDate]);

  const handleSaveFinalPrediction = useCallback(async () => {
    if (!user) {
      toast.error("Você precisa estar logado para salvar seu palpite da final.");
      return;
    }
    if (finalPredictionCutoffDate.getTime() <= Date.now()) {
      toast.error("O prazo para palpites da final já encerrou.");
      return;
    }
    if (!finalPrediction.champion_id || !finalPrediction.vice_champion_id ||
        !finalPrediction.third_place_id || !finalPrediction.fourth_place_id ||
        finalPrediction.final_home_score === null || finalPrediction.final_away_score === null ||
        finalPrediction.final_home_score < 0 || finalPrediction.final_away_score < 0 ) { // Verifica placares não negativos
      toast.error("Por favor, preencha todos os campos do palpite da final (Campeão, Vice-Campeão, 3º lugar, 4º lugar e Placar com valores não negativos).");
      return;
    }
    const finalTeams = [
      finalPrediction.champion_id,
      finalPrediction.vice_champion_id,
      finalPrediction.third_place_id,
      finalPrediction.fourth_place_id
    ];
    const uniqueTeams = new Set(finalTeams);
    if (uniqueTeams.size !== 4) {
      toast.error("Os times do 1º, 2º, 3º e 4º lugar devem ser diferentes.");
      return;
    }
    setSubmitting(true);
    try {
      const payloadToUpsert = {
        user_id: user.id,
        champion_id: finalPrediction.champion_id,
        vice_champion_id: finalPrediction.vice_champion_id,
        third_place_id: finalPrediction.third_place_id,
        fourth_place_id: finalPrediction.fourth_place_id,
        final_home_score: finalPrediction.final_home_score,
        final_away_score: finalPrediction.final_away_score,
        ...(finalPrediction.prediction_id && { id: finalPrediction.prediction_id }) // Adiciona ID se já existir
      };

      const { data, error } = await supabase
        .from('final_predictions')
        .upsert(payloadToUpsert, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      
      if (data) { // Verifica se data não é null
        setFinalPrediction(prev => ({
            ...prev,
            prediction_id: data.id
        }));
      }
      toast.success("Palpite da final salvo com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar palpite final:", error);
      toast.error(`Erro ao salvar palpite final: ${error.message || error.toString()}`);
    } finally {
      setSubmitting(false);
    }
  }, [user, finalPrediction, finalPredictionCutoffDate]);

  const handlePrintReceipt = useCallback(() => {
    if (!user) {
      toast.error("Você precisa estar logado para gerar o comprovante.");
      return;
    }

    const userMatchPredictionsForReceipt = Object.values(dailyPredictions)
      .map(p => {
        const match = matches.find(m => m.id === p.match_id);
        if (!match) return null;
        const homeScore = parseInt(p.home_score, 10);
        const awayScore = parseInt(p.away_score, 10);
        return {
          match: {
            id: match.id,
            match_date: match.match_date,
            stage: match.stage,
            home_team: teams.find(t => t.id === match.home_team_id) || { id: `unknown_home_${match.home_team_id}`, name: 'A Definir', flag_url: '' },
            away_team: teams.find(t => t.id === match.away_team_id) || { id: `unknown_away_${match.away_team_id}`, name: 'A Definir', flag_url: '' },
          },
          home_score_prediction: isNaN(homeScore) ? null : homeScore,
          away_score_prediction: isNaN(awayScore) ? null : awayScore,
        };
      }).filter(p => p && p.home_score_prediction !== null && p.away_score_prediction !== null); // Filtra palpites incompletos também

    const userGroupPredictionsForReceipt = Object.values(groupPredictions)
      .filter(gp => gp.predicted_first_team_id && gp.predicted_second_team_id) // Filtra palpites de grupo incompletos
      .map(gp => {
        const group = groups.find(g => g.id === gp.group_id);
        if (!group) return null;
        return {
          group_name: group.name,
          predicted_first_team: teams.find(t => t.id === gp.predicted_first_team_id) || { id: `unknown_first_${gp.predicted_first_team_id}`, name: 'Não Definido', flag_url: '' },
          predicted_second_team: teams.find(t => t.id === gp.predicted_second_team_id) || { id: `unknown_second_${gp.predicted_second_team_id}`, name: 'Não Definido', flag_url: '' },
        };
      }).filter(Boolean);

    const finalPredictionReceipt = {
      champion: teams.find(t => t.id === finalPrediction.champion_id) || { id: 'unknown_champ', name: 'Não Definido', flag_url: '' },
      vice_champion: teams.find(t => t.id === finalPrediction.vice_champion_id) || { id: 'unknown_vice', name: 'Não Definido', flag_url: '' },
      third_place: teams.find(t => t.id === finalPrediction.third_place_id) || { id: 'unknown_third', name: 'Não Definido', flag_url: '' },
      fourth_place: teams.find(t => t.id === finalPrediction.fourth_place_id) || { id: 'unknown_fourth', name: 'Não Definido', flag_url: '' },
      final_home_score: finalPrediction.final_home_score,
      final_away_score: finalPrediction.final_away_score,
    };
    
    // Verifica se há pelo menos um palpite para imprimir
    if (userMatchPredictionsForReceipt.length === 0 && userGroupPredictionsForReceipt.length === 0 && (!finalPrediction.champion_id || !finalPrediction.vice_champion_id)) {
        toast.info("Nenhum palpite completo para gerar o comprovante.");
        return;
    }

    const dateGenerated = new Date();

    const receiptHtml = ReactDOMServer.renderToString(
      <PredictionReceipt
        user={{ name: user.user_metadata?.full_name || user.email || "Usuário" }}
        predictions={userMatchPredictionsForReceipt as any}
        groupPredictions={userGroupPredictionsForReceipt as any}
        finalPrediction={finalPredictionReceipt as any}
        dateGenerated={dateGenerated}
      />
    );

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Comprovante de Palpites</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .print-only { display: block !important; } .no-print { display: none !important; } .bg-white, .bg-gray-50 { background-color: #ffffff !important; } .border-gray-200 { border-color: #e5e7eb !important; } } body { font-family: sans-serif; }
          </style>
        </head>
        <body>
          ${receiptHtml}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  }, [user, dailyPredictions, matches, teams, groupPredictions, groups, finalPrediction]);

  // ADICIONADOS OS CONSOLE.LOGS AQUI:
  console.log("DEBUG: User object:", user);
  console.log("DEBUG: Submitting state:", submitting);

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
    navigate("/login");
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-center text-fifa-blue mb-6">Meus Palpites</h1>
        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="daily">Partidas</TabsTrigger>
            <TabsTrigger value="groups">Grupos</TabsTrigger>
            <TabsTrigger value="final">Final</TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Palpites das Partidas</CardTitle>
                <CardDescription>
                  Preencha seus placares para cada partida. O prazo para palpitar em uma partida encerra no horário do jogo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {matches.length === 0 ? (
                  <p className="text-center text-gray-500">Nenhuma partida encontrada.</p>
                ) : (
                  matches.map(match => {
                    const matchDate = parseISO(match.match_date);
                    const canPredict = matchDate.getTime() > Date.now();
                    const prediction = dailyPredictions[match.id] || { match_id: match.id, home_score: '', away_score: '' };

                    return (
                      <Card key={match.id} className={`p-4 ${!canPredict ? 'bg-gray-100 opacity-80' : ''}`}>
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <p className="text-lg font-semibold">{(match.home_team as Team)?.name || 'A Definir'} vs {(match.away_team as Team)?.name || 'A Definir'}</p>
                            <p className="text-sm text-gray-600">{format(matchDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                          </div>
                          {!canPredict && (
                            <span className="text-red-500 font-semibold text-sm">Prazo encerrado</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            className="w-16 text-center"
                            placeholder="0"
                            value={prediction.home_score}
                            onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)}
                            disabled={submitting || !canPredict}
                          />
                          <span className="text-xl font-bold">x</span>
                          <Input
                            type="number"
                            min="0"
                            className="w-16 text-center"
                            placeholder="0"
                            value={prediction.away_score}
                            onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                            disabled={submitting || !canPredict}
                          />
                          <Button
                            className="ml-auto bg-fifa-green hover:bg-green-700"
                            onClick={() => handleSaveDailyPrediction(match.id)}
                            disabled={submitting || !canPredict}
                          >
                            {prediction.prediction_id ? "Atualizar" : "Salvar"}
                          </Button>
                        </div>
                      </Card>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Palpites dos Grupos</CardTitle>
                <CardDescription>
                  Selecione os dois times que você acredita que se classificarão em 1º e 2º lugar em cada grupo.
                  O prazo para palpites de grupo encerra em: {format(globalPredictionCutoffDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {groups.length === 0 ? (
                  <p className="text-center text-gray-500">Nenhum grupo encontrado.</p>
                ) : (
                  groups.map(group => {
                    const groupPrediction = groupPredictions[group.id] || { group_id: group.id, predicted_first_team_id: null, predicted_second_team_id: null };
                    const canPredictGroup = globalPredictionCutoffDate.getTime() > Date.now();
                    const filteredTeams = teams.filter(team => team.group_id === group.id);

                    return (
                      <Card key={group.id} className={`p-4 ${!canPredictGroup ? 'bg-gray-100 opacity-80' : ''}`}>
                        <h3 className="text-lg font-semibold mb-2">Grupo {group.name}</h3>
                        {!canPredictGroup && (
                          <p className="text-red-500 font-semibold text-sm mb-2">Prazo encerrado</p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`first-${group.id}`}>1º Lugar:</Label>
                            <Select
                              value={groupPrediction.predicted_first_team_id || ''}
                              onValueChange={(value) => handleGroupTeamChange(group.id, 'first', value)}
                              disabled={submitting || !canPredictGroup}
                            >
                              <SelectTrigger id={`first-${group.id}`}>
                                <SelectValue placeholder="Selecione o 1º lugar" />
                              </SelectTrigger>
                              <SelectContent>
                                {filteredTeams.map(team => (
                                  <SelectItem key={team.id} value={team.id}>
                                    <div className="flex items-center">
                                      {team.flag_url && <Avatar className="h-5 w-5 mr-2"><AvatarImage src={team.flag_url} /><AvatarFallback>{team.name.substring(0, 2)}</AvatarFallback></Avatar>}
                                      {team.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor={`second-${group.id}`}>2º Lugar:</Label>
                            <Select
                              value={groupPrediction.predicted_second_team_id || ''}
                              onValueChange={(value) => handleGroupTeamChange(group.id, 'second', value)}
                              disabled={submitting || !canPredictGroup}
                            >
                              <SelectTrigger id={`second-${group.id}`}>
                                <SelectValue placeholder="Selecione o 2º lugar" />
                              </SelectTrigger>
                              <SelectContent>
                                {filteredTeams.map(team => (
                                  <SelectItem key={team.id} value={team.id}>
                                    <div className="flex items-center">
                                      {team.flag_url && <Avatar className="h-5 w-5 mr-2"><AvatarImage src={team.flag_url} /><AvatarFallback>{team.name.substring(0, 2)}</AvatarFallback></Avatar>}
                                      {team.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button
                          className="mt-4 bg-fifa-green hover:bg-green-700"
                          onClick={() => handleSaveGroupPrediction(group.id)}
                          disabled={submitting || !canPredictGroup}
                        >
                          {groupPrediction.prediction_id ? "Atualizar Palpite" : "Salvar Palpite"}
                        </Button>
                      </Card>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="final">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Palpite da Fase Final</CardTitle>
                <CardDescription>
                  Preencha seus palpites para o Campeão, Vice-Campeão, 3º lugar, 4º lugar e o placar da final.
                  O prazo para palpites da final encerra em: {format(finalPredictionCutoffDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!teams.length ? (
                  <p className="text-center text-gray-500">Carregando times...</p>
                ) : (
                  <div className="space-y-4">
                    {!(finalPredictionCutoffDate.getTime() > Date.now()) && (
                      <Alert className="bg-red-50 border-red-200 text-red-700">
                        <AlertTitle>Prazo encerrado!</AlertTitle>
                        <AlertDescription>Você não pode mais alterar seu palpite da final.</AlertDescription>
                      </Alert>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="champion-select">Campeão:</Label>
                        <Select
                          value={finalPrediction.champion_id || ''}
                          onValueChange={(value) => handleFinalPredictionChange('champion_id', value)}
                          disabled={submitting || !(finalPredictionCutoffDate.getTime() > Date.now())}
                        >
                          <SelectTrigger id="champion-select"><SelectValue placeholder="Selecione o Campeão" /></SelectTrigger>
                          <SelectContent>{teams.map(team => (<SelectItem key={team.id} value={team.id}><div className="flex items-center">{team.flag_url && <Avatar className="h-5 w-5 mr-2"><AvatarImage src={team.flag_url} /><AvatarFallback>{team.name.substring(0,2)}</AvatarFallback></Avatar>}{team.name}</div></SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="vice-champion-select">Vice-Campeão:</Label>
                        <Select
                          value={finalPrediction.vice_champion_id || ''}
                          onValueChange={(value) => handleFinalPredictionChange('vice_champion_id', value)}
                          disabled={submitting || !(finalPredictionCutoffDate.getTime() > Date.now())}
                        >
                          <SelectTrigger id="vice-champion-select"><SelectValue placeholder="Selecione o Vice-Campeão" /></SelectTrigger>
                          <SelectContent>{teams.map(team => (<SelectItem key={team.id} value={team.id}><div className="flex items-center">{team.flag_url && <Avatar className="h-5 w-5 mr-2"><AvatarImage src={team.flag_url} /><AvatarFallback>{team.name.substring(0,2)}</AvatarFallback></Avatar>}{team.name}</div></SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="third-place-select">3º Lugar:</Label>
                        <Select
                          value={finalPrediction.third_place_id || ''}
                          onValueChange={(value) => handleFinalPredictionChange('third_place_id', value)}
                          disabled={submitting || !(finalPredictionCutoffDate.getTime() > Date.now())}
                        >
                          <SelectTrigger id="third-place-select"><SelectValue placeholder="Selecione o 3º Lugar" /></SelectTrigger>
                          <SelectContent>{teams.map(team => (<SelectItem key={team.id} value={team.id}><div className="flex items-center">{team.flag_url && <Avatar className="h-5 w-5 mr-2"><AvatarImage src={team.flag_url} /><AvatarFallback>{team.name.substring(0,2)}</AvatarFallback></Avatar>}{team.name}</div></SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="fourth-place-select">4º Lugar:</Label>
                        <Select
                          value={finalPrediction.fourth_place_id || ''}
                          onValueChange={(value) => handleFinalPredictionChange('fourth_place_id', value)}
                          disabled={submitting || !(finalPredictionCutoffDate.getTime() > Date.now())}
                        >
                          <SelectTrigger id="fourth-place-select"><SelectValue placeholder="Selecione o 4º Lugar" /></SelectTrigger>
                          <SelectContent>{teams.map(team => (<SelectItem key={team.id} value={team.id}><div className="flex items-center">{team.flag_url && <Avatar className="h-5 w-5 mr-2"><AvatarImage src={team.flag_url} /><AvatarFallback>{team.name.substring(0,2)}</AvatarFallback></Avatar>}{team.name}</div></SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="final-score">Placar da Final (Campeão x Vice):</Label>
                      <div className="flex items-center gap-2">
                        <Input id="final-home-score" type="number" min="0" className="w-24 text-center" placeholder="0" value={finalPrediction.final_home_score === null ? '' : finalPrediction.final_home_score} onChange={(e) => handleFinalPredictionChange('final_home_score', e.target.value === '' ? null : parseInt(e.target.value))} disabled={submitting || !(finalPredictionCutoffDate.getTime() > Date.now())} />
                        <span className="text-xl font-bold">x</span>
                        <Input id="final-away-score" type="number" min="0" className="w-24 text-center" placeholder="0" value={finalPrediction.final_away_score === null ? '' : finalPrediction.final_away_score} onChange={(e) => handleFinalPredictionChange('final_away_score', e.target.value === '' ? null : parseInt(e.target.value))} disabled={submitting || !(finalPredictionCutoffDate.getTime() > Date.now())} />
                      </div>
                    </div>
                    <Button
                      className="w-full bg-fifa-green hover:bg-green-700"
                      onClick={handleSaveFinalPrediction}
                      disabled={submitting || !(finalPredictionCutoffDate.getTime() > Date.now())}
                    >
                      {finalPrediction.prediction_id ? "Atualizar Palpite da Final" : "Salvar Palpite da Final"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        {/* BOTÕES DE CONFIRMAR GERAL E IMPRIMIR MOVIDOS PARA FORA DAS ABAS, DENTRO DE UM CARD PRÓPRIO */}
        <Card className="mt-6">
          <CardContent className="p-6 space-y-4">
            <Button
              className="w-full bg-fifa-blue hover:bg-opacity-90"
              onClick={handleSubmitBets} // Este botão agora salva os palpites da aba "Partidas"
              disabled={submitting}
            >
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</>
              ) : (
                'Confirmar Palpites da Aba Partidas' // Texto do botão atualizado
              )}
            </Button>
            <Button
              className="w-full bg-gray-600 hover:bg-gray-700 text-white"
              onClick={handlePrintReceipt}
              disabled={submitting || !user}
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Comprovante
            </Button>
            <p className="text-sm text-gray-500 text-center">
              Atenção: O botão "Confirmar Palpites da Aba Partidas" salva todos os seus palpites preenchidos na aba de Partidas. Para Grupos e Final, use os botões "Salvar/Atualizar Palpite" específicos de cada seção.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Palpites;