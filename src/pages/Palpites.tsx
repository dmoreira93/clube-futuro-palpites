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
import { format, parseISO, isAfter, isBefore } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactDOMServer from 'react-dom/server';
import PredictionReceipt from '@/components/home/predictions/PredictionReceipt'; // Caminho corrigido se necessário

// Importações para DailyPredictions (novo nome para Matches/Partidas)
import DailyPredictions from "@/components/home/DailyPredictions";

// --- INTERFACES PARA O ESTADO ---
interface LocalMatchPrediction {
  match_id: string;
  home_score: string; // Mantém como string para input
  away_score: string; // Mantém como string para input
  prediction_id?: string; // ID do palpite existente, se houver
  is_valid: boolean; // Para controlar se o palpite de partida é válido para salvar
  match_date: string; // Adicionado para validação de prazo
  is_finished: boolean; // Adicionado para validação de prazo
}

interface Group {
  id: string;
  name: string;
  // ... outras propriedades do grupo
}

interface GroupPrediction {
  id?: string;
  group_id: string;
  group_name: string; // Nome do grupo para display
  predicted_first_team_id: string;
  predicted_second_team_id: string;
  predicted_first_team_name?: string; // Para display
  predicted_second_team_name?: string; // Para display
}

interface FinalPrediction {
  id?: string;
  champion_id: string;
  vice_champion_id: string; // CORRIGIDO: de runner_up_id para vice_champion_id
  third_place_id: string;
  fourth_place_id: string;
  champion_name?: string;
  vice_champion_name?: string; // CORRIGIDO: de runner_up_name para vice_champion_name
  third_place_name?: string;
  fourth_place_name?: string;
}

// --- DATAS DE CORTE ---
// Ajuste estas datas conforme necessário. Data de hoje: 22/05/2025
const GLOBAL_PREDICTION_CUTOFF = '2025-06-14T18:00:00-03:00'; // Prazo para partidas e grupos
const FINAL_PREDICTION_CUTOFF = '2025-07-10T18:00:00-03:00'; // Prazo para a final

const globalPredictionCutoffDate = parseISO(GLOBAL_PREDICTION_CUTOFF);
const finalPredictionCutoffDate = parseISO(FINAL_PREDICTION_CUTOFF);

