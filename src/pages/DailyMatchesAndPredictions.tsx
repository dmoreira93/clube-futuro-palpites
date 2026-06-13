import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO, isAfter, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Info, Crown, Medal, Loader2, Users, Calendar, Bot, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { fetchMatchesInUTCRange } from '@/utils/pointsCalculator/dataAccess';
import { User } from '@/utils/pointsCalculator/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';

interface GroupPrediction {
  user_id: string;
  user_name: string;
  user_avatar: string;
  group_name: string;
  first_team_name: string;
  second_team_name: string;
}

interface FinalPrediction {
  user_id: string;
  user_name: string;
  user_avatar: string;
  champion_name: string;
  runner_up_name: string;
  third_place_name: string;
  fourth_place_name: string;
  final_home_score: number;
  final_away_score: number;
}

interface DisplayMatch {
  id: string;
  home_team: { name: string; code?: string | null; flag_url?: string | null };
  away_team: { name: string; code?: string | null; flag_url?: string | null };
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  is_finished: boolean;
}

interface SupabaseMatchPredictionWithLog {
  id: string;
  user_id: string;
  pool_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  created_at: string;
  user_points_log?: {
    points_earned: number;
    points_type: string;
  } | {
    points_earned: number;
    points_type: string;
  }[];
}

