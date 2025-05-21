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
import { Volleyball as SoccerBallIcon, Trophy as TrophyIcon, Users as UsersIcon, Loader2, Printer } from "lucide-react"; // Adicionado 'Printer' icon
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Match } from "@/types/matches";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import ReactDOMServer from 'react-dom/server'; // Importação NECESSÁRIA para renderizar HTML em string

// Importações para o comprovante
// ... (código existente) ...

// Importações para o comprovante
import { PredictionReceipt } from "@/components/home/predictions/PredictionReceipt"; // <--- CAMINHO CORRIGIDO AQUI!
import { UserType } from "@/contexts/AuthContext"; // Importação explícita do tipo UserType


// Ajustes nos tipos de importação para refletir as tabelas separadas
import {
  MatchPrediction, // Você importou MatchPrediction, mas não está usando explicitamente aqui
  GroupPrediction,
  FinalPrediction,
  RawGroupPrediction, // Não usada explicitamente aqui
  RawFinalPrediction // Não usada explicitamente aqui
} from "@/types/predictions";

interface Team {
  id: string;
  name: string;
  flag_url: string;
  group_id: string | null;
}

interface Group {
  id: string;
  name: string;
}

// Novo tipo para os palpites de partida com os detalhes completos da partida
// Necessário para o componente PredictionReceipt
type UserMatchPredictionWithDetails = {
  id: string;
  user_id: string;
  match_id: string;
  home_score: number; // Supondo que você armazena como 'home_score' no BD
  away_score: number; // Supondo que você armazena como 'away_score' no BD
  match: Match; // Inclui todos os detalhes da partida, incluindo times
};