const Palpites = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("partidas");
  const [submitting, setSubmitting] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [initialDataError, setInitialDataError] = useState<string | null>(null);

  // Estados para os palpites
  const [matchPredictions, setMatchPredictions] = useState<LocalMatchPrediction[]>([]);
  const [groupPredictions, setGroupPredictions] = useState<GroupPrediction[]>([]);
  const [finalPrediction, setFinalPrediction] = useState<FinalPrediction | null>(null);

  // Estados para dados mestre
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [matches, setMatches] = useState<Match[]>([]); // Para passar para DailyPredictions

  // Função para atualizar os palpites de partida recebidos de DailyPredictions
  const handleMatchPredictionsChange = useCallback((updatedPredictions: LocalMatchPrediction[]) => {
    setMatchPredictions(updatedPredictions);
  }, []);

  // --- Funções de Carregamento de Dados ---
  const fetchTeams = async () => {
    const { data, error } = await supabase.from('teams').select('*');
    if (error) throw error;
    setTeams(data);
  };

  const fetchGroups = async () => {
    const { data, error } = await supabase.from('groups').select('*');
    if (error) throw error;
    setGroups(data);
  };

  const fetchUserMatchPredictions = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('match_predictions')
      .select('*, matches(match_date, is_finished)')
      .eq('user_id', userId);

    if (error) throw error;

    const formattedPredictions: LocalMatchPrediction[] = data.map(mp => ({
      match_id: mp.match_id,
      home_score: mp.home_score.toString(),
      away_score: mp.away_score.toString(),
      prediction_id: mp.id,
      is_valid: true, // Será reavaliado por DailyPredictions
      match_date: (mp.matches as any)?.match_date, // Pega a data da partida
      is_finished: (mp.matches as any)?.is_finished, // Pega o status da partida
    }));
    setMatchPredictions(formattedPredictions);
  }, []);


  const fetchUserGroupPredictions = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('group_predictions')
      .select('*, groups(name), predicted_first_team:teams_predicted_first_team_id(name), predicted_second_team:teams_predicted_second_team_id(name)')
      .eq('user_id', userId);

    if (error) {
      console.error("Erro ao carregar palpites de grupo:", error);
      throw error;
    }

    const formattedGroupPredictions: GroupPrediction[] = data.map(gp => ({
      id: gp.id,
      group_id: gp.group_id,
      group_name: gp.groups?.name || 'Desconhecido',
      predicted_first_team_id: gp.predicted_first_team_id,
      predicted_second_team_id: gp.predicted_second_team_id,
      predicted_first_team_name: gp.predicted_first_team?.name,
      predicted_second_team_name: gp.predicted_second_team?.name,
    }));

    setGroupPredictions(formattedGroupPredictions);
  }, []);

  const fetchUserFinalPrediction = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('final_predictions')
      .select('*, champion:teams_champion_id(name), vice_champion:teams_vice_champion_id(name), third_place:teams_third_place_id(name), fourth_place:teams_fourth_place_id(name)') // CORRIGIDO: 'runner_up' para 'vice_champion'
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error("Erro ao carregar palpite final:", error);
      throw error;
    }

    if (data) {
      setFinalPrediction({
        id: data.id,
        champion_id: data.champion_id,
        vice_champion_id: data.vice_champion_id, // CORRIGIDO: de runner_up_id para vice_champion_id
        third_place_id: data.third_place_id,
        fourth_place_id: data.fourth_place_id,
        champion_name: data.champion?.name,
        vice_champion_name: data.vice_champion?.name, // CORRIGIDO: de runner_up_name para vice_champion_name
        third_place_name: data.third_place?.name,
        fourth_place_name: data.fourth_place?.name,
      });
    } else {
      setFinalPrediction(null);
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) return;
      setLoadingInitialData(true);
      setInitialDataError(null);
      try {
        await Promise.all([
          fetchTeams(),
          fetchGroups(),
          fetchUserMatchPredictions(user.id),
          fetchUserGroupPredictions(user.id),
          fetchUserFinalPrediction(user.id),
        ]);
      } catch (error: any) {
        console.error("Erro ao carregar dados iniciais:", error);
        setInitialDataError(error.message || "Erro ao carregar dados.");
        toast.error("Erro ao carregar dados: " + (error.message || "Verifique sua conexão."));
      } finally {
        setLoadingInitialData(false);
      }
    };

    loadInitialData();
  }, [user, fetchUserMatchPredictions, fetchUserGroupPredictions, fetchUserFinalPrediction]);


  // --- Funções para manipulação de estado dos palpites ---

  // Para Grupos
  const handleGroupPredictionChange = (groupId: string, field: 'first' | 'second', teamId: string) => {
    setGroupPredictions(prev => {
      const existing = prev.find(gp => gp.group_id === groupId);
      const group = groups.find(g => g.id === groupId);
      const team = teams.find(t => t.id === teamId);

      if (existing) {
        return prev.map(gp =>
          gp.group_id === groupId
            ? {
                ...gp,
                [field === 'first' ? 'predicted_first_team_id' : 'predicted_second_team_id']: teamId,
                [field === 'first' ? 'predicted_first_team_name' : 'predicted_second_team_name']: team?.name,
              }
            : gp
        );
      } else {
        return [
          ...prev,
          {
            group_id: groupId,
            group_name: group?.name || 'Desconhecido',
            predicted_first_team_id: field === 'first' ? teamId : '',
            predicted_second_team_id: field === 'second' ? teamId : '',
            predicted_first_team_name: field === 'first' ? team?.name : '',
            predicted_second_team_name: field === 'second' ? team?.name : '',
          },
        ];
      }
    });
  };

  // Para Final
  const handleFinalPredictionChange = (field: 'champion' | 'runnerUp' | 'thirdPlace' | 'fourthPlace', teamId: string) => {
    setFinalPrediction(prev => {
      const team = teams.find(t => t.id === teamId);
      const newPrediction = { ...prev };

      switch (field) {
        case 'champion':
          newPrediction.champion_id = teamId;
          newPrediction.champion_name = team?.name;
          break;
        case 'runnerUp':
          newPrediction.vice_champion_id = teamId; // CORRIGIDO: de runner_up_id para vice_champion_id
          newPrediction.vice_champion_name = team?.name; // CORRIGIDO: de runner_up_name para vice_champion_name
          break;
        case 'thirdPlace':
          newPrediction.third_place_id = teamId;
          newPrediction.third_place_name = team?.name;
          break;
        case 'fourthPlace':
          newPrediction.fourth_place_id = teamId;
          newPrediction.fourth_place_name = team?.name;
          break;
      }
      return { ...newPrediction };
    });
  };

  // --- Função Única de Salvar Palpites (Confirmar Palpites) ---
  const handleSubmitBets = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para confirmar palpites.");
      return;
    }
    setSubmitting(true);
    let successCount = 0;
    let errorCount = 0;
    const now = new Date();

    // 1. Validar e Salvar Palpites de Partida
    if (activeTab === "partidas" || true) { // Sempre tenta salvar partidas se a opção for unificada
      const validMatchPredictionsToSave = matchPredictions.filter(p => {
        const homeScore = parseInt(p.home_score);
        const awayScore = parseInt(p.away_score);
        const matchDateTime = parseISO(p.match_date);

        // Verifica se os scores são válidos (não NaN) e se o prazo não foi excedido
        return !isNaN(homeScore) && !isNaN(awayScore) &&
               isBefore(now, globalPredictionCutoffDate) && // Validação global
               isBefore(now, matchDateTime); // Validação da partida (pode ser mais complexa com offset)
      });

      for (const p of validMatchPredictionsToSave) {
        try {
          const dataToSave = {
            user_id: user.id,
            match_id: p.match_id,
            home_score: parseInt(p.home_score),
            away_score: parseInt(p.away_score),
          };
          if (p.prediction_id) {
            await supabase.from('match_predictions').update(dataToSave).eq('id', p.prediction_id);
          } else {
            await supabase.from('match_predictions').insert(dataToSave);
          }
          successCount++;
        } catch (error) {
          console.error("Erro ao salvar palpite de partida:", error);
          errorCount++;
        }
      }
    }

    // 2. Validar e Salvar Palpites de Grupo
    if (activeTab === "grupos" || true) { // Sempre tenta salvar grupos se a opção for unificada
        for (const gp of groupPredictions) {
            // Verifica o prazo global antes de tentar salvar
            if (isAfter(now, globalPredictionCutoffDate)) {
                toast.warning(`Palpites de grupo ignorados: prazo de ${format(globalPredictionCutoffDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })} encerrado.`);
                errorCount++; // Conta como erro/ignorado
                continue; // Pula para o próximo
            }

            // Validação de preenchimento e unicidade dos times
            if (!gp.group_id || !gp.predicted_first_team_id || !gp.predicted_second_team_id || gp.predicted_first_team_id === gp.predicted_second_team_id) {
                console.warn(`Palpite de grupo ${gp.group_name || gp.group_id} incompleto ou inválido, pulando.`);
                errorCount++;
                continue;
            }

            try {
                const dataToSave = {
                    user_id: user.id,
                    group_id: gp.group_id,
                    predicted_first_team_id: gp.predicted_first_team_id,
                    predicted_second_team_id: gp.predicted_second_team_id,
                };

                if (gp.id) { // Palpite existente, atualiza
                    await supabase.from('group_predictions').update(dataToSave).eq('id', gp.id);
                } else { // Novo palpite, insere
                    await supabase.from('group_predictions').insert(dataToSave);
                }
                successCount++;
            } catch (e) {
                console.error("Erro salvando palpite de grupo:", e);
                errorCount++;
            }
        }
    }

    // 3. Validar e Salvar Palpite da Final
    if (activeTab === "final" || true) { // Sempre tenta salvar final se a opção for unificada
        if (finalPrediction) {
            // Validação de prazo específico para a final
            if (isAfter(now, finalPredictionCutoffDate)) {
                toast.warning(`Palpites da final ignorados: prazo de ${format(finalPredictionCutoffDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })} encerrado.`);
                errorCount++;
            } else if (
                !finalPrediction.champion_id ||
                !finalPrediction.vice_champion_id || // CORRIGIDO: de runner_up_id para vice_champion_id
                !finalPrediction.third_place_id ||
                !finalPrediction.fourth_place_id ||
                new Set([finalPrediction.champion_id, finalPrediction.vice_champion_id, finalPrediction.third_place_id, finalPrediction.fourth_place_id]).size !== 4 // CORRIGIDO
            ) {
                toast.error("Por favor, preencha todos os campos dos palpites da final com times únicos.");
                errorCount++;
            } else {
                try {
                    const dataToSave = {
                        user_id: user.id,
                        champion_id: finalPrediction.champion_id,
                        vice_champion_id: finalPrediction.vice_champion_id, // CORRIGIDO: de runner_up_id para vice_champion_id
                        third_place_id: finalPrediction.third_place_id,
                        fourth_place_id: finalPrediction.fourth_place_id,
                    };

                    if (finalPrediction.id) { // Palpite existente, atualiza
                        await supabase.from('final_predictions').update(dataToSave).eq('id', finalPrediction.id);
                    } else { // Novo palpite, insere
                        await supabase.from('final_predictions').insert(dataToSave);
                    }
                    successCount++;
                } catch (e) {
                    console.error("Erro salvando palpite final:", e);
                    errorCount++;
                }
            }
        } else {
            console.warn("Nenhum palpite final para salvar.");
        }
    }

    setSubmitting(false);

    if (successCount > 0 && errorCount === 0) {
      toast.success("Todos os palpites foram confirmados com sucesso!");
    } else if (successCount > 0 && errorCount > 0) {
      toast.warning(`Alguns palpites foram salvos (${successCount}), mas ${errorCount} foram ignorados ou tiveram erros (verifique console).`);
    } else {
      toast.error("Nenhum palpite válido foi salvo. Verifique os prazos e preenchimento dos campos.");
    }
  };

  // --- Função para Imprimir Comprovante ---
  const handlePrintReceipt = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para imprimir o comprovante.");
      return;
    }
    setSubmitting(true); // Usamos submitting para desabilitar o botão enquanto busca dados
    try {
      // 1. Buscar palpites de partida
      const { data: userMatchPredictions, error: matchPredictionsError } = await supabase
        .from('match_predictions')
        .select('*, matches(id, match_date, stage, home_team(name), away_team(name))')
        .eq('user_id', user.id);
      if (matchPredictionsError) throw matchPredictionsError;

      const predictionsForReceipt = userMatchPredictions.map(p => ({
        match: p.matches,
        home_score_prediction: p.home_score,
        away_score_prediction: p.away_score,
      }));

      // 2. Buscar palpites de grupo
      const { data: userGroupPredictions, error: groupPredictionsError } = await supabase
        .from('group_predictions')
        .select('*, group:groups(name), predicted_first_team:teams_predicted_first_team_id(name), predicted_second_team:teams_predicted_second_team_id(name)')
        .eq('user_id', user.id);
      if (groupPredictionsError) throw groupPredictionsError;

      // 3. Buscar palpite final
      const { data: userFinalPrediction, error: finalPredictionError } = await supabase
        .from('final_predictions')
        .select('*, champion:teams_champion_id(name), vice_champion:teams_vice_champion_id(name), third_place:teams_third_place_id(name), fourth_place:teams_fourth_place_id(name)') // CORRIGIDO: 'runner_up' para 'vice_champion'
        .eq('user_id', user.id)
        .single();
      if (finalPredictionError && finalPredictionError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw finalPredictionError;
      }

      const receiptComponentHtml = ReactDOMServer.renderToString(
          <PredictionReceipt
              user={{ id: user.id, name: user.user_metadata?.full_name || user.email || 'Usuário', avatar_url: user.user_metadata?.avatar_url || '' }}
              predictions={predictionsForReceipt as any} // Palpites de partida
              groupPredictions={userGroupPredictions as any} // Palpites de grupo
              finalPrediction={userFinalPrediction ? {
                ...userFinalPrediction,
                runner_up: userFinalPrediction.vice_champion // Mapeia para o tipo esperado por PredictionReceipt
              } as any : null} // Palpite final
              dateGenerated={new Date()}
          />
      );

      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write('<html><head><title>Comprovante de Palpites</title>');
        // Inclua os estilos Tailwind CSS para impressão
        printWindow.document.write('<link href="/tailwind.css" rel="stylesheet">'); // Assumindo que o tailwind.css é acessível na raiz
        printWindow.document.write('</head><body class="p-8">'); // Adiciona padding ao body
        printWindow.document.write(receiptComponentHtml);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      } else {
        toast.error("Não foi possível abrir a janela de impressão. Verifique as configurações de pop-up.");
      }

    } catch (error: any) {
      console.error("Erro ao gerar comprovante:", error);
      toast.error("Erro ao gerar comprovante: " + (error.message || "Verifique sua conexão."));
    } finally {
      setSubmitting(false);
    }
  };


  // --- Renderização do Componente ---
  return (
    <Layout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-fifa-blue">Seus Palpites</h1>

        {loadingInitialData && (
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-fifa-blue mx-auto mb-4" />
            <p className="text-gray-600">Carregando seus dados...</p>
          </div>
        )}

        {initialDataError && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Erro ao Carregar</AlertTitle>
            <AlertDescription>{initialDataError}</AlertDescription>
            <Button onClick={() => window.location.reload()} className="mt-2">Recarregar Página</Button>
          </Alert>
        )}

        {!loadingInitialData && !initialDataError && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-200">
              <TabsTrigger value="partidas">
                <SoccerBallIcon className="mr-2 h-4 w-4" />
                Partidas
              </TabsTrigger>
              <TabsTrigger value="grupos">
                <UsersIcon className="mr-2 h-4 w-4" />
                Grupos
              </TabsTrigger>
              <TabsTrigger value="final">
                <TrophyIcon className="mr-2 h-4 w-4" />
                Final
              </TabsTrigger>
            </TabsList>

            {/* Aba Partidas */}
            <TabsContent value="partidas">
              <DailyPredictions
                matchPredictions={matchPredictions}
                onMatchPredictionsChange={handleMatchPredictionsChange}
                globalPredictionCutoffDate={globalPredictionCutoffDate}
                // Passar o user e toast para DailyPredictions se necessário, ou usar os hooks lá
              />
            </TabsContent>

            {/* Aba Grupos */}
            <TabsContent value="grupos">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-fifa-blue">Palpites de Grupo</CardTitle>
                  <CardDescription>
                    Selecione os dois times que você acredita que se classificarão em 1º e 2º lugar em cada grupo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {groups.map(group => {
                    const currentGroupPrediction = groupPredictions.find(gp => gp.group_id === group.id) || {
                      group_id: group.id,
                      group_name: group.name,
                      predicted_first_team_id: '',
                      predicted_second_team_id: '',
                    };
                    const groupTeams = teams.filter(team => team.group_id === group.id);
                    const canPredictGroup = isBefore(new Date(), globalPredictionCutoffDate); // Prazo para grupos

                    return (
                      <div key={group.id} className="border p-4 rounded-lg bg-gray-50">
                        <h3 className="text-lg font-semibold mb-3 text-gray-800">{group.name}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`first-${group.id}`}>1º Lugar:</Label>
                            <Select
                              value={currentGroupPrediction.predicted_first_team_id}
                              onValueChange={(value) => handleGroupPredictionChange(group.id, 'first', value)}
                              disabled={!canPredictGroup || submitting}
                            >
                              <SelectTrigger id={`first-${group.id}`}>
                                <SelectValue placeholder="Selecione o 1º lugar" />
                              </SelectTrigger>
                              <SelectContent>
                                {groupTeams.map(team => (
                                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor={`second-${group.id}`}>2º Lugar:</Label>
                            <Select
                              value={currentGroupPrediction.predicted_second_team_id}
                              onValueChange={(value) => handleGroupPredictionChange(group.id, 'second', value)}
                              disabled={!canPredictGroup || submitting}
                            >
                              <SelectTrigger id={`second-${group.id}`}>
                                <SelectValue placeholder="Selecione o 2º lugar" />
                              </SelectTrigger>
                              <SelectContent>
                                {groupTeams.map(team => (
                                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba Final */}
            <TabsContent value="final">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl text-fifa-blue">Palpites da Fase Final</CardTitle>
                  <CardDescription>
                    Selecione os times que você acredita que terminarão em 1º, 2º, 3º e 4º lugar no torneio.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loadingInitialData ? (
                    <div className="text-center text-gray-500">Carregando opções...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Campeão */}
                      <div>
                        <Label htmlFor="champion">Campeão:</Label>
                        <Select
                          value={finalPrediction?.champion_id || ''}
                          onValueChange={(value) => handleFinalPredictionChange('champion', value)}
                          disabled={isAfter(new Date(), finalPredictionCutoffDate) || submitting}
                        >
                          <SelectTrigger id="champion">
                            <SelectValue placeholder="Selecione o Campeão" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map(team => (
                              <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Vice */}
                      <div>
                        <Label htmlFor="runnerUp">Vice-Campeão:</Label>
                        <Select
                          value={finalPrediction?.vice_champion_id || ''} // CORRIGIDO: de runner_up_id para vice_champion_id
                          onValueChange={(value) => handleFinalPredictionChange('runnerUp', value)}
                          disabled={isAfter(new Date(), finalPredictionCutoffDate) || submitting}
                        >
                          <SelectTrigger id="runnerUp">
                            <SelectValue placeholder="Selecione o Vice-Campeão" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map(team => (
                              <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Terceiro Lugar */}
                      <div>
                        <Label htmlFor="thirdPlace">3º Lugar:</Label>
                        <Select
                          value={finalPrediction?.third_place_id || ''}
                          onValueChange={(value) => handleFinalPredictionChange('thirdPlace', value)}
                          disabled={isAfter(new Date(), finalPredictionCutoffDate) || submitting}
                        >
                          <SelectTrigger id="thirdPlace">
                            <SelectValue placeholder="Selecione o 3º Lugar" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map(team => (
                              <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Quarto Lugar */}
                      <div>
                        <Label htmlFor="fourthPlace">4º Lugar:</Label>
                        <Select
                          value={finalPrediction?.fourth_place_id || ''}
                          onValueChange={(value) => handleFinalPredictionChange('fourthPlace', value)}
                          disabled={isAfter(new Date(), finalPredictionCutoffDate) || submitting}
                        >
                          <SelectTrigger id="fourthPlace">
                            <SelectValue placeholder="Selecione o 4º Lugar" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map(team => (
                              <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Não existe botão "Atualizar Palpite da Final" aqui se estamos usando o Confirmar Palpites */}
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
                Atenção: Ao confirmar, os palpites de partidas com prazo encerrado e palpites de grupo/final após o dia {format(globalPredictionCutoffDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })} não serão salvos. Para a final, o prazo é {format(finalPredictionCutoffDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}.
              </p>
            </CardContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default Palpites;