const DailyMatchesAndPredictions: React.FC = () => {
  const { activePool } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [poolParticipants, setPoolParticipants] = useState<User[]>([]);
  const [dailyMatches, setDailyMatches] = useState<DisplayMatch[]>([]);
  const [dailyPredictions, setDailyPredictions] = useState<SupabaseMatchPredictionWithLog[]>([]);
  const [groupPredictions, setGroupPredictions] = useState<GroupPrediction[]>([]);
  const [finalPredictions, setFinalPredictions] = useState<FinalPrediction[]>([]);
  const [teamsMap, setTeamsMap] = useState<Record<string, string>>({});

  // Trava de segurança unificada baseada no prazo geral
  const isVisualLocked = useMemo(() => {
    if (!activePool) return true;
    if (activePool.prediction_deadline) {
      return !isAfter(new Date(), new Date(activePool.prediction_deadline));
    }
    return false; 
  }, [activePool]);

  const loadAllData = useCallback(async () => {
    if (!activePool?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Carrega os participantes do bolão
      const { data: participantsData, error: partError } = await supabase
        .from('participations')
        .select('user:users_custom(*)')
        .eq('pool_id', activePool.id);

      if (partError) throw partError;
      const validUsers: User[] = participantsData.map((p: any) => p.user).filter(Boolean);
      setPoolParticipants(validUsers);
      const validUserIds = new Set(validUsers.map(u => u.id));

      // Carrega mapa de times
      const { data: teamsData } = await supabase.from('teams').select('id, name');
      const tMap: Record<string, string> = {};
      teamsData?.forEach(t => { tMap[t.id] = t.name; });
      setTeamsMap(tMap);

      // Carrega partidas do dia selecionado
      const utcStartString = startOfDay(currentDate).toISOString();
      const utcEndString = endOfDay(currentDate).toISOString();
      const matchesData = await fetchMatchesInUTCRange(utcStartString, utcEndString);
      setDailyMatches(matchesData as DisplayMatch[] || []);

      if (matchesData && matchesData.length > 0) {
        const matchIds = matchesData.map(match => match.id);
        
        // Chamada direta pulando o dataAccess antigo para trazer a user_points_log acoplada
        const { data: predsWithLogs, error: predsError } = await supabase
          .from('match_predictions')
          .select(`
            id,
            user_id,
            pool_id,
            match_id,
            home_score,
            away_score,
            created_at,
            user_points_log (
              points_earned,
              points_type
            )
          `)
          .in('match_id', matchIds);

        if (predsError) throw predsError;

        const filteredPreds = (predsWithLogs || []).filter(p => 
          p.pool_id === activePool.id && validUserIds.has(p.user_id)
        );
        setDailyPredictions(filteredPreds as SupabaseMatchPredictionWithLog[]);
      } else {
        setDailyPredictions([]);
      }

      // Carrega palpites de Grupos
      const { data: groupPredsResult } = await supabase.rpc('get_all_group_predictions', { p_pool_id: activePool.id });
      setGroupPredictions((groupPredsResult || []).filter((p: GroupPrediction) => validUserIds.has(p.user_id)));

      // Carrega palpites de Finais
      const { data: finalPredsData } = await supabase
        .from('final_predictions')
        .select('id, user_id, pool_id, champion_id, runner_up_id, third_place_id, fourth_place_id, final_home_score, final_away_score')
        .eq('pool_id', activePool.id);

      const mappedFinals: FinalPrediction[] = (finalPredsData || [])
        .filter(p => validUserIds.has(p.user_id))
        .map(p => {
          const u = validUsers.find(user => user.id === p.user_id);
          return {
            user_id: p.user_id,
            user_name: u?.name || 'Inscrito',
            user_avatar: u?.avatar_url || '',
            champion_name: tMap[p.champion_id] || 'A definir',
            runner_up_name: tMap[p.runner_up_id] || 'A definir',
            third_place_name: tMap[p.third_place_id] || 'A definir',
            fourth_place_name: tMap[p.fourth_place_id] || 'A definir',
            final_home_score: p.final_home_score,
            final_away_score: p.final_away_score
          };
        });
      setFinalPredictions(mappedFinals);

    } catch (err: any) {
      console.error("Erro ao carregar dados:", err);
      setError("Não foi possível carregar os palpites da galera.");
    } finally {
      setLoading(false);
    }
  }, [currentDate, activePool?.id]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleDateChange = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const deadlineFormatted = activePool?.prediction_deadline
    ? format(new Date(activePool.prediction_deadline), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
    : "o início do campeonato";

  const groupedGroupPredictions = useMemo(() => {
    return groupPredictions.reduce((acc, pred) => {
      (acc[pred.user_id] = acc[pred.user_id] || { user_name: pred.user_name, user_avatar: pred.user_avatar, predictions: [] }).predictions.push(pred);
      return acc;
    }, {} as Record<string, { user_name: string; user_avatar: string, predictions: GroupPrediction[] }>);
  }, [groupPredictions]);

  if (!activePool) return null;
  if (error) return <div className="p-4 text-center text-red-500">Ops! {error}</div>;

  const LockedCuriousView = ({ tabName }: { tabName: string }) => (
    <Alert className="bg-amber-50 border-amber-200 my-4">
      <EyeOff className="h-5 w-5 text-amber-600" />
      <AlertTitle className="text-amber-800 font-bold">Seu curioso!</AlertTitle>
      <AlertDescription className="text-amber-700">
        Para garantir a integridade das apostas, os palpites de {tabName} dos seus amigos só serão visíveis após o encerramento do prazo geral do bolão.
      </AlertDescription>
      <div className="mt-2 text-xs font-semibold text-amber-600">
        Liberação em: {deadlineFormatted}
      </div>
    </Alert>
  );

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-fifa-dark-blue">Palpites da Galera</h1>
        <p className="text-sm text-gray-500">Veja o que seus amigos (e as IAs) estão apostando no bolão {activePool.name}</p>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">Do Dia</TabsTrigger>
          <TabsTrigger value="groups">Grupos</TabsTrigger>
          <TabsTrigger value="finals">Finais</TabsTrigger>
        </TabsList>

        {/* --- ABA 1: JOGOS DO DIA --- */}
        <TabsContent value="daily" className="space-y-4">
          <div className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm border">
            <Button variant="ghost" size="icon" onClick={() => handleDateChange(-1)} className="hover:text-fifa-blue hover:bg-blue-50">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 font-medium text-fifa-dark-blue">
              <Calendar className="h-4 w-4 text-fifa-blue" />
              <span>{format(currentDate, "EEE, dd 'de' MMMM", { locale: ptBR })}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => handleDateChange(1)} className="hover:text-fifa-blue hover:bg-blue-50">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-fifa-blue" /><span className="ml-2 text-gray-500">Carregando palpites...</span></div>
          ) : isVisualLocked ? (
            <LockedCuriousView tabName="Partidas" />
          ) : dailyMatches.length === 0 ? (
            <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed text-gray-500">
              <p>Nenhuma partida agendada para este dia.</p>
              <Button variant="link" onClick={() => handleDateChange(1)} className="text-fifa-blue mt-2">Ver próximo dia</Button>
            </div>
          ) : (
            dailyMatches.map(match => {
              const matchPredictions = dailyPredictions.filter(p => p.match_id === match.id);
              const isMatchFinishedReal = match.home_score !== null && match.away_score !== null;

              return (
                <Card key={match.id} className="overflow-hidden border-l-4 border-l-fifa-blue">
                  <CardHeader className="bg-gray-50/50 py-3 px-4 border-b">
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <div className="font-medium">
                        {isMatchFinishedReal ? <Badge variant="secondary" className="bg-green-100 text-green-800">Encerrado</Badge> : <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(parseISO(match.match_date), 'HH:mm')}</span>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex justify-between items-center max-w-md mx-auto font-semibold text-fifa-dark-blue text-sm md:text-base">
                      <span className="w-1/3 text-right truncate">{match.home_team?.name}</span>
                      <span className="px-3 py-1 bg-gray-100 rounded text-fifa-blue min-w-[60px] text-center">
                        {isMatchFinishedReal ? `${match.home_score} - ${match.away_score}` : "vs"}
                      </span>
                      <span className="w-1/3 text-left truncate">{match.away_team?.name}</span>
                    </div>

                    <div className="border-t pt-3">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Users className="h-3 w-3" /> Palpites Ordenados</h4>
                      {matchPredictions.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Ninguém arriscou um palpite ainda.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {matchPredictions.map(p => {
                            const user = poolParticipants.find(u => u.id === p.user_id);
                            if (!user) return null;
                            
                            // Mapeia e limpa os registros do array retornado do Supabase log
                            const rawLog = p.user_points_log;
                            const log = Array.isArray(rawLog) ? rawLog[0] : rawLog;
                            
                            const pontosGanhos = log?.points_earned;
                            const tipoPontuacao = log?.points_type;
                            const possuiRegistroDePontos = pontosGanhos !== undefined && pontosGanhos !== null && isMatchFinishedReal;

                            let cardBgStyle = "bg-white text-gray-700 border-gray-200";
                            let pointsBadgeStyle = "bg-gray-100 text-gray-700";
                            let pointsStr = "";

                            if (possuiRegistroDePontos) {
                              pointsStr = `+${pontosGanhos}`;
                              
                              if (tipoPontuacao === "EXACT_SCORE" || pontosGanhos === 10) {
                                cardBgStyle = "bg-green-50 border-green-300 text-green-950 font-medium shadow-sm";
                                pointsBadgeStyle = "bg-green-200 text-green-800";
                              } else if (pontosGanhos === 0) {
                                cardBgStyle = "bg-white text-gray-400 border-gray-100 opacity-60";
                              }
                            }

                            return (
                              <div key={p.id} className={`relative flex items-center justify-between p-2 rounded-md border text-xs transition-all ${cardBgStyle}`}>
                                
                                {/* Número Elevado Estilo Potencial flutuando no canto */}
                                {possuiRegistroDePontos && (
                                  <span className="absolute -top-1.5 -right-1 bg-fifa-dark-blue text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm z-10 select-none animate-fade-in">
                                    {pointsStr}
                                  </span>
                                )}

                                <div className="flex items-center gap-2 truncate">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={user.avatar_url || undefined} />
                                    <AvatarFallback className="text-[10px]">{user.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <span className="truncate flex items-center gap-1">
                                    {user.name} {user.is_ai && <Bot className="h-3 w-3 text-fifa-blue" />}
                                  </span>
                                </div>
                                <span className={`font-mono px-1.5 py-0.5 rounded ${pointsBadgeStyle}`}>
                                  {p.home_score} x {p.away_score}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* --- ABA 2: GRUPOS --- */}
        <TabsContent value="groups" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-fifa-blue" /></div>
          ) : isVisualLocked ? (
            <LockedCuriousView tabName="Grupos" />
          ) : Object.keys(groupedGroupPredictions).length === 0 ? (
            <p className="text-center text-gray-400 py-8">Nenhum palpite de grupo registrado.</p>
          ) : (
            Object.values(groupedGroupPredictions).map(({ user_name, user_avatar, predictions }) => (
              <Card key={user_name} className="p-4">
                <div className="flex items-center gap-3 border-b pb-2 mb-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user_avatar || undefined} />
                    <AvatarFallback>{user_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-fifa-dark-blue">{user_name}</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
                  {predictions.length > 0 ? (
                    predictions.sort((a, b) => a.group_name.localeCompare(b.group_name)).map(p => (
                      <div key={p.group_name} className="p-2 bg-gray-50 border rounded-md">
                        <div className="font-bold text-fifa-blue border-b pb-1 mb-1 text-center">{p.group_name}</div>
                        <div className="text-gray-600 truncate">1º {p.first_team_name}</div>
                        <div className="text-gray-600 truncate">2º {p.second_team_name}</div>
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-400 italic">Nenhum palpite nesta aba.</span>
                  )}
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* --- ABA 3: FINAIS --- */}
        <TabsContent value="finals" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-fifa-blue" /></div>
          ) : isVisualLocked ? (
            <LockedCuriousView tabName="Finais" />
          ) : finalPredictions.length === 0 ? (
            <p className="text-center text-gray-400 py-8">Nenhum palpite de pódio registrado.</p>
          ) : (
            finalPredictions.map(p => (
              <Card key={p.user_id} className="p-4 border-l-4 border-l-amber-400">
                <div className="flex items-center gap-3 border-b pb-2 mb-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={p.user_avatar || undefined} />
                    <AvatarFallback>{p.user_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-fifa-dark-blue">{p.user_name}</h3>
                    <p className="text-[10px] text-gray-400">Palpites para o pódio</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs text-center">
                  <div className="p-2 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex justify-center mb-1 text-amber-500 font-bold items-center gap-0.5"><Crown className="h-3 w-3" /> Campeão</div>
                    <div className="font-semibold text-gray-800 truncate">{p.champion_name}</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="text-slate-500 font-bold mb-1 flex justify-center items-center gap-0.5"><Medal className="h-3 w-3" /> Vice</div>
                    <div className="font-semibold text-gray-800 truncate">{p.runner_up_name}</div>
                  </div>
                  <div className="p-2 bg-orange-50/50 rounded-lg border border-orange-200/60">
                    <div className="text-orange-600 font-bold mb-1">3º Lugar</div>
                    <div className="font-semibold text-gray-800 truncate">{p.third_place_name}</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-gray-400 font-bold mb-1">4º Lugar</div>
                    <div className="font-semibold text-gray-800 truncate">{p.fourth_place_name}</div>
                  </div>
                  <div className="p-2 bg-blue-50/60 rounded-lg border border-blue-100 col-span-2 md:col-span-1 flex flex-col justify-center">
                    <div className="text-fifa-blue font-bold mb-0.5">Placar da Final</div>
                    <div className="font-mono text-sm bg-white border px-2 py-0.5 rounded inline-block mx-auto font-bold text-fifa-dark-blue">
                      {p.final_home_score} x {p.final_away_score}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DailyMatchesAndPredictions;