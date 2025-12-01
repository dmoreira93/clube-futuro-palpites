import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO, isAfter, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Info, Crown, Medal, Loader2, Users, Calendar, Bot } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { fetchMatchesInUTCRange, fetchMatchPredictionsForMatches } from '@/utils/pointsCalculator/dataAccess';
import { SupabaseMatchPrediction, User } from '@/utils/pointsCalculator/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';

// Tipos auxiliares
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
  const { activePool } = useAuth(); // Contexto multi-bolão
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dailyMatches, setDailyMatches] = useState<DisplayMatch[]>([]);
  const [dailyPredictions, setDailyPredictions] = useState<SupabaseMatchPrediction[]>([]);
  const [groupPredictions, setGroupPredictions] = useState<GroupPrediction[]>([]);
  const [finalPredictions, setFinalPredictions] = useState<FinalPrediction[]>([]);

  const [poolParticipants, setPoolParticipants] = useState<User[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  const loadAllData = useCallback(async () => {
    if (!activePool?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. Busca Participantes do Bolão Atual
      // NOTA: Removemos o filtro de IA (.eq('user.is_ai', false)) para permitir que elas apareçam aqui
      const { data: participantsData, error: partError } = await supabase
        .from('participations')
        .select(`
            user:users_custom!inner (
                id, name, username, avatar_url, is_admin, is_ai
            )
        `)
        .eq('pool_id', activePool.id)
        .eq('user.is_admin', false); // Mantemos apenas o filtro de Admin para não mostrar gestão

      if (partError) throw partError;

      // Mapeia para o formato User simples
      const validUsers: User[] = participantsData.map((p: any) => p.user);
      setPoolParticipants(validUsers);
      const validUserIds = new Set(validUsers.map(u => u.id));

      // 2. Busca Partidas do Dia (UTC)
      const utcStartString = startOfDay(currentDate).toISOString();
      const utcEndString = endOfDay(currentDate).toISOString();
      
      const matchesData = await fetchMatchesInUTCRange(utcStartString, utcEndString);
      setDailyMatches(matchesData as DisplayMatch[] || []);

      // 3. Busca Palpites para essas partidas
      if (matchesData && matchesData.length > 0) {
        const matchIds = matchesData.map(match => match.id);
        const allPreds = await fetchMatchPredictionsForMatches(matchIds);
        
        // FILTRAGEM: Apenas palpites deste bolão e de usuários válidos (incluindo IAs)
        const filteredPreds = allPreds.filter(p => 
            p.pool_id === activePool.id && 
            validUserIds.has(p.user_id)
        );
        
        setDailyPredictions(filteredPreds);
      } else {
        setDailyPredictions([]);
      }

      // 4. Busca Palpites de Grupos e Finais (RPCs)
      const [groupPredsResult, finalPredsResult] = await Promise.all([
        supabase.rpc('get_all_group_predictions', { p_pool_id: activePool.id }),
        supabase.rpc('get_all_final_predictions', { p_pool_id: activePool.id })
      ]);

      // Aplica o mesmo filtro de usuários válidos
      setGroupPredictions((groupPredsResult.data || []).filter((p: GroupPrediction) => validUserIds.has(p.user_id)));
      setFinalPredictions((finalPredsResult.data || []).filter((p: FinalPrediction) => validUserIds.has(p.user_id)));

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

  const shouldShowPredictions = activePool?.prediction_deadline 
    ? isAfter(new Date(), new Date(activePool.prediction_deadline)) 
    : true; 
    
  const deadlineFormatted = activePool?.prediction_deadline 
    ? format(new Date(activePool.prediction_deadline), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) 
    : "";

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

  if (!shouldShowPredictions && !loading) {
    return (
        <div className="container mx-auto p-4 text-center py-12">
            <Card className="max-w-lg mx-auto shadow-lg border-t-4 border-t-yellow-500">
                <CardHeader><CardTitle className="text-xl">O Mistério Continua...</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-yellow-50 p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center">
                        <Info className="h-10 w-10 text-yellow-600" />
                    </div>
                    <p className="text-gray-600">
                        Para garantir a justiça do jogo, os palpites dos outros participantes só serão revelados após o encerramento do prazo de apostas.
                    </p>
                    <Badge variant="outline" className="px-4 py-2 text-base border-yellow-200 bg-yellow-50 text-yellow-800">
                        Liberação em: {deadlineFormatted}
                    </Badge>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-8 max-w-6xl">
      
      {/* Cabeçalho da Página */}
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
            
            {/* Navegador de Datas */}
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
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {dailyMatches.map(match => {
                        const matchPredictions = dailyPredictions.filter(p => p.match_id === match.id);
                        return (
                            <Card key={match.id} className="overflow-hidden border-0 shadow-lg ring-1 ring-gray-100">
                                {/* Cabeçalho da Partida */}
                                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-4">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="text-right flex-1 font-bold text-gray-800 text-sm sm:text-base">{match.home_team?.name}</div>
                                        <div className="bg-fifa-blue text-white px-3 py-1 rounded-md font-mono font-bold text-sm shadow-sm whitespace-nowrap">
                                            {match.is_finished 
                                                ? `${match.home_score} - ${match.away_score}`
                                                : "vs"
                                            }
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
                                
                                {/* Lista de Palpites (Grid) */}
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
                            {predictions.length > 0 ? predictions.sort((a,b) => a.group_name.localeCompare(b.group_name)).map(p => (
                                <div key={p.group_name} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
                                    <span className='font-bold text-fifa-blue w-8'>{p.group_name}</span>
                                    <div className="text-right flex-1">
                                        <div className="text-gray-700 truncate">1º {p.first_team_name}</div>
                                        <div className="text-gray-500 text-xs truncate">2º {p.second_team_name}</div>
                                    </div>
                                </div>
                            )) : <p className="text-gray-400 italic text-center">Nenhum palpite de grupo.</p>}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </TabsContent>

        {/* --- ABA 3: FINAIS --- */}
        <TabsContent value="finals" className="animate-in fade-in slide-in-from-bottom-4">
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
                {finalPredictions.length === 0 && !loading && (
                    <div className="col-span-full text-center py-12">
                        <p className="text-gray-500">Nenhum palpite para as finais encontrado neste bolão.</p>
                    </div>
                )}
             </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DailyMatchesAndPredictions;