// src/pages/Palpites.tsx

import { useState, useEffect, useCallback, useRef } from "react";
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
import { Match } from "@/types/matches"; // Certifique-se que o tipo Match está completo
import { format, parseISO, isAfter } from "date-fns"; // Adicionado isAfter
import { ptBR } from "date-fns/locale";
import ReactDOMServer from 'react-dom/server';

// Importações para o comprovante
import PredictionReceipt from "@/components/home/predictions/PredictionReceipt";

// --- NOVAS INTERFACES (ou ajuste as suas existentes) ---
interface Team {
  id: string;
  name: string;
}

export interface MatchWithTeams extends Match {
  home_team?: Team;
  away_team?: Team;
}

// Assumindo seus tipos para GroupPrediction e FinalPrediction
// Você deve ter essas interfaces definidas em algum lugar, talvez em '@/types/predictions' ou similar
interface GroupPrediction {
  id?: string;
  group_name: string;
  predicted_first_team_id: string;
  predicted_second_team_id: string;
  predicted_first_team?: Team; // Para exibir o nome do time
  predicted_second_team?: Team; // Para exibir o nome do time
}

interface FinalPrediction {
  id?: string;
  champion_id: string;
  runner_up_id: string;
  third_place_id: string;
  fourth_place_id: string;
  champion?: Team;
  runner_up?: Team;
  third_place?: Team;
  fourth_place?: Team;
}

// Variáveis para datas de corte (ajuste conforme necessário)
// Use estas para as regras específicas do seu bolão
const globalPredictionCutoffDate = parseISO("2025-06-14T12:00:00-03:00"); // Exemplo: data limite global para o bolão (ajuste fuso horário)
const finalPredictionCutoffDate = parseISO("2025-06-20T12:00:00-03:00"); // Exemplo: data limite para palpites de final (ajuste fuso horário)

