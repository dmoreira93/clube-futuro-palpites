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
import PredictionReceipt from '@/components/predictions/PredictionReceipt'; // Importar o componente do comprovante

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

      // 2. Carregar Times e Grupos
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

      // 3. Carregar Palpites de Grupo
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

      // 4. Carregar Palpites da Final
      if (user) {
        const { data: finalPredData, error: finalPredError } = await supabase
          .from('final_predictions') // Assegure-se de que esta é a sua tabela de palpites da final
          .select('id, champion_id, vice_champion_id, third_place_id, fourth_place_id, final_home_score, final_away_score')
          .eq('user_id', user.id)
          .single(); // Assumimos que o usuário só tem um palpite final

        if (finalPredError && finalPredError.code !== 'PGRST116') { // PGRST116 = No rows found
          throw finalPredError;
        }

        if (finalPredData) {
          setFinalPrediction({
            champion_id: finalPredData.champion_id,
            vice_champion_id: finalPredData.vice_champion_id,
            third_place_id: finalPredData.third_place_id, // Carregar novo campo
            fourth_place_id: finalPredData.fourth_place_id, // Carregar novo campo
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
        match_id: matchId, // Garante que match_id está presente para novos palpites
        [type]: value,
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
    if (!prediction || prediction.home_score === "" || prediction.away_score === "") {
      toast.error("Por favor, preencha ambos os placares para o palpite.");
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
      if (prediction.prediction_id) {
        // Atualizar palpite existente
        ({ data, error } = await supabase
          .from('match_predictions')
          .update({
            home_score: parseInt(prediction.home_score),
            away_score: parseInt(prediction.away_score),
            updated_at: new Date().toISOString(),
          })
          .eq('id', prediction.prediction_id)
          .select()
          .single());
      } else {
        // Inserir novo palpite
        ({ data, error } = await supabase
          .from('match_predictions')
          .insert({
            match_id: matchId,
            user_id: user.id,
            home_score: parseInt(prediction.home_score),
            away_score: parseInt(prediction.away_score),
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
          prediction_id: data.id, // Armazena o ID do palpite salvo/atualizado
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

    // Validação de todos os 6 IDs e 2 placares
    if (!finalPrediction.champion_id || !finalPrediction.vice_champion_id ||
        !finalPrediction.third_place_id || !finalPrediction.fourth_place_id || // NOVOS CAMPOS NA VALIDAÇÃO
        finalPrediction.final_home_score === null || finalPrediction.final_away_score === null) {
      toast.error("Por favor, preencha todos os campos do palpite da final (Campeão, Vice-Campeão, 3º lugar, 4º lugar e Placar).");
      return;
    }

    // Verificação de times duplicados para os 4 primeiros lugares
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
        third_place_id_param: finalPrediction.third_place_id,   // <<< ADICIONADO AQUI
        fourth_place_id_param: finalPrediction.fourth_place_id, // <<< ADICIONADO AQUI
        final_home_score_param: finalPrediction.final_home_score,
        final_away_score_param: finalPrediction.final_away_score,
        user_id_param: user.id, // user_id_param deve ser o último conforme a função SQL que te passei
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
    // Aqui você pode adicionar lógica para salvar todos os palpites
    // Chame as funções de salvar para cada tipo de palpite que foi alterado/preenchido
    // Para simplificar, vou chamar apenas para os palpites da final como exemplo,
    // mas você pode estender isso para palpites diários e de grupo se quiser que o botão "Confirmar" salve tudo.
    // Para este cenário, o ideal é que cada tipo de palpite seja salvo em seu próprio botão ou que o "Confirmar"
    // itere sobre os palpites pendentes de salvamento.

    // No seu caso, como você já tem botões de "Salvar" individuais,
    // este botão "Confirmar Palpites" poderia ser um feedback visual,
    // ou você pode transformá-lo para iterar e salvar todos os palpites modificados.
    // Por enquanto, ele apenas mostra uma mensagem de sucesso ou erro.

    try {
      // Exemplo: Salvar palpite da final (já tem um botão específico para isso, mas pode ser chamado aqui)
      // await handleSaveFinalPrediction(); // Chame esta função se quiser que este botão salve a final
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

    // Preparar os dados para o comprovante de palpites de partida
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
          home_score_prediction: parseInt(p.home_score),
          away_score_prediction: parseInt(p.away_score),
        };
      }).filter(Boolean); // Remover nulos

    // Preparar os dados para o comprovante de palpites de grupo
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

    // Preparar os dados para o comprovante de palpite da final
    const finalPredictionReceipt = {
      champion: teams.find(t => t.id === finalPrediction.champion_id),
      vice_champion: teams.find(t => t.id === finalPrediction.vice_champion_id),
      third_place: teams.find(t => t.id === finalPrediction.third_place_id), // NOVO CAMPO PARA O COMPROVANTE
      fourth_place: teams.find(t => t.id === finalPrediction.fourth_place_id), // NOVO CAMPO PARA O COMPROVANTE
      final_home_score: finalPrediction.final_home_score,
      final_away_score: finalPrediction.final_away_score,
    };

    const dateGenerated = new Date();

    const receiptHtml = ReactDOMServer.renderToString(
      <PredictionReceipt
        user={{ name: user.user_metadata.full_name || user.email }} // Ajuste conforme seu AuthContext
        predictions={userMatchPredictionsForReceipt as any} // Cast provisório, ajuste os tipos
        groupPredictions={userGroupPredictionsForReceipt as any} // Cast provisório
        finalPrediction={finalPredictionReceipt as any} // Cast provisório
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

  // Se não houver usuário logado, redireciona ou mostra uma mensagem
  if (!user) {
    navigate("/login"); // Ou exiba um componente de "login necessário"
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

          {/* TAB: Partidas */}
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
                    const prediction = dailyPredictions[match.id] || { home_score: '', away_score: '' };

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

          {/* TAB: Grupos */}
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

          {/* TAB: Final */}
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

                      {/* NOVOS SELECTS PARA 3º E 4º LUGAR */}
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
                          onChange={(e) => handleFinalPredictionChange('final_home_score', parseInt(e.target.value) || null)}
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
                          onChange={(e) => handleFinalPredictionChange('final_away_score', parseInt(e.target.value) || null)}
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

            {/* Botão para Imprimir Comprovante */}
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