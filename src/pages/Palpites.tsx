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
import { Match, Team } from "@/types/matches";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactDOMServer from 'react-dom/server';
import PredictionReceipt from '@/components/home/predictions/PredictionReceipt';

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
  third_place_id: string | null;
  fourth_place_id: string | null;
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
    third_place_id: null,
    fourth_place_id: null,
    final_home_score: null,
    final_away_score: null,
  });

  // Datas de corte (ajuste conforme a data real do seu bolão)
  const globalPredictionCutoffDate = parseISO("2026-06-12T12:00:00-03:00");
  const finalPredictionCutoffDate = parseISO("2026-07-01T12:00:00-03:00");

  // --- FUNÇÕES DE CARREGAMENTO DE DADOS ---

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*, home_team:home_team_id(*), away_team:away_team_id(*)')
        .not('home_team_id', 'is', null)
        .not('away_team_id', 'is', null)
        .order('match_date', { ascending: true });

      if (matchesError) throw matchesError;
      setMatches(matchesData);

      if (user) {
        const { data: predictionsData, error: predictionsError } = await supabase
          .from('match_predictions')
          .select('*')
          .eq('user_id', user.id);

        if (predictionsError) throw predictionsError;

        const loadedPredictions: { [matchId: string]: LocalPrediction } = {};
        predictionsData.forEach(p => {
          loadedPredictions[p.match_id] = {
            match_id: p.match_id,
            home_score: p.home_score.toString(),
            away_score: p.away_score.toString(),
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
      setTeams(teamsData);

      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('id, name')
        .order('name', { ascending: true });
      if (groupsError) throw groupsError;
      setGroups(groupsData);

      if (user) {
        const { data: groupPredData, error: groupPredError } = await supabase
          .from('group_predictions')
          .select('*')
          .eq('user_id', user.id);

        if (groupPredError) throw groupPredError;

        const loadedGroupPredictions: { [groupId: string]: GroupPredictionState } = {};
        groupPredData.forEach(gp => {
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
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // --- MANIPULADORES DE ESTADO ---

  const handleScoreChange = useCallback((matchId: string, type: 'home' | 'away', value: string) => {
    setDailyPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        match_id: matchId,
        [type]: value, // Armazena a string exata do input
      }
    }));
  }, []);

  const handleGroupTeamChange = useCallback((groupId: string, type: 'first' | 'second', teamId: string) => {
    setGroupPredictions(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        group_id: groupId,
        [`predicted_${type}_team_id`]: teamId,
      }
    }));
  }, []);

  const handleFinalPredictionChange = useCallback((field: keyof FinalPredictionState, value: string | number | null) => {
    setFinalPrediction(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);


  // --- FUNÇÕES DE SALVAMENTO ---

  const handleSaveDailyPrediction = async (matchId: string) => {
    if (!user) {
      toast.error("Você precisa estar logado para salvar seu palpite.");
      return;
    }

    const prediction = dailyPredictions[matchId];
    // A validação para campos vazios é crucial aqui
    if (!prediction || prediction.home_score === "" || prediction.home_score === null ||
        prediction.away_score === "" || prediction.away_score === null) {
      toast.error("Por favor, preencha ambos os placares para o palpite (use 0 se for o caso).");
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

    // Convertendo para número AQUI, usando Number() que é mais robusto para strings vazias
    // e para 0. Se não for um número válido, Number() retorna NaN.
    const homeScoreNum = Number(prediction.home_score);
    const awayScoreNum = Number(prediction.away_score);

    // Agora, verificar se a conversão resultou em NaN (para entradas como "abc")
    if (isNaN(homeScoreNum) || isNaN(awayScoreNum)) {
        toast.error("Placares inválidos. Por favor, insira apenas números.");
        return;
    }

    setSubmitting(true);
    try {
      let data, error;
      if (prediction.prediction_id) {
        ({ data, error } = await supabase
          .from('match_predictions')
          .update({
            home_score: homeScoreNum,
            away_score: awayScoreNum,
            updated_at: new Date().toISOString(),
          })
          .eq('id', prediction.prediction_id)
          .select()
          .single());
      } else {
        ({ data, error } = await supabase
          .from('match_predictions')
          .insert({
            match_id: matchId,
            user_id: user.id,
            home_score: homeScoreNum,
            away_score: awayScoreNum,
          })
          .select()
          .single());
      }

      if (error) {
        throw error;
      }

      setDailyPredictions(prev => ({
        ...prev,
        [matchId]: {
          ...prev[matchId],
          prediction_id: data.id,
        }
      }));
      toast.success("Palpite salvo com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar palpite:", error);
      toast.error(`Erro ao salvar palpite: ${error.message || error.toString()}`);
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
      if (prediction.prediction_id) {
        ({ data, error } = await supabase
          .from('group_predictions')
          .update({
            predicted_first_team_id: prediction.predicted_first_team_id,
            predicted_second_team_id: prediction.predicted_second_team_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', prediction.prediction_id)
          .select()
          .single());
      } else {
        ({ data, error } = await supabase
          .from('group_predictions')
          .insert({
            group_id: groupId,
            user_id: user.id,
            predicted_first_team_id: prediction.predicted_first_team_id,
            predicted_second_team_id: prediction.predicted_second_team_id,
          })
          .select()
          .single());
      }

      if (error) {
        throw error;
      }
      setGroupPredictions(prev => ({
        ...prev,
        [groupId]: {
          ...prev[groupId],
          prediction_id: data.id,
        }
      }));
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
        finalPrediction.final_home_score === null || finalPrediction.final_away_score === null) {
      toast.error("Por favor, preencha todos os campos do palpite da final (Campeão, Vice-Campeão, 3º lugar, 4º lugar e Placar).");
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
      const { data, error } = await supabase.rpc('insert_final_prediction', {
        champion_id_param: finalPrediction.champion_id,
        vice_champion_id_param: finalPrediction.vice_champion_id,
        third_place_id_param: finalPrediction.third_place_id,
        fourth_place_id_param: finalPrediction.fourth_place_id,
        final_home_score_param: finalPrediction.final_home_score,
        final_away_score_param: finalPrediction.final_away_score,
        user_id_param: user.id,
      });

      if (error) {
        throw error;
      }
      toast.success("Palpite da final salvo com sucesso!");
    } catch (error: any) {
      console.error("Erro ao inserir palpite final:", error);
      toast.error(`Erro ao inserir palpite final: ${error.message || error.toString()}`);
    } finally {
      setSubmitting(false);
    }
  }, [user, finalPrediction, finalPredictionCutoffDate, toast]);


  const handleSubmitBets = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para confirmar os palpites.");
      return;
    }
    setSubmitting(true);
    try {
      toast.success("Palpites confirmados com sucesso! (Lembre-se de usar os botões Salvar/Atualizar para cada tipo de palpite)");
    } catch (error) {
      toast.error("Erro ao confirmar palpites. Verifique os erros individuais.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintReceipt = useCallback(() => {
    if (!user) {
      toast.error("Você precisa estar logado para gerar o comprovante.");
      return;
    }

    const userMatchPredictionsForReceipt = Object.values(dailyPredictions)
      .map(p => {
        const match = matches.find(m => m.id === p.match_id);
        if (!match) return null;
        return {
          match: {
            ...match,
            home_team: teams.find(t => t.id === match.home_team_id),
            away_team: teams.find(t => t.id === match.away_team_id),
          },
          home_score_prediction: Number(p.home_score), // Use Number() aqui também
          away_score_prediction: Number(p.away_score), // Use Number() aqui também
        };
      }).filter(Boolean);

    const userGroupPredictionsForReceipt = Object.values(groupPredictions)
      .map(gp => {
        const group = groups.find(g => g.id === gp.group_id);
        if (!group) return null;
        return {
          group_name: group.name,
          predicted_first_team: teams.find(t => t.id === gp.predicted_first_team_id),
          predicted_second_team: teams.find(t => t.id === gp.predicted_second_team_id),
        };
      }).filter(Boolean);

    const finalPredictionReceipt = {
      champion: teams.find(t => t.id === finalPrediction.champion_id),
      vice_champion: teams.find(t => t.id === finalPrediction.vice_champion_id),
      third_place: teams.find(t => t.id === finalPrediction.third_place_id),
      fourth_place: teams.find(t => t.id === finalPrediction.fourth_place_id),
      final_home_score: finalPrediction.final_home_score,
      final_away_score: finalPrediction.final_away_score,
    };

    const dateGenerated = new Date();

    const receiptHtml = ReactDOMServer.renderToString(
      <PredictionReceipt
        user={{ name: user.user_metadata.full_name || user.email }}
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
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .print-only {
                display: block !important;
              }
              .no-print {
                display: none !important;
              }
              /* Garante que o fundo das cards apareça */
              .bg-white, .bg-gray-50 {
                background-color: #ffffff !important;
              }
              .border-gray-200 {
                border-color: #e5e7eb !important;
              }
            }
            body {
                font-family: sans-serif;
            }
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
                  <p className="text-center text-gray-500">Nenhuma partida encontrada com times definidos.</p>
                ) : (
                  matches.map(match => {
                    const matchDate = parseISO(match.match_date);
                    const canPredict = matchDate.getTime() > Date.now();
                    const prediction = dailyPredictions[match.id] || { home_score: '', away_score: '' };

                    // --- ADICIONE ESTE CONSOLE.LOG AQUI ---
                    console.log(`--- Debug Palpite Partida: ${match.home_team?.name} vs ${match.away_team?.name} (ID: ${match.id}) ---`);
                    console.log(`  canPredict (Prazo aberto?): ${canPredict}`);
                    console.log(`  prediction.home_score (valor atual): '${prediction.home_score}'`);
                    console.log(`  prediction.away_score (valor atual): '${prediction.away_score}'`);
                    console.log(`  isNaN(Number(home_score)) (É NaN?): ${isNaN(Number(prediction.home_score))}`);
                    console.log(`  isNaN(Number(away_score)) (É NaN?): ${isNaN(Number(prediction.away_score))}`);
                    console.log(`  submitting (global): ${submitting}`);
                    const isDisabledBy = {
                      submitting: submitting,
                      notCanPredict: !canPredict,
                      homeScoreEmpty: prediction.home_score === "",
                      awayScoreEmpty: prediction.away_score === "",
                      homeScoreNaN: isNaN(Number(prediction.home_score)),
                      awayScoreNaN: isNaN(Number(prediction.away_score))
                    };
                    console.log(`  Detalhes da desabilitação:`, isDisabledBy);
                    console.log(`  Botão FINALMENTE DISABILITADO? ${submitting || !canPredict || prediction.home_score === "" || prediction.away_score === "" || isNaN(Number(prediction.home_score)) || isNaN(Number(prediction.away_score))}`);
                    console.log(`--------------------------------------------------------------------------------`);
                    // --- FIM DO CONSOLE.LOG ---

                    return (
                      <Card key={match.id} className={`p-4 ${!canPredict ? 'bg-gray-100 opacity-80' : ''}`}>
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <p className="text-lg font-semibold">{match.home_team?.name} vs {match.away_team?.name}</p>
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
                            // O botão só fica habilitado se ambos os placares não estiverem vazios e forem números válidos (após parseInt)
                            disabled={submitting || !canPredict ||
                                      prediction.home_score === "" || prediction.away_score === "" ||
                                      isNaN(Number(prediction.home_score)) || isNaN(Number(prediction.away_score))}
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
                    const groupPrediction = groupPredictions[group.id] || { predicted_first_team_id: null, predicted_second_team_id: null };
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
                    {! (finalPredictionCutoffDate.getTime() > Date.now()) && (
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
                          <SelectTrigger id="champion-select">
                            <SelectValue placeholder="Selecione o Campeão" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map(team => (
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
                        <Label htmlFor="vice-champion-select">Vice-Campeão:</Label>
                        <Select
                          value={finalPrediction.vice_champion_id || ''}
                          onValueChange={(value) => handleFinalPredictionChange('vice_champion_id', value)}
                          disabled={submitting || !(finalPredictionCutoffDate.getTime() > Date.now())}
                        >
                          <SelectTrigger id="vice-champion-select">
                            <SelectValue placeholder="Selecione o Vice-Campeão" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map(team => (
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
                        <Label htmlFor="third-place-select">3º Lugar:</Label>
                        <Select
                          value={finalPrediction.third_place_id || ''}
                          onValueChange={(value) => handleFinalPredictionChange('third_place_id', value)}
                          disabled={submitting || !(finalPredictionCutoffDate.getTime() > Date.now())}
                        >
                          <SelectTrigger id="third-place-select">
                            <SelectValue placeholder="Selecione o 3º Lugar" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map(team => (
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
                        <Label htmlFor="fourth-place-select">4º Lugar:</Label>
                        <Select
                          value={finalPrediction.fourth_place_id || ''}
                          onValueChange={(value) => handleFinalPredictionChange('fourth_place_id', value)}
                          disabled={submitting || !(finalPredictionCutoffDate.getTime() > Date.now())}
                        >
                          <SelectTrigger id="fourth-place-select">
                            <SelectValue placeholder="Selecione o 4º Lugar" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map(team => (
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

                    <div className="flex flex-col gap-2">
                      <Label htmlFor="final-score">Placar da Final:</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="final-home-score"
                          type="number"
                          min="0"
                          className="w-24 text-center"
                          placeholder="0"
                          value={finalPrediction.final_home_score === null ? '' : finalPrediction.final_home_score}
                          onChange={(e) => {
                            const value = e.target.value;
                            handleFinalPredictionChange('final_home_score', value === '' ? null : parseInt(value));
                          }}
                          disabled={submitting || !(finalPredictionCutoffDate.getTime() > Date.now())}
                        />
                        <span className="text-xl font-bold">x</span>
                        <Input
                          id="final-away-score"
                          type="number"
                          min="0"
                          className="w-24 text-center"
                          placeholder="0"
                          value={finalPrediction.final_away_score === null ? '' : finalPrediction.final_away_score}
                          onChange={(e) => {
                            const value = e.target.value;
                            handleFinalPredictionChange('final_away_score', value === '' ? null : parseInt(value));
                          }}
                          disabled={submitting || !(finalPredictionCutoffDate.getTime() > Date.now())}
                        />
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

          <CardContent className="p-6 space-y-4">

            <Button
              className="w-full bg-fifa-blue hover:bg-opacity-90 mb-4"
              onClick={handleSubmitBets}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar Palpites'
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
              Atenção: Ao confirmar, os palpites de partidas com prazo encerrado e palpites de grupo/final após o dia {format(globalPredictionCutoffDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })} não serão salvos.
            </p>
          </CardContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Palpites;