const Palpites = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("matches");

  // --- Estados para Palpites de Partida (seria DailyPredictions) ---
  const [matchPredictions, setMatchPredictions] = useState<any[]>([]); // Pode ser vazio ou removido se DailyPredictions cuida disso
  const [matches, setMatches] = useState<MatchWithTeams[]>([]); // Para obter detalhes dos times no comprovante

  // --- Estados para Palpites de Grupo ---
  const [groups, setGroups] = useState<any[]>([]); // Supondo que você tenha uma tabela 'groups'
  const [teams, setTeams] = useState<Team[]>([]); // Para as opções de seleção de times
  const [groupPredictions, setGroupPredictions] = useState<GroupPrediction[]>([]);

  // --- Estados para Palpites da Final ---
  const [finalPrediction, setFinalPrediction] = useState<FinalPrediction | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // Função auxiliar para verificar se o prazo global ou da partida foi atingido
  const getCanPredictMatch = useCallback((matchDate: string, isFinished: boolean) => {
    const matchTime = parseISO(matchDate).getTime();
    const now = new Date().getTime();
    const cutoffTime = matchTime - (1 * 60 * 60 * 1000); // 1 hora antes do jogo

    if (isFinished) return false;
    if (now > cutoffTime) return false;
    // Se quiser aplicar o prazo global para partidas também, adicione:
    // if (isAfter(new Date(), globalPredictionCutoffDate)) return false;
    return true;
  }, []);


  // --- Efeitos de Carga de Dados Iniciais ---
  useEffect(() => {
    if (!user) {
      navigate("/login");
      toast.warning("Você precisa estar logado para acessar os palpites.");
      return;
    }

    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        // --- Fetch Partidas e Palpites de Partida (DailyPredictions faria isso agora) ---
        // Se DailyPredictions não for mais um componente filho passando dados,
        // você precisaria buscar as partidas e os palpites de partida aqui
        // ou deixar o DailyPredictions lidar com isso internamente.
        const today = format(new Date(), 'yyyy-MM-dd');
        const { data: matchesData, error: matchesError } = await supabase
            .from('matches')
            .select('*, home_team(*), away_team(*)')
            .gte('match_date', today)
            .order('match_date', { ascending: true });

        if (matchesError) throw matchesError;
        setMatches(matchesData as MatchWithTeams[] || []);


        // --- Fetch Grupos e Times ---
        const { data: groupsData, error: groupsError } = await supabase.from('groups').select('*').order('name');
        if (groupsError) throw groupsError;
        setGroups(groupsData || []);

        const { data: teamsData, error: teamsError } = await supabase.from('teams').select('id, name');
        if (teamsError) throw teamsError;
        setTeams(teamsData || []);

        // --- Fetch Palpites de Grupo Existentes ---
        const { data: existingGroupPredictions, error: existingGroupError } = await supabase
          .from('group_predictions')
          .select('*, predicted_first_team(*), predicted_second_team(*)')
          .eq('user_id', user.id);
        if (existingGroupError) throw existingGroupError;

        const initialGroupPredictions: GroupPrediction[] = (groupsData || []).map(group => {
            const existing = existingGroupPredictions?.find(p => p.group_id === group.id);
            return {
                group_name: group.name,
                group_id: group.id,
                predicted_first_team_id: existing?.predicted_first_team_id || '',
                predicted_second_team_id: existing?.predicted_second_team_id || '',
                id: existing?.id, // ID do palpite existente
                predicted_first_team: existing?.predicted_first_team || undefined,
                predicted_second_team: existing?.predicted_second_team || undefined,
            };
        });
        setGroupPredictions(initialGroupPredictions);

        // --- Fetch Palpites da Final Existentes ---
        const { data: existingFinalPrediction, error: existingFinalError } = await supabase
          .from('final_predictions')
          .select('*, champion(*), runner_up(*), third_place(*), fourth_place(*)')
          .eq('user_id', user.id)
          .single(); // Espera apenas um resultado ou null

        if (existingFinalError && existingFinalError.code !== 'PGRST116') { // PGRST116 = no rows found
          throw existingFinalError;
        }

        if (existingFinalPrediction) {
          setFinalPrediction({
            id: existingFinalPrediction.id,
            champion_id: existingFinalPrediction.champion_id,
            runner_up_id: existingFinalPrediction.runner_up_id,
            third_place_id: existingFinalPrediction.third_place_id,
            fourth_place_id: existingFinalPrediction.fourth_place_id,
            champion: existingFinalPrediction.champion || undefined,
            runner_up: existingFinalPrediction.runner_up || undefined,
            third_place: existingFinalPrediction.third_place || undefined,
            fourth_place: existingFinalPrediction.fourth_place || undefined,
          });
        }


      } catch (err: any) {
        console.error("Erro ao carregar dados iniciais:", err);
        setError(err.message || "Falha ao carregar os dados.");
        toast.error("Erro ao carregar dados iniciais: " + (err.message || "Tente novamente."));
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [user, navigate, toast]);

  // --- Handlers para Palpites de Grupo ---
  const handleGroupPredictionChange = (
    groupId: string,
    type: 'first' | 'second',
    teamId: string
  ) => {
    setGroupPredictions(prev => prev.map(gp => {
      if (gp.group_id === groupId) {
        if (type === 'first') {
          return { ...gp, predicted_first_team_id: teamId };
        } else {
          return { ...gp, predicted_second_team_id: teamId };
        }
      }
      return gp;
    }));
  };

  // --- Handlers para Palpites da Final ---
  const handleFinalPredictionChange = (
    type: 'champion' | 'runnerUp' | 'thirdPlace' | 'fourthPlace',
    teamId: string
  ) => {
    setFinalPrediction(prev => ({
      ...(prev || {} as FinalPrediction), // Inicializa se for null
      [`${type}_id`]: teamId,
    }));
  };

  // --- Função de Salvamento Geral (Confirmar Palpites) ---
  const handleSubmitBets = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para confirmar palpites.");
      return;
    }
    setSubmitting(true);

    // Validação de prazo global para TODOS os palpites
    if (isAfter(new Date(), globalPredictionCutoffDate)) {
      toast.error(`O prazo para enviar palpites (partidas, grupos e final) já se encerrou em ${format(globalPredictionCutoffDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}.`);
      setSubmitting(false);
      return;
    }

    let allSuccess = true;
    let successCount = 0;
    let errorCount = 0;

    try {
      // --- SALVAR PALPITES DE PARTIDA (Assumindo que DailyPredictions já faz isso ou seria feito aqui) ---
      // Na versão anterior, o DailyPredictions tinha seus próprios botões "Salvar".
      // Se você quer um único botão "Confirmar Palpites", a lógica de salvamento
      // de partidas precisaria ser puxada para cá, iterando sobre 'matchPredictions'
      // ou o estado gerenciado por DailyPredictions (se ele fosse filho passando dados).
      // POR ENQUANTO, este bloco de partida será apenas um placeholder,
      // pois DailyPredictions ainda tem seu próprio botão.
      // Você pode adaptar isso para iterar sobre `matchPredictionsFromDaily` se quiser
      // que o botão "Confirmar Palpites" salve as partidas também.
      console.log("Palpites de partida seriam salvos/confirmados aqui pelo DailyPredictions.");


      // --- SALVAR PALPITES DE GRUPO ---
      for (const gp of groupPredictions) {
        if (!gp.predicted_first_team_id || !gp.predicted_second_team_id) {
          console.warn(`Palpite de grupo ${gp.group_name} incompleto, pulando.`);
          errorCount++;
          continue;
        }
        if (gp.predicted_first_team_id === gp.predicted_second_team_id) {
          toast.error(`No Grupo ${gp.group_name}: os times classificados não podem ser os mesmos.`);
          allSuccess = false;
          errorCount++;
          continue;
        }

        const dataToSave = {
          user_id: user.id,
          group_id: gp.group_id,
          predicted_first_team_id: gp.predicted_first_team_id,
          predicted_second_team_id: gp.predicted_second_team_id,
        };

        if (gp.id) { // Palpite existente, atualiza
          const { error: updateError } = await supabase
            .from('group_predictions')
            .update(dataToSave)
            .eq('id', gp.id);
          if (updateError) throw updateError;
        } else { // Novo palpite, insere
          const { error: insertError } = await supabase
            .from('group_predictions')
            .insert(dataToSave);
          if (insertError) throw insertError;
        }
        successCount++;
      }

      // --- SALVAR PALPITES DA FINAL ---
      if (finalPrediction) {
        // Validação de prazo específico para a final (se houver, caso contrário, usa o global)
        if (isAfter(new Date(), finalPredictionCutoffDate)) { // Se o prazo da final for diferente do global
          toast.error(`O prazo para palpites da final já se encerrou em ${format(finalPredictionCutoffDate, 'dd/MM/yyyy HH:mm', { locale: ptBR })}.`);
          allSuccess = false;
          errorCount++;
        } else if (
          !finalPrediction.champion_id ||
          !finalPrediction.runner_up_id ||
          !finalPrediction.third_place_id ||
          !finalPrediction.fourth_place_id
        ) {
          toast.error("Por favor, preencha todos os campos dos palpites da final.");
          allSuccess = false;
          errorCount++;
        } else if (
            new Set([
                finalPrediction.champion_id,
                finalPrediction.runner_up_id,
                finalPrediction.third_place_id,
                finalPrediction.fourth_place_id
            ]).size !== 4 // Verifica se todos os 4 são únicos
        ) {
            toast.error("Os times campeão, vice, terceiro e quarto lugar devem ser únicos.");
            allSuccess = false;
            errorCount++;
        } else {
            const dataToSave = {
                user_id: user.id,
                champion_id: finalPrediction.champion_id,
                runner_up_id: finalPrediction.runner_up_id,
                third_place_id: finalPrediction.third_place_id,
                fourth_place_id: finalPrediction.fourth_place_id,
            };

            if (finalPrediction.id) { // Palpite existente, atualiza
                const { error: updateError } = await supabase
                    .from('final_predictions')
                    .update(dataToSave)
                    .eq('id', finalPrediction.id);
                if (updateError) throw updateError;
            } else { // Novo palpite, insere
                const { error: insertError } = await supabase
                    .from('final_predictions')
                    .insert(dataToSave);
                if (insertError) throw insertError;
            }
            successCount++;
        }
      }

      if (allSuccess && successCount > 0) {
        toast.success("Palpites confirmados com sucesso!");
      } else if (successCount > 0) {
        toast.warning(`Alguns palpites foram confirmados. ${errorCount > 0 ? `No entanto, ${errorCount} tiveram problemas (incompletos ou fora do prazo).` : ''}`);
      } else {
        toast.error("Nenhum palpite válido foi salvo. Verifique os prazos e preenchimento.");
      }

    } catch (err: any) {
      console.error("Erro ao salvar todos os palpites:", err);
      toast.error("Erro geral ao salvar palpites: " + (err.message || "Tente novamente."));
      allSuccess = false;
    } finally {
      setSubmitting(false);
      // Para garantir que o UI do DailyPredictions reflete o estado atual,
      // você pode precisar refetch os dados se ele não estiver sendo
      // totalmente controlado pelo estado global aqui.
      // window.location.reload(); // Isso seria um hack, melhor refetch específico
    }
  };

  // Ref para o container de impressão
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrintReceipt = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para imprimir o comprovante.");
      return;
    }

    try {
        // Fetch ALL match predictions for the user
        const { data: userMatchPredictions, error: matchPredictionsError } = await supabase
            .from('match_predictions')
            .select('*')
            .eq('user_id', user.id);
        if (matchPredictionsError) throw matchPredictionsError;

        // Fetch details for all matches involved in predictions
        const matchIds = userMatchPredictions.map(p => p.match_id);
        const { data: matchesDetails, error: matchesDetailsError } = await supabase
            .from('matches')
            .select('*, home_team(*), away_team(*)')
            .in('id', matchIds);
        if (matchesDetailsError) throw matchesDetailsError;

        const predictionsForReceipt = userMatchPredictions.map(p => {
            const matchDetail = matchesDetails.find(m => m.id === p.match_id);
            if (!matchDetail) return null;

            return {
                match: matchDetail,
                home_score_prediction: p.home_score,
                away_score_prediction: p.away_score,
            };
        }).filter(Boolean); // Remove nulls


        const receiptComponent = (
            <PredictionReceipt
                user={{ id: user.id, name: user.user_metadata?.full_name || user.email || 'Usuário', avatar_url: user.user_metadata?.avatar_url || '' }}
                predictions={predictionsForReceipt as any} // Cast para o tipo correto se necessário
                dateGenerated={new Date()} // Data de geração do comprovante
            />
        );

        const printContent = ReactDOMServer.renderToString(receiptComponent);
        const printWindow = window.open('', '', 'height=600,width=800');
        if (printWindow) {
            printWindow.document.write('<html><head><title>Comprovante de Palpites</title>');
            printWindow.document.write('</head><body>');
            printWindow.document.write(printContent);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        } else {
            toast.error("Erro ao abrir janela de impressão. Verifique se pop-ups estão bloqueados.");
        }
    } catch (error: any) {
        console.error("Erro ao gerar comprovante:", error);
        toast.error("Erro ao gerar comprovante: " + error.message);
    }
};


  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-4 md:p-6 lg:p-8 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-fifa-blue mx-auto mb-4" />
          <p className="text-gray-600">Carregando seus palpites...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-red-600">Erro ao Carregar</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-500">{error}</p>
              <Button onClick={() => window.location.reload()} className="mt-4">Recarregar Página</Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-center text-fifa-blue mb-6">
          Seus Palpites
        </h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-3 mb-6">
            <TabsTrigger value="matches">
              <SoccerBallIcon className="mr-2 h-4 w-4" /> Partidas
            </TabsTrigger>
            <TabsTrigger value="groups">
              <UsersIcon className="mr-2 h-4 w-4" /> Grupos
            </TabsTrigger>
            <TabsTrigger value="final">
              <TrophyIcon className="mr-2 h-4 w-4" /> Final
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matches">
            {/* O DailyPredictions agora é renderizado aqui e gerencia seus próprios estados */}
            {/* Na versão anterior, o DailyPredictions era renderizado sozinho na rota de home.
                Se você o incluiu aqui antes, ele ficaria assim. */}
            <DailyPredictions />
          </TabsContent>

          <TabsContent value="groups">
            <Card>
              <CardHeader>
                <CardTitle className="text-fifa-blue">Palpites de Grupos</CardTitle>
                <CardDescription>
                  Selecione os dois times que você acha que se classificarão de cada grupo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="default">
                  <AlertTitle>Prazo para Palpites de Grupo</AlertTitle>
                  <AlertDescription>
                    Os palpites de grupo devem ser enviados até{" "}
                    <span className="font-semibold">
                      {format(globalPredictionCutoffDate, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                    .
                  </AlertDescription>
                </Alert>
                {groups.map(group => (
                  <div key={group.id} className="border p-4 rounded-lg bg-gray-50">
                    <h3 className="text-lg font-bold mb-2">{group.name}</h3>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor={`first-place-${group.id}`}>1º Lugar:</Label>
                      <Select
                        value={groupPredictions.find(gp => gp.group_id === group.id)?.predicted_first_team_id || ''}
                        onValueChange={(value) => handleGroupPredictionChange(group.id, 'first', value)}
                        disabled={isAfter(new Date(), globalPredictionCutoffDate) || submitting}
                      >
                        <SelectTrigger id={`first-place-${group.id}`}>
                          <SelectValue placeholder="Selecione o 1º time" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.filter(team => team.group_id === group.id).map(team => ( // Filtra times por grupo
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Label htmlFor={`second-place-${group.id}`} className="mt-2">2º Lugar:</Label>
                      <Select
                        value={groupPredictions.find(gp => gp.group_id === group.id)?.predicted_second_team_id || ''}
                        onValueChange={(value) => handleGroupPredictionChange(group.id, 'second', value)}
                        disabled={isAfter(new Date(), globalPredictionCutoffDate) || submitting}
                      >
                        <SelectTrigger id={`second-place-${group.id}`}>
                          <SelectValue placeholder="Selecione o 2º time" />
                        </SelectTrigger>
                        <SelectContent>
                          {teams.filter(team => team.group_id === group.id).map(team => ( // Filtra times por grupo
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {groupPredictions.find(gp => gp.group_id === group.id)?.predicted_first_team_id === groupPredictions.find(gp => gp.group_id === group.id)?.predicted_second_team_id &&
                       groupPredictions.find(gp => gp.group_id === group.id)?.predicted_first_team_id !== '' && (
                        <p className="text-red-500 text-sm mt-1">Os times não podem ser os mesmos.</p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="final">
            <Card>
              <CardHeader>
                <CardTitle className="text-fifa-blue">Palpites da Final</CardTitle>
                <CardDescription>
                  Palpite quem será o campeão, vice, terceiro e quarto lugar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
              <Alert variant="default">
                  <AlertTitle>Prazo para Palpites da Final</AlertTitle>
                  <AlertDescription>
                    Os palpites da fase final devem ser enviados até{" "}
                    <span className="font-semibold">
                      {format(finalPredictionCutoffDate, "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                    .
                  </AlertDescription>
                </Alert>

                <div className="flex flex-col gap-4">
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

                  <Label htmlFor="runner-up">Vice-Campeão:</Label>
                  <Select
                    value={finalPrediction?.runner_up_id || ''}
                    onValueChange={(value) => handleFinalPredictionChange('runnerUp', value)}
                    disabled={isAfter(new Date(), finalPredictionCutoffDate) || submitting}
                  >
                    <SelectTrigger id="runner-up">
                      <SelectValue placeholder="Selecione o Vice-Campeão" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Label htmlFor="third-place">Terceiro Lugar:</Label>
                  <Select
                    value={finalPrediction?.third_place_id || ''}
                    onValueChange={(value) => handleFinalPredictionChange('thirdPlace', value)}
                    disabled={isAfter(new Date(), finalPredictionCutoffDate) || submitting}
                  >
                    <SelectTrigger id="third-place">
                      <SelectValue placeholder="Selecione o Terceiro Lugar" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Label htmlFor="fourth-place">Quarto Lugar:</Label>
                  <Select
                    value={finalPrediction?.fourth_place_id || ''}
                    onValueChange={(value) => handleFinalPredictionChange('fourthPlace', value)}
                    disabled={isAfter(new Date(), finalPredictionCutoffDate) || submitting}
                  >
                    <SelectTrigger id="fourth-place">
                      <SelectValue placeholder="Selecione o Quarto Lugar" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                    {finalPrediction && new Set([
                        finalPrediction.champion_id,
                        finalPrediction.runner_up_id,
                        finalPrediction.third_place_id,
                        finalPrediction.fourth_place_id
                    ]).size < 4 && (
                        <p className="text-red-500 text-sm mt-1">Os quatro times devem ser únicos.</p>
                    )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-6">
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
        </Card>
      </div>
    </Layout>
  );
};

export default Palpites;