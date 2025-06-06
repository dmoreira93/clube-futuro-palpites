// src/pages/Resultados.tsx
import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import Layout from "@/components/layout/Layout";
import { MatchCard } from "@/components/results/MatchCard";
import { MatchFilter } from "@/components/results/MatchFilter";
import { ResultForm } from "@/components/results/ResultForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Match as MatchType, Team } from "@/types/matches";
import { User as UserCustom } from "@/utils/pointsCalculator/types"; // Usando o tipo User de pointsCalculator
import { Loader2, AlertTriangle, ListChecks, Trophy, Users as UsersIcon, EyeOff, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos para os dados buscados
type FetchedMatch = MatchType & {
  home_team: { id: string; name: string; flag_url: string | null; group: { name: string } | null } | null;
  away_team: { id: string; name: string; flag_url: string | null; group: { name: string } | null } | null;
};

interface GroupResult {
  group_id: string;
  name?: string; // Nome do grupo, adicionado no join
  first_place_team_id: string | null;
  second_place_team_id: string | null;
  first_place_team_name?: string;
  first_place_team_flag_url?: string | null;
  second_place_team_name?: string;
  second_place_team_flag_url?: string | null;
  is_completed: boolean;
}

interface FinalResult {
  id?: string;
  champion_id: string | null;
  runner_up_id: string | null;
  third_place_id: string | null;
  fourth_place_id: string | null;
  final_home_score: number | null;
  final_away_score: number | null;
  is_completed: boolean;
  champion_name?: string; champion_flag_url?: string | null;
  runner_up_name?: string; runner_up_flag_url?: string | null;
  third_place_name?: string; third_place_flag_url?: string | null;
  fourth_place_name?: string; fourth_place_flag_url?: string | null;
}

interface UserGroupPrediction {
  id: string;
  user_id: string;
  group_id: string;
  predicted_first_team_id: string | null;
  predicted_second_team_id: string | null;
  user_name?: string;
  user_avatar_url?: string | null;
  first_team_name?: string;
  second_team_name?: string;
}

interface UserFinalPrediction {
  id: string;
  user_id: string;
  champion_id: string | null;
  vice_champion_id: string | null; // vice_champion_id é usado na tabela final_predictions
  third_place_id: string | null;
  fourth_place_id: string | null;
  final_home_score: number | null;
  final_away_score: number | null;
  user_name?: string;
  user_avatar_url?: string | null;
  champion_name?: string;
  runner_up_name?: string; // Nome para exibição, mapeado de vice_champion_id
  third_place_name?: string;
  fourth_place_name?: string;
}


const Resultados = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("matches");
  const [showPredictions, setShowPredictions] = useState(false);

  // Data de corte para exibir os palpites
  const predictionDisplayCutoffDate = parseISO("2025-06-14T18:00:00-03:00"); // Fuso horário de Brasília

  useEffect(() => {
    // Verifica se a data de corte já passou para definir o estado inicial de showPredictions
    setShowPredictions(new Date() > predictionDisplayCutoffDate);
  }, [predictionDisplayCutoffDate]);


  const groups = [
    { id: 'A', text: 'A' }, { id: 'B', text: 'B' }, { id: 'C', text: 'C' }, { id: 'D', text: 'D' },
    { id: 'E', text: 'E' }, { id: 'F', text: 'F' }, { id: 'G', text: 'G' }, { id: 'H', text: 'H' },
  ];

  const { data: matches = [], isLoading: isLoadingMatches, error: errorMatches } = useQuery<FetchedMatch[]>({
    queryKey: ['matchesResults'],
    queryFn: async () => { /* ... (mesma função de antes) ... */
      const { data, error: queryError } = await supabase
        .from('matches')
        .select(`
          id, match_date, is_finished, stage, home_score, away_score, home_team_id, away_team_id,
          home_team:home_team_id(id, name, flag_url, group:group_id(name)),
          away_team:away_team_id(id, name, flag_url, group:group_id(name))
        `)
        .not('home_team_id', 'is', null)
        .not('away_team_id', 'is', null)
        .order('match_date', { ascending: true });
      if (queryError) throw new Error(queryError.message || "Não foi possível carregar as partidas.");
      return data as FetchedMatch[] || [];
    },
  });

  const { data: groupResultsData = [], isLoading: isLoadingGroupResults, error: errorGroupResults } = useQuery<GroupResult[]>({
    queryKey: ['groupResultsData'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('groups_results')
        .select(`
          group_id,
          first_place_team_id,
          second_place_team_id,
          is_completed,
          groups (name),
          team_first:first_place_team_id (name, flag_url),
          team_second:second_place_team_id (name, flag_url)
        `)
        .order('group_id', { ascending: true }); // Ordenar por group_id ou groups.name
      if (error) throw new Error(error.message || "Não foi possível carregar os resultados dos grupos.");
      
      return (data || []).map(gr => ({
        ...gr,
        name: (gr.groups as any)?.name, // Ajuste para o nome do grupo
        first_place_team_name: (gr.team_first as any)?.name,
        first_place_team_flag_url: (gr.team_first as any)?.flag_url,
        second_place_team_name: (gr.team_second as any)?.name,
        second_place_team_flag_url: (gr.team_second as any)?.flag_url,
      }));
    },
    enabled: activeTab === 'groups', // Só busca quando a aba de grupos estiver ativa
  });

  const { data: finalResultData, isLoading: isLoadingFinalResult, error: errorFinalResult } = useQuery<FinalResult | null>({
    queryKey: ['finalResultData'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tournament_results')
        .select(`
          id, champion_id, runner_up_id, third_place_id, fourth_place_id, final_home_score, final_away_score, is_completed,
          champion:champion_id (name, flag_url),
          runner_up:runner_up_id (name, flag_url),
          third_place:third_place_id (name, flag_url),
          fourth_place:fourth_place_id (name, flag_url)
        `)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw new Error(error.message || "Não foi possível carregar o resultado final.");
      if (!data) return null;
      return {
        ...data,
        champion_name: (data.champion as any)?.name, champion_flag_url: (data.champion as any)?.flag_url,
        runner_up_name: (data.runner_up as any)?.name, runner_up_flag_url: (data.runner_up as any)?.flag_url,
        third_place_name: (data.third_place as any)?.name, third_place_flag_url: (data.third_place as any)?.flag_url,
        fourth_place_name: (data.fourth_place as any)?.name, fourth_place_flag_url: (data.fourth_place as any)?.flag_url,
      } as FinalResult;
    },
    enabled: activeTab === 'final', // Só busca quando a aba final estiver ativa
  });

  const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery<UserCustom[]>({
    queryKey: ['allUsersForPredictions'],
    queryFn: async () => {
        const { data, error } = await supabase.from('users_custom').select('id, name, username, avatar_url, is_admin');
        if (error) throw error;
        return (data || []).filter(user => !user.is_admin); // Filtra admins aqui
    },
    enabled: showPredictions && (activeTab === 'groups' || activeTab === 'final'),
  });

  const { data: groupPredictions = [], isLoading: isLoadingGroupPredictions } = useQuery<UserGroupPrediction[]>({
    queryKey: ['userGroupPredictions'],
    queryFn: async () => {
        const { data, error } = await supabase
            .from('group_predictions')
            .select(`
                id, user_id, group_id, predicted_first_team_id, predicted_second_team_id,
                users_custom (name, avatar_url),
                team_first:predicted_first_team_id (name),
                team_second:predicted_second_team_id (name)
            `);
        if (error) throw error;
        return (data || []).map(p => ({
            ...p,
            user_name: (p.users_custom as any)?.name,
            user_avatar_url: (p.users_custom as any)?.avatar_url,
            first_team_name: (p.team_first as any)?.name,
            second_team_name: (p.team_second as any)?.name,
        }));
    },
    enabled: showPredictions && activeTab === 'groups',
  });

  const { data: finalPredictions = [], isLoading: isLoadingFinalPredictions } = useQuery<UserFinalPrediction[]>({
    queryKey: ['userFinalPredictions'],
    queryFn: async () => {
        const { data, error } = await supabase
            .from('final_predictions')
            .select(`
                id, user_id, champion_id, vice_champion_id, third_place_id, fourth_place_id, final_home_score, final_away_score,
                users_custom (name, avatar_url),
                champion:champion_id (name),
                runner_up:vice_champion_id (name),
                third_place:third_place_id (name),
                fourth_place:fourth_place_id (name)
            `);
        if (error) throw error;
        return (data || []).map(p => ({
            ...p,
            user_name: (p.users_custom as any)?.name,
            user_avatar_url: (p.users_custom as any)?.avatar_url,
            champion_name: (p.champion as any)?.name,
            runner_up_name: (p.runner_up as any)?.name,
            third_place_name: (p.third_place as any)?.name,
            fourth_place_name: (p.fourth_place as any)?.name,
        }));
    },
    enabled: showPredictions && activeTab === 'final',
  });


  useEffect(() => {
    if (errorMatches) toast({ title: "Erro ao carregar partidas", description: errorMatches.message, variant: "destructive" });
    if (errorGroupResults) toast({ title: "Erro ao carregar resultados de grupos", description: errorGroupResults.message, variant: "destructive" });
    if (errorFinalResult) toast({ title: "Erro ao carregar resultado final", description: errorFinalResult.message, variant: "destructive" });
  }, [errorMatches, errorGroupResults, errorFinalResult, toast]);

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatch(matchId === selectedMatch ? null : matchId);
  };

  const handleFormComplete = () => {
    setSelectedMatch(null);
    toast({
      title: "Resultado Atualizado",
      description: "A lista de partidas será atualizada em breve.",
    });
    queryClient.invalidateQueries({ queryKey: ['matchesResults'] });
  };

  const filteredMatches = matches.filter((match) => {
    if (!match.home_team || !match.away_team) return false;
    if (filter === "all") return true;
    if (filter === "fase-de-grupos") return match.stage === "Fase de Grupos";
    return match.home_team?.group?.name === filter || match.away_team?.group?.name === filter;
  });

  const selectedMatchData = matches.find((m) => m.id === selectedMatch);
  const overallLoading = isLoadingMatches || (activeTab === 'groups' && isLoadingGroupResults) || (activeTab === 'final' && isLoadingFinalResult);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-fifa-blue">Resultados Oficiais e Palpites</h1>
          <p className="text-gray-600 mt-1">
            Confira os resultados das partidas, classificações de grupos e fases finais.
            {isAdmin && " Como administrador, você pode inserir os resultados das partidas aqui."}
          </p>
        </div>
        
        {isAdmin && activeTab === "matches" && (
          <Alert className="mb-6 bg-amber-50 border-amber-300 text-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <AlertTitle className="font-semibold">Área de Administração de Partidas</AlertTitle>
            <AlertDescription>
              Selecione uma partida abaixo para inserir ou corrigir seu resultado. Isso recalculará os pontos.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3">
            <TabsTrigger value="matches">Resultados de Partidas</TabsTrigger>
            <TabsTrigger value="groups">Classificação de Grupos</TabsTrigger>
            <TabsTrigger value="final">Fase Final</TabsTrigger>
          </TabsList>

          <TabsContent value="matches" className="mt-6">
            <MatchFilter value={filter} onValueChange={setFilter} groups={groups} />
            {isAdmin && selectedMatch && selectedMatchData && (
              <div className="mb-8">
                <ResultForm match={selectedMatchData} onComplete={handleFormComplete} />
              </div>
            )}
            {isLoadingMatches ? (
                 <div className="flex justify-center items-center min-h-[200px]"> <Loader2 className="h-12 w-12 animate-spin text-fifa-blue" /></div>
            ) : filteredMatches.length === 0 ? (
              <div className="col-span-full text-center py-12 bg-gray-50 rounded-lg shadow">
                <ListChecks className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl font-semibold text-gray-700">Nenhuma partida encontrada para este filtro.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    selected={selectedMatch === match.id}
                    onClick={isAdmin ? handleSelectMatch : undefined}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="groups" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-fifa-blue">Classificação Oficial dos Grupos</CardTitle>
                <CardDescription>Veja como os times se classificaram em cada grupo.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingGroupResults ? (
                  <div className="flex justify-center items-center min-h-[200px]"> <Loader2 className="h-10 w-10 animate-spin text-fifa-blue" /></div>
                ) : groupResultsData.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">Resultados dos grupos ainda não disponíveis.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {groupResultsData.sort((a,b) => (a.name || "").localeCompare(b.name || "")).map(group => (
                      <Card key={group.group_id} className="shadow-md">
                        <CardHeader className="bg-gray-100">
                          <CardTitle className="text-lg">Grupo {group.name || group.group_id}</CardTitle>
                           <Badge variant={group.is_completed ? "default" : "secondary"} className={group.is_completed ? "bg-green-500" : "bg-yellow-400"}>
                                {group.is_completed ? "Concluído" : "Pendente"}
                           </Badge>
                        </CardHeader>
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-700">1º Lugar:</span>
                            <div className="flex items-center gap-2">
                              {group.first_place_team_flag_url && <Avatar className="h-5 w-5"><AvatarImage src={group.first_place_team_flag_url}/><AvatarFallback>{(group.first_place_team_name || "N/A").substring(0,1)}</AvatarFallback></Avatar>}
                              <span>{group.first_place_team_name || "A definir"}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-700">2º Lugar:</span>
                             <div className="flex items-center gap-2">
                              {group.second_place_team_flag_url && <Avatar className="h-5 w-5"><AvatarImage src={group.second_place_team_flag_url}/><AvatarFallback>{(group.second_place_team_name || "N/A").substring(0,1)}</AvatarFallback></Avatar>}
                              <span>{group.second_place_team_name || "A definir"}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                 {showPredictions && groupResultsData.length > 0 && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-fifa-blue mb-3">Palpites dos Participantes para os Grupos:</h3>
                        {isLoadingGroupPredictions ? <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div> :
                         groupPredictions.length === 0 ? <p className="text-sm text-gray-500">Nenhum palpite de grupo encontrado.</p> :
                         groupResultsData.map(groupRes => {
                             const predictionsForThisGroup = groupPredictions.filter(p => p.group_id === groupRes.group_id);
                             if(predictionsForThisGroup.length === 0) return null;
                             return (
                                 <Card key={`preds-${groupRes.group_id}`} className="mb-4">
                                     <CardHeader><CardTitle className="text-md">Grupo {groupRes.name || groupRes.group_id}</CardTitle></CardHeader>
                                     <CardContent>
                                         {predictionsForThisGroup.map(pred => (
                                             <div key={pred.id} className="text-sm py-1 border-b last:border-b-0">
                                                 <span className="font-medium">{pred.user_name || "Usuário"}:</span> 1º {pred.first_team_name || "-"}, 2º {pred.second_team_name || "-"}
                                             </div>
                                         ))}
                                     </CardContent>
                                 </Card>
                             )
                         })
                        }
                    </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="final" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-fifa-blue">Resultados Oficiais da Fase Final</CardTitle>
                <CardDescription>Campeão, Vice, Terceiro, Quarto e Placar da Final.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingFinalResult ? (
                   <div className="flex justify-center items-center min-h-[200px]"> <Loader2 className="h-10 w-10 animate-spin text-fifa-blue" /></div>
                ) : !finalResultData || !finalResultData.is_completed ? (
                  <p className="text-gray-500 text-center py-4">Resultados da fase final ainda não disponíveis ou não concluídos.</p>
                ) : (
                  <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-lg text-yellow-500">🏆 Campeão:</span>
                        <div className="flex items-center gap-2 text-lg font-semibold">
                            {finalResultData.champion_flag_url && <Avatar className="h-7 w-7"><AvatarImage src={finalResultData.champion_flag_url}/><AvatarFallback>{(finalResultData.champion_name || "-").substring(0,1)}</AvatarFallback></Avatar>}
                            {finalResultData.champion_name || "A definir"}
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">🥈 Vice-Campeão:</span>
                         <div className="flex items-center gap-2">
                            {finalResultData.runner_up_flag_url && <Avatar className="h-6 w-6"><AvatarImage src={finalResultData.runner_up_flag_url}/><AvatarFallback>{(finalResultData.runner_up_name || "-").substring(0,1)}</AvatarFallback></Avatar>}
                            {finalResultData.runner_up_name || "A definir"}
                        </div>
                    </div>
                     <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">🥉 3º Lugar:</span>
                        <div className="flex items-center gap-2">
                            {finalResultData.third_place_flag_url && <Avatar className="h-6 w-6"><AvatarImage src={finalResultData.third_place_flag_url}/><AvatarFallback>{(finalResultData.third_place_name || "-").substring(0,1)}</AvatarFallback></Avatar>}
                            {finalResultData.third_place_name || "A definir"}
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">4º Lugar:</span>
                        <div className="flex items-center gap-2">
                            {finalResultData.fourth_place_flag_url && <Avatar className="h-6 w-6"><AvatarImage src={finalResultData.fourth_place_flag_url}/><AvatarFallback>{(finalResultData.fourth_place_name || "-").substring(0,1)}</AvatarFallback></Avatar>}
                           {finalResultData.fourth_place_name || "A definir"}
                        </div>
                    </div>
                    {finalResultData.final_home_score !== null && finalResultData.final_away_score !== null && (
                      <div className="pt-3 mt-3 border-t text-center">
                        <p className="font-semibold text-gray-700 mb-1">Placar da Final (Campeão vs Vice):</p>
                        <p className="text-2xl font-bold text-fifa-blue">
                            {finalResultData.champion_name}: {finalResultData.final_home_score} x {finalResultData.final_away_score} :{finalResultData.runner_up_name}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {showPredictions && finalResultData && finalResultData.is_completed && (
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold text-fifa-blue mb-3">Palpites dos Participantes para a Fase Final:</h3>
                        {isLoadingFinalPredictions ? <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div> :
                         finalPredictions.length === 0 ? <p className="text-sm text-gray-500">Nenhum palpite final encontrado.</p> :
                         <div className="space-y-2">
                             {finalPredictions.map(pred => (
                                 <Card key={pred.id} className="p-3 text-sm">
                                     <p className="font-medium mb-1">{pred.user_name || "Usuário Desconhecido"}</p>
                                     <ul className="list-disc list-inside pl-2 text-xs">
                                         <li>🏆: {pred.champion_name || "-"}</li>
                                         <li>🥈: {pred.runner_up_name || "-"}</li>
                                         <li>🥉: {pred.third_place_name || "-"}</li>
                                         <li>4º: {pred.fourth_place_name || "-"}</li>
                                         {pred.final_home_score !== null && <li className="mt-1">Placar Final: {pred.final_home_score} x {pred.final_away_score}</li>}
                                     </ul>
                                 </Card>
                             ))}
                         </div>
                        }
                    </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botão para alternar visibilidade dos palpites */}
        {activeTab !== 'matches' && new Date() > predictionDisplayCutoffDate && (
            <div className="mt-6 text-center">
                <Button onClick={() => setShowPredictions(prev => !prev)} variant="outline">
                    {showPredictions ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                    {showPredictions ? "Ocultar Palpites dos Usuários" : "Mostrar Palpites dos Usuários"}
                </Button>
                <p className="text-xs text-gray-500 mt-1">
                    Os palpites dos usuários para grupos e fase final só ficam visíveis após {format(predictionDisplayCutoffDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.
                </p>
            </div>
        )}
         {activeTab !== 'matches' && new Date() <= predictionDisplayCutoffDate && (
            <Alert className="mt-6 bg-blue-50 border-blue-300 text-blue-800">
                <EyeOff className="h-5 w-5 text-blue-600" />
                <AlertTitle>Palpites dos Usuários</AlertTitle>
                <AlertDescription>
                    Os palpites dos usuários para a classificação de grupos e fase final serão visíveis publicamente após {format(predictionDisplayCutoffDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.
                </AlertDescription>
            </Alert>
        )}

      </div>
    </Layout>
  );
};

export default Resultados;