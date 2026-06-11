import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO, isAfter, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Crown, Medal, Loader2, Users, Calendar, Bot, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { fetchMatchPredictionsForMatches } from '@/utils/pointsCalculator/dataAccess';
import { SupabaseMatchPrediction, User } from '@/utils/pointsCalculator/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';

// Tipos auxiliares estruturados
interface GroupPrediction { user_id: string; user_name: string; user_avatar: string; group_name: string; first_team_name: string; second_team_name: string; }
interface FinalPrediction { user_id: string; user_name: string; user_avatar: string; champion_name: string; runner_up_name: string; third_place_name: string; fourth_place_name: string; final_home_score: number; final_away_score: number; }
interface DisplayMatch { 
    id: string; 
    home_team: { name: string; code?: string | null; flag_url?: string | null }; 
    away_team: { name: string; code?: string | null; flag_url?: string | null }; 
    match_date: string; 
    home_score: number | null; 
    away_score: number | null; 
    is_finished: boolean;
}

const DailyMatchesAndPredictions: React.FC = () => {
  const { activePool } = useAuth(); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dailyMatches, setDailyMatches] = useState<DisplayMatch[]>([]);
  const [dailyPredictions, setDailyPredictions] = useState<SupabaseMatchPrediction[]>([]);
  const [groupPredictions, setGroupPredictions] = useState<GroupPrediction[]>([]);
  const [finalPredictions, setFinalPredictions] = useState<FinalPrediction[]>([]);

  const [poolParticipants, setPoolParticipants] = useState<User[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [firstMatchOfTournament, setFirstMatchOfTournament] = useState<Date | null>(null);

  const loadAllData = useCallback(async () => {
    if (!activePool?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. Busca todos os participantes do Bolão
      const { data: participantsData, error: partError } = await supabase
        .from('participations')
        .select(`user:users_custom!inner (id, name, username, avatar_url, is_admin, is_ai)`)
        .eq('pool_id', activePool.id);

      if (partError) throw partError;

      const validUsers: User[] = participantsData.map((p: any) => p.user);
      setPoolParticipants(validUsers);
      const validUserIds = new Set(validUsers.map(u => u.id));

      // 2. Mapeia a tabela de times para resolver os nomes das seleções
      const { data: allTeams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name');
        
      if (teamsError) throw teamsError;
      const teamsMap = new Map<string, string>((allTeams || []).map(t => [t.id, t.name]));

      // 3. Busca a data do primeiro jogo do campeonato ativo
      const currentChampionshipId = activePool.championship_id || (activePool as any).tournament_id;
      const { data: championshipMatches } = await supabase
        .from('matches')
        .select('match_date')
        .eq('championship_id', currentChampionshipId)
        .order('match_date', { ascending: true })
        .limit(1);

      if (championshipMatches && championshipMatches.length > 0) {
        setFirstMatchOfTournament(new Date(championshipMatches[0].match_date));
      }

      // 4. Busca os jogos do dia selecionado
      const utcStartString = startOfDay(currentDate).toISOString();
      const utcEndString = endOfDay(currentDate).toISOString();
      
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          id, match_date, home_score, away_score, status,
          home_team:teams!matches_home_team_id_fkey(name, code, flag_url),
          away_team:teams!matches_away_team_id_fkey(name, code, flag_url)
        `)
        .gte('match_date', utcStartString)
        .lte('match_date', utcEndString)
        .eq('championship_id', currentChampionshipId)
        .order('match_date', { ascending: true });

      if (matchesError) throw matchesError;

      const formattedMatches = (matchesData || []).map((m: any) => ({
        id: m.id,
        home_team: m.home_team,
        away_team: m.away_team,
        match_date: m.match_date,
        home_score: m.home_score,
        away_score: m.away_score,
        is_finished: m.status === 'finished'
      }));

      setDailyMatches(formattedMatches);

      // 5. Palpites dos confrontos do dia
      if (formattedMatches.length > 0) {
        const matchIds = formattedMatches.map(match => match.id);
        const allPreds = await fetchMatchPredictionsForMatches(matchIds);
        setDailyPredictions(allPreds.filter(p => p.pool_id === activePool.id && validUserIds.has(p.user_id)));
      } else {
        setDailyPredictions([]);
      }

      // 6. BUSCA COMPLETA NA FINAL_PREDICTIONS (Traz os dados de toda a galera do bolão)
      const { data: rawFinals, error: finalError } = await supabase
        .from('final_predictions')
        .select('user_id, final_home_score, final_away_score, champion_id, runner_up_id, third_place_id, fourth_place_id')
        .eq('pool_id', activePool.id);

      if (finalError) throw finalError;

      const formattedFinals: FinalPrediction[] = (rawFinals || []).map((f: any) => {
        const pUser = validUsers.find(u => u.id === f.user_id);
        return {
          user_id: f.user_id,
          user_name: pUser?.name || 'Participante',
          user_avatar: pUser?.avatar_url || '',
          champion_name: teamsMap.get(f.champion_id) || 'Não selecionado',
          runner_up_name: teamsMap.get(f.runner_up_id) || 'Não selecionado',
          third_place_name: teamsMap.get(f.third_place_id) || 'Não selecionado',
          fourth_place_name: teamsMap.get(f.fourth_place_id) || 'Não selecionado',
          final_home_score: f.final_home_score !== null ? f.final_home_score : 0,
          final_away_score: f.final_away_score !== null ? f.final_away_score : 0
        };
      });

      setFinalPredictions(formattedFinals.filter(f => validUserIds.has(f.user_id)));

      // 7. Palpites das fases de grupos via RPC
      const groupPredsResult = await supabase.rpc('get_all_group_predictions', { p_pool_id: activePool.id });
      setGroupPredictions((groupPredsResult.data || []).filter((p: GroupPrediction) => validUserIds.has(p.user_id)));

    } catch (err: any) {
      console.error("Erro ao carregar dados:", err);
      setError("Não foi possível carregar os palpites da galera.");
    } finally {
      setLoading(false);
    }
  }, [currentDate, activePool]);
  
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleDateChange = (days: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + days);
    setCurrentDate(newDate);
  };

  const isDailyLocked = useMemo(() => {
    if (!activePool) return true;
    if (activePool.prediction_deadline) {
      return !isAfter(new Date(), new Date(activePool.prediction_deadline));
    }
    if (dailyMatches && dailyMatches.length > 0) {
      const firstMatchDate = new Date(Math.min(...dailyMatches.map(m => new Date(m.match_date).getTime())));
      return !isAfter(new Date(), firstMatchDate);
    }
    return false;
  }, [activePool, dailyMatches]);

  const isTournamentStarted = useMemo(() => {
    if (!activePool) return false;
    if (activePool.prediction_deadline) {
      return isAfter(new Date(), new Date(activePool.prediction_deadline));
    }
    if (firstMatchOfTournament) {
      return isAfter(new Date(), firstMatchOfTournament);
    }
    return false;
  }, [activePool, firstMatchOfTournament]);
    
  const deadlineFormatted = activePool?.prediction_deadline 
    ? format(new Date(activePool.prediction_deadline), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) 
    : "o início oficial do campeonato";

  const groupedGroupPredictions = useMemo(() => {
    return groupPredictions.reduce((acc, pred) => {
      (acc[pred.user_id] = acc[pred.user_id] || { user_name: pred.user_name, user_avatar: pred.user_avatar, predictions: [] }).predictions.push(pred);
      return acc;
    }, {} as Record<string, { user_name: string; user_avatar: string, predictions: GroupPrediction[] }>);
  }, [groupPredictions]);

  if (!activePool) return null;

  if (error) return (
    <div className="container mx-auto p-4">
        <Alert variant="destructive"><AlertTitle>Ops!</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
    </div>
  );

  const LockedCuriousView = ({ tabName }: { tabName: string }) => (
    <div className="text-center py-12 max-w-lg mx-auto">
      <Card className="shadow-md border-dashed border-2 border-gray-200">
        <CardContent className="space-y-4 pt-6">
          <div className="bg-blue-50 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-blue-600">
            <EyeOff className="h-8 w-8 animate-pulse" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-700">Seu curioso!</CardTitle>
          <p className="text-gray-500 text-sm">
            Para garantir a integridade das apostas, os palpites de <strong>{tabName}</strong> da galera só serão revelados após o fechamento do mercado.
          </p>
          <div className="pt-2">
            <Badge variant="outline" className="px-3 py-1 text-xs border-blue-200 bg-blue-50 text-blue-800 font-medium">
              Liberação em: {deadlineFormatted}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8 max-w-6xl">
      <div className="text-center mb-8 space-y-2">
        <h1 className="text-3xl font-bold text-fifa-blue flex items-center justify-center gap-3">
            <Users className="h-8 w-8 text-fifa-gold" />
            Palpites da Galera
        </h1>
        <p className="text-gray-500">
            Veja o que seus amigos (e as IAs <Bot className="inline h-3 w-3 mb-1"/>) estão apostando no bolão <strong>{activePool.name}</strong>
        </p>
      </div>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-gray-100 p-1 rounded-xl">
          <TabsTrigger value="daily" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-fifa-blue data-[state=active]:shadow-sm">Do Dia</TabsTrigger>
          <TabsTrigger value="groups" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-fifa-blue data-[state=active]:shadow-sm">Grupos</TabsTrigger>
          <TabsTrigger value="finals" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-fifa-blue data-[state=active]:shadow-sm">Finais</TabsTrigger>
        </TabsList>

        {/* --- ABA 1: JOGOS DO DIA --- */}
        <TabsContent value="daily" className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-center items-center gap-2 sm:gap-6 bg-white p-3 rounded-xl shadow-sm border border-gray-100 max-w-md mx-auto mb-8">
                <Button variant="ghost" size="icon" onClick={() => handleDateChange(-1)} className="hover:text-fifa-blue hover:bg-blue-50">
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <div className="flex flex-col items-center w-40 sm:w-48">
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Visualizando</span>
                    <span className="text-sm sm:text-base font-bold text-fifa-blue capitalize">
                        {format(currentDate, "EEE, dd 'de' MMMM", { locale: ptBR })}
                    </span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleDateChange(1)} className="hover:text-fifa-blue hover:bg-blue-50">
                    <ChevronRight className="h-6 w-6" />
                </Button>
            </div>

            {loading ? (
                <div className="flex flex-col justify-center items-center h-48 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-fifa-blue" />
                    <p className="text-sm text-gray-400 animate-pulse">Carregando palpites...</p>
                </div>
            ) : dailyMatches.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Nenhuma partida agendada para este dia.</p>
                    <Button variant="link" onClick={() => handleDateChange(1)} className="text-fifa-blue">Ver próximo dia</Button>
                </div>
            ) : isDailyLocked ? (
                <LockedCuriousView tabName="Jogos Diários" />
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {dailyMatches.map(match => {
                        const matchPredictions = dailyPredictions.filter(p => p.match_id === match.id);
                        return (
                            <Card key={match.id} className="overflow-hidden border-0 shadow-lg ring-1 ring-gray-100">
                                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-4">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="text-right flex-1 font-bold text-gray-800 text-sm sm:text-base">{match.home_team?.name}</div>
                                        <div className="bg-fifa-blue text-white px-3 py-1 rounded-md font-mono font-bold text-sm shadow-sm whitespace-nowrap">
                                            {match.is_finished ? `${match.home_score} - ${match.away_score}` : "vs"}
                                        </div>
                                        <div className="text-left flex-1 font-bold text-gray-800 text-sm sm:text-base">{match.away_team?.name}</div>
                                    </div>
                                    {!match.is_finished && (
                                        <div className="hidden sm:block ml-4 text-xs font-medium text-gray-400 bg-white px-2 py-1 rounded border">
                                            {format(parseISO(match.match_date), 'HH:mm')}
                                        </div>
                                    )}
                                  </div>
                                </CardHeader>
                                
                                <CardContent className="p-4 bg-white">
                                  {matchPredictions.length === 0 ? (
                                    <p className="text-center text-sm text-gray-400 py-2 italic">Ninguém arriscou um palpite ainda.</p>
                                  ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                        {matchPredictions.map(p => {
                                            const user = poolParticipants.find(u => u.id === p.user_id);
                                            if (!user) return null;
                                            
                                            const isExactHit = match.is_finished && p.home_score === match.home_score && p.away_score === match.away_score;
                                            const isAiUser = user.is_ai;

                                            return (
                                                <TooltipProvider key={p.id}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                    <div className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${isExactHit ? 'bg-green-50 border-green-200 shadow-inner' : isAiUser ? 'bg-blue-50/50 border-blue-100' : 'bg-gray-50 border-gray-100 hover:border-blue-200'}`}>
                                                        <Avatar className="h-6 w-6 border border-white shadow-sm">
                                                            <AvatarImage src={user.avatar_url || undefined} />
                                                            <AvatarFallback className={`text-[10px] ${isAiUser ? 'bg-blue-200 text-blue-800' : 'bg-blue-100 text-blue-700'}`}>
                                                                {user.name?.substring(0,1)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col min-w-0 flex-1">
                                                            <span className="text-[10px] text-gray-500 truncate leading-tight flex items-center gap-1">
                                                                {user.name?.split(' ')[0]}
                                                                {isAiUser && <Bot className="h-2 w-2 text-blue-400"/>}
                                                            </span>
                                                            <span className={`text-xs font-bold font-mono leading-tight ${isExactHit ? 'text-green-700' : 'text-gray-800'}`}>
                                                                {p.home_score} - {p.away_score}
                                                            </span>
                                                        </div>
                                                        {isExactHit && <Crown className="h-3 w-3 text-green-600 flex-shrink-0" />}
                                                    </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="bg-fifa-blue text-white border-0">
                                                        <p className="font-bold flex items-center gap-2">
                                                            {user.name}
                                                            {isAiUser && <Badge variant="secondary" className="text-[10px] h-4 px-1">IA</Badge>}
                                                        </p>
                                                        {isExactHit && <p className="text-xs text-green-300">Cravada!</p>}
                                                    </TooltipContent>
                                                </Tooltip>
                                                </TooltipProvider>
                                            )
                                        })}
                                    </div>
                                  )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </TabsContent>
        
        {/* --- ABA 2: GRUPOS --- */}
        <TabsContent value="groups" className="animate-in fade-in slide-in-from-bottom-4">
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-fifa-blue" /></div>
            ) : !isTournamentStarted ? (
                <LockedCuriousView tabName="Palpites dos Grupos" />
            ) : Object.keys(groupedGroupPredictions).length === 0 ? (
                <div className="text-center py-12 text-gray-400">Nenhum palpite de grupo cadastrado para este bolão.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                    {Object.values(groupedGroupPredictions).map(({ user_name, user_avatar, predictions }) => (
                        <Card key={user_name} className="shadow-md hover:shadow-lg transition-shadow duration-200">
                            <CardHeader className="flex flex-row items-center gap-3 pb-3 border-b border-gray-50">
                                <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                    <AvatarImage src={user_avatar || undefined} />
                                    <AvatarFallback className="bg-blue-50 text-blue-600 font-bold">{user_name ? user_name.substring(0, 2).toUpperCase() : '?'}</AvatarFallback>
                                </Avatar>
                                <CardTitle className="text-base text-gray-800">{user_name}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-4 text-sm">
                                {predictions.sort((a,b) => a.group_name.localeCompare(b.group_name)).map(p => (
                                    <div key={p.group_name} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
                                        <span className='font-bold text-fifa-blue w-8'>{p.group_name}</span>
                                        <div className="text-right flex-1">
                                            <div className="text-gray-700 truncate">1º {p.first_team_name}</div>
                                            <div className="text-gray-500 text-xs truncate">2º {p.second_team_name}</div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </TabsContent>

        {/* --- ABA 3: FINAIS --- */}
        <TabsContent value="finals" className="animate-in fade-in slide-in-from-bottom-4">
            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-fifa-blue" /></div>
            ) : !isTournamentStarted ? (
                <LockedCuriousView tabName="Palpites do Pódio e Final" />
            ) : finalPredictions.length === 0 ? (
                <div className="text-center py-12 text-gray-400">Nenhum palpite para as finais encontrado neste bolão.</div>
            ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    {finalPredictions.map(p => (
                        <Card key={p.user_id} className="shadow-md border-l-4 border-l-fifa-gold">
                            <CardHeader className="flex flex-row items-center gap-3 pb-2">
                                <Avatar className="h-12 w-12 border-2 border-fifa-gold">
                                    <AvatarImage src={p.user_avatar || undefined} />
                                    <AvatarFallback className="bg-yellow-50 text-yellow-700 font-bold">{p.user_name ? p.user_name.substring(0, 2).toUpperCase() : '?'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-lg">{p.user_name}</CardTitle>
                                    <p className="text-xs text-gray-500">Palpites para o pódio</p>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 pt-2">
                                <div className="flex items-center gap-2 bg-yellow-50 p-2 rounded-lg border border-yellow-100">
                                    <Crown className="h-5 w-5 text-yellow-500 flex-shrink-0"/>
                                    <div>
                                        <span className="text-xs text-yellow-700 font-bold block uppercase">Campeão</span>
                                        <span className="font-bold text-gray-800">{p.champion_name}</span>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                                        <span className="text-xs text-gray-400 font-bold block uppercase flex items-center gap-1"><Medal className="h-3 w-3"/> Vice</span>
                                        <span className="text-sm font-medium text-gray-700 truncate block">{p.runner_up_name}</span>
                                    </div>
                                    <div className="bg-orange-50 p-2 rounded-lg border border-orange-100">
                                        <span className="text-xs text-orange-400 font-bold block uppercase flex items-center gap-1"><Medal className="h-3 w-3"/> 3º Lugar</span>
                                        <span className="text-sm font-medium text-gray-700 truncate block">{p.third_place_name}</span>
                                    </div>
                                </div>

                                <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
                                    <span className="text-xs text-gray-500">Placar da Final:</span>
                                    <Badge variant="outline" className="font-mono text-base bg-white border-gray-200">
                                        {p.final_home_score} x {p.final_away_score}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                 </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DailyMatchesAndPredictions;