const Palpites = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [teamsByGroup, setTeamsByGroup] = useState<{ [groupId: string]: Team[] }>({});

  const [matchPredictions, setMatchPredictions] = useState<{ [matchId: string]: { homeGoals: number; awayGoals: number } }>({});
  const [groupPredictions, setGroupPredictions] = useState<GroupPrediction[]>([]);
  const [finalPrediction, setFinalPrediction] = useState<FinalPrediction | null>(null);

  const [groupPositions, setGroupPositions] = useState<{ [groupId: string]: { first: string; second: string } }>({});
  const [finalPositions, setFinalPositions] = useState({
    champion: '',
    runnerUp: '',
    thirdPlace: '',
    fourthPlace: '',
  });
  const [finalScore, setFinalScore] = useState({ homeGoals: 0, awayGoals: 0 });

  // ***** DATA DE CORTE GLOBAL PARA GRUPOS E FINAL *****
  // Esta data (14/06/2025 às 18:00) é o limite para palpites de GRUPO e FINAL.
  // Use um fuso horário adequado (e.g., 'America/Sao_Paulo' ou 'UTC-03:00')
  const globalPredictionCutoffDate = new Date('2025-06-14T18:00:00-03:00');
  // O getTime() retorna o valor em milissegundos, mais fácil para comparações
  const globalPredictionCutoffTime = globalPredictionCutoffDate.getTime();

  // --- Efeitos de Carregamento de Dados ---
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch Teams
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, name, flag_url, group_id');

        if (teamsError) throw teamsError;
        setTeams(teamsData || []);

        const organizedTeamsByGroup: { [groupId: string]: Team[] } = {};
        teamsData?.forEach(team => {
            if (team.group_id) {
                if (!organizedTeamsByGroup[team.group_id]) {
                    organizedTeamsByGroup[team.group_id] = [];
                }
                organizedTeamsByGroup[team.group_id].push(team);
            }
        });
        setTeamsByGroup(organizedTeamsByGroup);

        // Fetch Groups e ordenar por nome
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select('id, name')
          .order('name', { ascending: true });

        if (groupsError) throw groupsError;
        setGroups(groupsData || []);

        // Fetch Matches e filtrar times NULL
        const { data: matchesData, error: matchesError } = await supabase
          .from('matches')
          .select('*')
          .order('match_date', { ascending: true });

        if (matchesError) throw matchesError;
        const filteredMatches = matchesData?.filter(match => match.home_team_id !== null && match.away_team_id !== null) || [];
        setMatches(filteredMatches);

        // Fetch existing Match Predictions for the user WITH MATCH DETAILS FOR RECEIPT
        const { data: userMatchPredictions, error: userMatchPredictionsError } = await supabase
          .from('match_predictions')
          .select(`
            id,
            match_id,
            home_score,
            away_score,
            match:matches(
              id,
              match_date,
              stage,
              home_team_id,
              away_team_id,
              home_team:teams!home_team_id(name),
              away_team:teams!away_team_id(name)
            )
          `)
          .eq('user_id', user.id);

        if (userMatchPredictionsError) throw userMatchPredictionsError;
        const initialMatchPredictions = (userMatchPredictions as UserMatchPredictionWithDetails[]).reduce((acc, pred) => {
          acc[pred.match_id] = { homeGoals: pred.home_score, awayGoals: pred.away_score };
          return acc;
        }, {} as { [matchId: string]: { homeGoals: number; awayGoals: number } });
        setMatchPredictions(initialMatchPredictions);

        // Fetch existing Group Predictions for the user
        const { data: userGroupPredictions, error: userGroupPredictionsError } = await supabase
            .from('group_predictions')
            .select('id, group_id, predicted_first_team_id, predicted_second_team_id')
            .eq('user_id', user.id);

        if (userGroupPredictionsError) throw userGroupPredictionsError;
        setGroupPredictions(userGroupPredictions || []);

        const initialGroupPositions: { [groupId: string]: { first: string; second: string } } = {};
        userGroupPredictions?.forEach(pred => {
            initialGroupPositions[pred.group_id] = {
                first: pred.predicted_first_team_id,
                second: pred.predicted_second_team_id,
            };
        });
        setGroupPositions(initialGroupPositions);

        // Fetch existing Final Prediction for the user
        const { data: userFinalPrediction, error: userFinalPredictionError } = await supabase
            .from('final_predictions')
            .select('id, champion_id, vice_champion_id, third_place_id, fourth_place_id, final_home_score, final_away_score')
            .eq('user_id', user.id)
            .single();

        if (userFinalPredictionError && userFinalPredictionError.code !== 'PGRST116') {
            throw userFinalPredictionError;
        }

        if (userFinalPrediction) {
            setFinalPrediction(userFinalPrediction);
            setFinalPositions({
                champion: userFinalPrediction.champion_id,
                runnerUp: userFinalPrediction.vice_champion_id,
                thirdPlace: userFinalPrediction.third_place_id,
                fourthPlace: userFinalPrediction.fourth_place_id,
            });
            setFinalScore({
                homeGoals: userFinalPrediction.final_home_score,
                awayGoals: userFinalPrediction.final_away_score,
            });
        }

      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to load data.");
        toast.error("Erro ao carregar dados: " + (err.message || "Verifique sua conexão."));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, navigate, user?.id]);


  // --- Funções de Manipulação de State do Formulário ---
  const handleScoreChange = (matchId: string, team: 'home' | 'away', value: string) => {
    const match = matches.find(m => m.id === matchId);
    // Bloqueia se a data/hora atual for MAIOR ou IGUAL à data/hora da partida
    if (match && new Date().getTime() >= parseISO(match.match_date).getTime()) {
      toast.warning("Não é possível alterar o palpite para esta partida. O prazo já encerrou (a partida já começou ou terminou).");
      return;
    }
    const goals = parseInt(value);
    setMatchPredictions(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team === 'home' ? 'homeGoals' : 'awayGoals']: isNaN(goals) ? 0 : goals,
      },
    }));
  };

  const handleGroupPositionChange = (groupId: string, position: 'first' | 'second', teamId: string) => {
    // Bloqueia se a data/hora atual for MAIOR ou IGUAL à data de corte global
    if (new Date().getTime() >= globalPredictionCutoffTime) {
      toast.warning(`Não é possível alterar palpites de grupo. O prazo encerrou em ${format(globalPredictionCutoffDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}.`);
      return;
    }
    setGroupPositions(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        [position]: teamId,
      },
    }));
  };

  const handleFinalPositionChange = (position: 'champion' | 'runnerUp' | 'thirdPlace' | 'fourthPlace', teamId: string) => {
    // Bloqueia se a data/hora atual for MAIOR ou IGUAL à data de corte global
    if (new Date().getTime() >= globalPredictionCutoffTime) {
      toast.warning(`Não é possível alterar palpites da fase final. O prazo encerrou em ${format(globalPredictionCutoffDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}.`);
      return;
    }
    setFinalPositions(prev => ({
      ...prev,
      [position]: teamId,
    }));
  };

  const handleFinalScoreChange = (type: 'homeGoals' | 'awayGoals', value: string) => {
    // Bloqueia se a data/hora atual for MAIOR ou IGUAL à data de corte global
    if (new Date().getTime() >= globalPredictionCutoffTime) {
      toast.warning(`Não é possível alterar o placar da final. O prazo encerrou em ${format(globalPredictionCutoffDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}.`);
      return;
    }
    const goals = parseInt(value);
    setFinalScore(prev => ({
      ...prev,
      [type]: isNaN(goals) ? 0 : goals,
    }));
  };

  // --- Função de Submissão Principal ---
  const handleSubmitBets = async () => {
    if (!user || !isAuthenticated) {
      toast.error("Você precisa estar logado para salvar palpites.");
      navigate("/login");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const now = new Date().getTime();

      // --- SUBMISSÃO DE PALPITES DE PARTIDA ---
      const loadedMatchPredictions = (await supabase.from('match_predictions')
          .select('id, match_id, home_score, away_score')
          .eq('user_id', user.id)
          ).data || [];

      for (const matchId in matchPredictions) {
        const prediction = matchPredictions[matchId];
        const existingMatchPrediction = loadedMatchPredictions.find(p => p.match_id === matchId);
        const match = matches.find(m => m.id === matchId);

        // Bloqueio de envio para partida: se a data/hora atual for MAIOR ou IGUAL à data/hora da partida
        if (match && now >= parseISO(match.match_date).getTime()) {
          console.warn(`Palpite para partida ${matchId} ignorado, prazo encerrado (partida já começou/terminou).`);
          continue; // Pula esta partida, não permite salvar/atualizar
        }

        if (existingMatchPrediction) {
          const { error: updateError } = await supabase.rpc('update_match_prediction', {
            pred_id: existingMatchPrediction.id,
            home_score_param: prediction.homeGoals,
            away_score_param: prediction.awayGoals,
          });
          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase.rpc('insert_match_prediction', {
            match_id_param: matchId,
            user_id_param: user.id,
            home_score_param: prediction.homeGoals,
            away_score_param: prediction.awayGoals,
          });
          if (insertError) throw insertError;
        }
      }

      // --- SUBMISSÃO DE PALPITES DE GRUPO ---
      // Bloqueio de envio para grupos: se a data/hora atual for MAIOR ou IGUAL à data de corte global
      if (now >= globalPredictionCutoffTime) {
        toast.error(`Não é possível salvar palpites de grupo após ${format(globalPredictionCutoffDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}.`);
        // A função de salvar continua, mas os palpites de grupo/final serão ignorados se o prazo expirou
        // Ou você pode lançar um erro e interromper tudo: throw new Error("Prazo para palpites de grupo encerrado.");
      } else { // Só tenta salvar se o prazo ainda não encerrou
          const loadedGroupPredictions = (await supabase.from('group_predictions')
              .select('id, group_id, predicted_first_team_id, predicted_second_team_id')
              .eq('user_id', user.id)
              ).data || [];

          for (const groupId in groupPositions) {
            const positions = groupPositions[groupId];
            const existingGroupPred = loadedGroupPredictions.find(p => p.group_id === groupId);

            if (!positions.first || !positions.second) {
                toast.warning(`Por favor, selecione 1º e 2º lugar para o Grupo ${groups.find(g => g.id === groupId)?.name || 'desconhecido'}.`);
                continue;
            }

            if (positions.first === positions.second) {
                toast.warning(`No Grupo ${groups.find(g => g.id === groupId)?.name || 'desconhecido'}, 1º e 2º lugar não podem ser o mesmo time.`);
                continue;
            }

            if (existingGroupPred) {
              const { error: updateError } = await supabase.rpc('update_group_prediction', {
                pred_id: existingGroupPred.id,
                first_id_param: positions.first,
                second_id_param: positions.second,
              });
              if (updateError) {
                console.error(`Erro ao atualizar palpite de grupo ${groupId}:`, updateError);
                throw updateError;
              }
            } else {
              const { error: insertError } = await supabase.rpc('insert_group_prediction', {
                group_id_param: groupId,
                user_id_param: user.id,
                first_team_id_param: positions.first,
                second_team_id_param: positions.second,
              });
              if (insertError) {
                console.error(`Erro ao inserir palpite de grupo ${groupId}:`, insertError);
                throw insertError;
              }
            }
          }
      }


      // --- SUBMISSÃO DE PALPITE FINAL ---
      // Bloqueio de envio para final: se a data/hora atual for MAIOR ou IGUAL à data de corte global
      if (now >= globalPredictionCutoffTime) {
        toast.error(`Não é possível salvar palpites da fase final após ${format(globalPredictionCutoffDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}.`);
      } else { // Só tenta salvar se o prazo ainda não encerrou
          const loadedFinalPrediction = (await supabase.from('final_predictions')
              .select('id, champion_id, vice_champion_id, third_place_id, fourth_place_id, final_home_score, final_away_score')
              .eq('user_id', user.id)
              .single()
              ).data;

          if (!finalPositions.champion || !finalPositions.runnerUp || !finalPositions.thirdPlace || !finalPositions.fourthPlace) {
              toast.warning("Por favor, selecione os 4 primeiros colocados para o palpite final.");
              // Não interrompe o save, permite que as partidas sejam salvas se for o caso
          } else {
              const uniqueFinalists = new Set([finalPositions.champion, finalPositions.runnerUp, finalPositions.thirdPlace, finalPositions.fourthPlace]);
              if (uniqueFinalists.size !== 4) {
                  toast.warning("Os 4 times do palpite final devem ser diferentes.");
                  // Não interrompe o save
              } else {
                  if (loadedFinalPrediction) {
                    const { error: updateError } = await supabase.rpc('update_final_prediction', {
                      pred_id: loadedFinalPrediction.id,
                      champion_id_param: finalPositions.champion,
                      vice_champion_id_param: finalPositions.runnerUp,
                      third_place_id_param: finalPositions.third_place_id,
                      fourth_place_id_param: finalPositions.fourth_place_id,
                      final_home_score_param: finalScore.homeGoals,
                      final_away_score_param: finalScore.awayGoals,
                    });
                    if (updateError) {
                      console.error("Erro ao atualizar palpite final:", updateError);
                      throw updateError;
                    }
                  } else {
                    const { error: insertError } = await supabase.rpc('insert_final_prediction', {
                      user_id_param: user.id,
                      champion_id_param: finalPositions.champion,
                      vice_champion_id_param: finalPositions.runnerUp,
                      third_place_id_param: finalPositions.third_place_id,
                      fourth_place_id_param: finalPositions.fourth_place_id,
                      final_home_score_param: finalScore.homeGoals,
                      final_away_score_param: finalScore.awayGoals,
                    });
                    if (insertError) {
                      console.error("Erro ao inserir palpite final:", insertError);
                      throw insertError;
                    }
                  }
              }
          }
      }


      toast.success("Palpites salvos com sucesso!");
    } catch (err: any) {
      console.error("Erro ao salvar palpites:", err);
      setError(err.message || "Falha ao salvar os palpites.");
      toast.error("Erro ao salvar palpites: " + (err.message || "Verifique sua conexão."));
    } finally {
      setSubmitting(false);
    }
  };


  // --- NOVO: Função para Imprimir Comprovante ---
  const handlePrintReceipt = async () => {
    // É importante buscar os palpites mais recentes e completos para o comprovante
    // Não usar o estado 'userPredictions' diretamente aqui para garantir dados atualizados e completos.
    if (!user || !isAuthenticated) {
      toast.info("Você precisa estar logado para gerar o comprovante.");
      return;
    }

    setSubmitting(true); // Pode setar como submitting enquanto gera o comprovante
    try {
      // Re-fetch dos palpites de partida com os detalhes completos dos times
      // Isso é crucial para que o comprovante tenha todos os nomes dos times.
      const { data: currentMatchPredictions, error: fetchError } = await supabase
        .from('match_predictions')
        .select(`
          id,
          user_id,
          match_id,
          home_score,
          away_score,
          match:matches(
            id,
            match_date,
            stage,
            home_team_id,
            away_team_id,
            home_team:teams!home_team_id(name),
            away_team:teams!away_team_id(name)
          )
        `)
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      const predictionsForReceipt = (currentMatchPredictions as UserMatchPredictionWithDetails[]).map(p => ({
        match: p.match,
        home_score_prediction: p.home_score,
        away_score_prediction: p.away_score,
      }));


      // 1. Renderiza o componente PredictionReceipt para uma string HTML
      // Passa user, palpites de partida (com detalhes), e a data de geração
      const receiptHtmlString = ReactDOMServer.renderToString(
        <PredictionReceipt
          user={user as UserType} // Assegura que user é do tipo UserType
          predictions={predictionsForReceipt}
          dateGenerated={new Date()}
        />
      );

      // 2. Cria uma nova janela do navegador para a impressão
      const printWindow = window.open('', '_blank', 'height=600,width=800');
      if (printWindow) {
        // 3. Escreve o HTML completo na nova janela, incluindo os estilos
        printWindow.document.write('<!DOCTYPE html>');
        printWindow.document.write('<html><head><title>Comprovante de Palpites</title>');
        // Caminho para o seu CSS global. Ajuste se o nome/caminho for diferente!
        printWindow.document.write('<link rel="stylesheet" href="/index.css">');
        printWindow.document.write('</head><body>');
        printWindow.document.write(receiptHtmlString);
        printWindow.document.write('</body></html>');
        printWindow.document.close();

        // 4. Espera o carregamento completo da janela e então aciona a impressão
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
          // printWindow.close(); // Opcional: fecha a janela após a impressão/salvar
          toast.success("Comprovante gerado com sucesso!");
        };
      } else {
        toast.error("O navegador bloqueou a abertura da janela de impressão. Por favor, permita pop-ups para este site.");
      }
    } catch (err: any) {
      console.error("Erro ao gerar comprovante:", err);
      toast.error("Erro ao gerar comprovante: " + (err.message || "Verifique sua conexão."));
    } finally {
      setSubmitting(false);
    }
  };

  // --- Renderização do Componente ---
  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-fifa-blue" />
          <p className="ml-2 text-fifa-blue">Carregando palpites...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertTitle>Erro!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  const getTeamName = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.name || 'Time Desconhecido';
  };

  const getTeamLogo = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.flag_url || '/placeholder-team-logo.png';
  };

  // Determinar se o botão geral de "Confirmar Palpites" deve ser desabilitado
  // O botão principal só bloqueia se a data GLOBAL para grupos/final tiver passado.
  // As partidas individuais já são bloqueadas no loop.
  const isGlobalPredictionLockedForFinalAndGroups = new Date().getTime() >= globalPredictionCutoffTime;

  return (
    <Layout>
      <div className="container mx-auto p-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-center text-fifa-blue mb-6">Meus Palpites</h1>

        {isGlobalPredictionLockedForFinalAndGroups && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Prazo Encerrado!</AlertTitle>
            <AlertDescription>
              O prazo para registrar ou alterar palpites de GRUPOS e FASE FINAL encerrou em {format(globalPredictionCutoffDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}.
              Você ainda pode palpitar em partidas individuais se o prazo delas não tiver encerrado.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="matches" className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="matches"><SoccerBallIcon className="mr-2" />Partidas</TabsTrigger>
            <TabsTrigger value="groups"><UsersIcon className="mr-2" />Grupos</TabsTrigger>
            <TabsTrigger value="final"><TrophyIcon className="mr-2" />Final</TabsTrigger>
          </TabsList>

          <TabsContent value="matches">
            <Card className="shadow-lg">
              <CardHeader className="bg-fifa-blue text-white">
                <CardTitle>Palpites de Partidas</CardTitle>
                <CardDescription className="text-gray-200">
                  Preencha os placares das partidas da fase de grupos.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {matches.length === 0 ? (
                  <p className="text-center text-gray-500">Nenhuma partida disponível no momento.</p>
                ) : (
                  matches.map((match) => {
                    const matchDateTime = parseISO(match.match_date);
                    // Bloqueia a partida se a data/hora atual for MAIOR ou IGUAL à data/hora da partida
                    const isMatchPredictionLocked = new Date().getTime() >= matchDateTime.getTime();

                    return (
                      <div key={match.id} className="flex items-center justify-between border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex items-center gap-2 w-1/3 justify-start">
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarImage src={getTeamLogo(match.home_team_id)} />
                            <AvatarFallback>{teams.find(t => t.id === match.home_team_id)?.name?.substring(0,2)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-gray-700 truncate">{getTeamName(match.home_team_id)}</span>
                        </div>

                        <div className="flex items-center gap-2 w-1/3 justify-center">
                          <Input
                            type="number"
                            className="w-16 text-center"
                            value={matchPredictions[match.id]?.homeGoals ?? ''}
                            onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)}
                            min="0"
                            disabled={isMatchPredictionLocked || submitting} // Desabilita se o prazo passou ou estiver salvando
                          />
                          <span className="font-bold text-gray-700">X</span>
                          <Input
                            type="number"
                            className="w-16 text-center"
                            value={matchPredictions[match.id]?.awayGoals ?? ''}
                            onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                            min="0"
                            disabled={isMatchPredictionLocked || submitting} // Desabilita se o prazo passou ou estiver salvando
                          />
                        </div>

                        <div className="flex items-center gap-2 w-1/3 justify-end">
                          <span className="font-medium text-gray-700 text-right truncate">{getTeamName(match.away_team_id)}</span>
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarImage src={getTeamLogo(match.away_team_id)} />
                            <AvatarFallback>{teams.find(t => t.id === match.away_team_id)?.name?.substring(0,2)}</AvatarFallback>
                          </Avatar>
                        </div>
                        {isMatchPredictionLocked && (
                          <p className="text-red-500 text-xs ml-4">Prazo encerrado ({format(matchDateTime, 'dd/MM HH:mm', { locale: ptBR })}).</p>
                        )}
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="groups">
            <Card className="shadow-lg">
              <CardHeader className="bg-fifa-blue text-white">
                <CardTitle>Classificação dos Grupos</CardTitle>
                <CardDescription className="text-gray-200">
                  Selecione o 1º e 2º lugar de cada grupo.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {groups.length === 0 ? (
                  <p className="text-center text-gray-500">Nenhum grupo disponível no momento.</p>
                ) : (
                  groups.map(group => (
                    <div key={group.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                      <h3 className="font-bold text-lg text-fifa-blue mb-3">Grupo {group.name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor={`group-${group.id}-first`}>1º Lugar</Label>
                          <Select
                            value={groupPositions[group.id]?.first || ''}
                            onValueChange={(value) => handleGroupPositionChange(group.id, 'first', value)}
                            disabled={isGlobalPredictionLockedForFinalAndGroups || submitting} // Desabilita se o prazo global passou ou estiver salvando
                          >
                            <SelectTrigger id={`group-${group.id}-first`}>
                              <SelectValue placeholder="Selecione o 1º..." />
                            </SelectTrigger>
                            <SelectContent>
                              {teamsByGroup[group.id]?.map(team => (
                                <SelectItem key={team.id} value={team.id}>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-5 w-5">
                                      <AvatarImage src={team.flag_url} />
                                      <AvatarFallback>{team.name.substring(0,2)}</AvatarFallback>
                                    </Avatar>
                                    {team.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor={`group-${group.id}-second`}>2º Lugar</Label>
                          <Select
                            value={groupPositions[group.id]?.second || ''}
                            onValueChange={(value) => handleGroupPositionChange(group.id, 'second', value)}
                            disabled={isGlobalPredictionLockedForFinalAndGroups || submitting} // Desabilita se o prazo global passou ou estiver salvando
                          >
                            <SelectTrigger id={`group-${group.id}-second`}>
                              <SelectValue placeholder="Selecione o 2º..." />
                            </SelectTrigger>
                            <SelectContent>
                              {teamsByGroup[group.id]?.map(team => (
                                <SelectItem key={team.id} value={team.id}>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-5 w-5">
                                      <AvatarImage src={team.flag_url} />
                                      <AvatarFallback>{team.name.substring(0,2)}</AvatarFallback>
                                    </Avatar>
                                    {team.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="final">
            <Card className="shadow-lg">
              <CardHeader className="bg-fifa-blue text-white">
                <CardTitle>Palpite Final</CardTitle>
                <CardDescription className="text-gray-200">
                  Selecione o Campeão, Vice, 3º e 4º colocados, e o placar da final.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <Label htmlFor="champion">Campeão</Label>
                  <Select
                    value={finalPositions.champion}
                    onValueChange={(value) => handleFinalPositionChange('champion', value)}
                    disabled={isGlobalPredictionLockedForFinalAndGroups || submitting} // Desabilita se o prazo global passou ou estiver salvando
                  >
                    <SelectTrigger id="champion">
                      <SelectValue placeholder="Selecione o Campeão..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={team.flag_url} />
                              <AvatarFallback>{team.name.substring(0,2)}</AvatarFallback>
                            </Avatar>
                            {team.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="runnerUp">Vice Campeão</Label>
                  <Select
                    value={finalPositions.runnerUp}
                    onValueChange={(value) => handleFinalPositionChange('runnerUp', value)}
                    disabled={isGlobalPredictionLockedForFinalAndGroups || submitting} // Desabilita se o prazo global passou ou estiver salvando
                  >
                    <SelectTrigger id="runnerUp">
                      <SelectValue placeholder="Selecione o Vice..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={team.flag_url} />
                              <AvatarFallback>{team.name.substring(0,2)}</AvatarFallback>
                            </Avatar>
                            {team.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="thirdPlace">3º Lugar</Label>
                  <Select
                    value={finalPositions.thirdPlace}
                    onValueChange={(value) => handleFinalPositionChange('thirdPlace', value)}
                    disabled={isGlobalPredictionLockedForFinalAndGroups || submitting} // Desabilita se o prazo global passou ou estiver salvando
                  >
                    <SelectTrigger id="thirdPlace">
                      <SelectValue placeholder="Selecione o 3º..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={team.flag_url} />
                              <AvatarFallback>{team.name.substring(0,2)}</AvatarFallback>
                            </Avatar>
                            {team.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="fourthPlace">4º Lugar</Label>
                  <Select
                    value={finalPositions.fourthPlace}
                    onValueChange={(value) => handleFinalPositionChange('fourthPlace', value)}
                    disabled={isGlobalPredictionLockedForFinalAndGroups || submitting} // Desabilita se o prazo global passou ou estiver salvando
                  >
                    <SelectTrigger id="fourthPlace">
                      <SelectValue placeholder="Selecione o 4º..." />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={team.flag_url} />
                              <AvatarFallback>{team.name.substring(0,2)}</AvatarFallback>
                            </Avatar>
                            {team.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between gap-4 mt-6">
                  <Label>Placar da Final:</Label>
                  <Input
                    type="number"
                    className="w-24 text-center"
                    value={finalScore.homeGoals}
                    onChange={(e) => handleFinalScoreChange('homeGoals', e.target.value)}
                    min="0"
                    disabled={isGlobalPredictionLockedForFinalAndGroups || submitting} // Desabilita se o prazo global passou ou estiver salvando
                  />
                  <span className="font-bold text-lg">X</span>
                  <Input
                    type="number"
                    className="w-24 text-center"
                    value={finalScore.awayGoals}
                    onChange={(e) => handleFinalScoreChange('awayGoals', e.target.value)}
                    min="0"
                    disabled={isGlobalPredictionLockedForFinalAndGroups || submitting} // Desabilita se o prazo global passou ou estiver salvando
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="shadow-lg mb-8">
          <CardHeader className="bg-fifa-blue text-white">
            <CardTitle>Confirme seus Palpites</CardTitle>
            <CardDescription className="text-gray-200">
              Clique no botão abaixo para salvar seus palpites
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">

            <Button
              className="w-full bg-fifa-blue hover:bg-opacity-90 mb-4" // Adicionei um mb-4 aqui para espaçamento
              onClick={handleSubmitBets}
              // O botão geral é desabilitado se houver alguma operação em andamento.
              // A validação de data ocorre internamente para cada tipo de palpite.
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
              disabled={submitting || !user} // Desabilita se estiver salvando ou se não houver usuário
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Comprovante
            </Button>

            <p className="text-sm text-gray-500 text-center">
              Atenção: Ao confirmar, os palpites de partidas com prazo encerrado e palpites de grupo/final após o dia {format(globalPredictionCutoffDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })} não serão salvos.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Palpites;