// src/components/dashboard/NoticeBoard.tsx (VERSÃO FINAL COM CORREÇÃO NO MURAL E RANKING)

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Megaphone, Trophy, Star, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { Participant } from '@/hooks/useParticipantsRanking';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

const NoticeBoard = () => {
  const { user, pool } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');

  // Busca as estatísticas principais
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboardStats', pool?.id],
    queryFn: async () => {
      if (!pool?.id) return null;
      const { data, error } = await supabase.rpc('get_pool_dashboard_stats', { p_pool_id: pool.id });
      if (error) throw new Error("Não foi possível carregar as estatísticas do bolão.");
      return data;
    },
    enabled: !!pool,
  });

  // Busca os recados
  const { data: message, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['poolMessages', pool?.id],
    queryFn: async () => {
      if (!pool?.id) return null;
      const { data, error } = await supabase.from('pool_messages').select('message').eq('pool_id', pool.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!pool,
    onSuccess: (data) => {
      if(data?.message) setNewMessage(data.message);
    }
  });
  
  // Busca o ranking completo
  const { data: rankingData, isLoading: isLoadingRanking } = useQuery<Participant[]>({
    queryKey: ['poolRankingForPrizes', pool?.id],
    queryFn: async () => {
        if (!pool?.id) return [];
        const { data, error } = await supabase.rpc('get_pool_ranking', { p_pool_id: pool.id });
        if (error) throw new Error("Não foi possível carregar o ranking para prêmios.");
        return data || [];
    },
    enabled: !!pool,
  });

  // ALTERADO: A mutação agora chama a nova função RPC
  const upsertMessage = useMutation({
    mutationFn: async (messageText: string) => {
      if (!pool?.id) throw new Error("Bolão não encontrado.");
      const { error } = await supabase.rpc('upsert_pool_message', {
        p_pool_id: pool.id,
        p_message: messageText
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Recado do bolão atualizado!");
      queryClient.invalidateQueries({ queryKey: ['poolMessages'] });
    },
    onError: (error: any) => {
      toast.error("Falha ao salvar o recado.", { description: error.message });
    }
  });

  const isOwner = user?.id === pool?.owner_id;
  
  const topThree = rankingData?.slice(0, 3) || [];
  const lastPlace = rankingData && rankingData.length > 3 ? rankingData[rankingData.length - 1] : null;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Megaphone className="text-fifa-blue"/> Mural do Bolão</CardTitle>
        <CardDescription>Recados do administrador e destaques da competição.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isOwner && (
          <div className="space-y-2">
            <Textarea 
              placeholder="Deixe um recado para os participantes..." 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={3}
            />
            <Button onClick={() => upsertMessage.mutate(newMessage)} disabled={upsertMessage.isPending}>
              {upsertMessage.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Recado
            </Button>
          </div>
        )}
        {isLoadingMessages ? <Loader2 className="animate-spin" /> : message?.message && !isOwner && (
          <blockquote className="mt-6 border-l-2 pl-6 italic">
            "{message.message}"
          </blockquote>
        )}

        {/* Seção de Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {isLoadingStats ? <div className="col-span-full flex justify-center"><Loader2 className="animate-spin"/></div> : stats && (
            <>
              <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-lg">
                <Trophy className="text-yellow-500 mb-1"/>
                <span className="font-bold text-sm">{stats.top_scorer?.name || 'N/A'}</span>
                <span className="text-xs text-muted-foreground">{stats.top_scorer?.points || 0} pts</span>
                <span className="text-xs font-semibold text-gray-500 mt-1">Maior Pontuador</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-lg">
                <Star className="text-blue-500 mb-1"/>
                <span className="font-bold text-sm">{stats.most_exact?.name || 'N/A'}</span>
                <span className="text-xs text-muted-foreground">{stats.most_exact?.exact_scores || 0} exatos</span>
                <span className="text-xs font-semibold text-gray-500 mt-1">Mais Acertos Exatos</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-lg">
                <UserX className="text-red-500 mb-1"/>
                <span className="font-bold text-sm">{stats.last_place?.name || 'N/A'}</span>
                <span className="text-xs text-muted-foreground">{stats.last_place?.points || 0} pts</span>
                <span className="text-xs font-semibold text-gray-500 mt-1">Menor Pontuador</span>
              </div>
               <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-lg">
                 <span className="font-bold text-lg">{stats.points_gap || 0}</span>
                <span className="text-xs font-semibold text-gray-500">Diferença 1º/Últ.</span>
              </div>
            </>
          )}
        </div>

        {/* Seção de Prêmios e Punições */}
        {(isLoadingRanking || topThree.length > 0 || lastPlace) && <Separator />}

        <div>
            {isLoadingRanking ? <div className="flex justify-center"><Loader2 className="animate-spin" /></div> :
                (topThree.length > 0 || lastPlace) && (
                    <div className="space-y-4">
                        {topThree.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="font-semibold text-center text-muted-foreground">Primeiros Colocados</h4>
                                {topThree.map((winner, index) => (
                                    <div key={winner.id} className={cn(
                                        "flex items-center justify-between p-3 rounded-md border-l-4",
                                        index === 0 && "bg-blue-50 dark:bg-blue-900/30 border-blue-500",
                                        index === 1 && "bg-green-50 dark:bg-green-900/20 border-green-500",
                                        index === 2 && "bg-green-50/50 dark:bg-green-900/10 border-green-400"
                                    )}>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                              <AvatarImage src={winner.avatar_url || ''} />
                                              <AvatarFallback>{winner.name.substring(0,1)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-bold flex items-center gap-2">
                                                  <Badge variant="secondary" className={cn(
                                                      "font-bold",
                                                      index === 0 && "bg-blue-600 text-white",
                                                      index === 1 && "bg-green-600 text-white",
                                                      index === 2 && "bg-green-500 text-white",
                                                  )}>{index + 1}º</Badge>
                                                  {winner.name}
                                                </p>
                                                {winner.prize && <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold">{winner.prize}</p>}
                                            </div>
                                        </div>
                                        <span className="font-mono text-sm font-bold">{winner.points} pts</span>
                                    </div>
                                ))}
                            </div>
                        )}
                         {lastPlace && (
                             <div className="space-y-2 mt-4">
                                <h4 className="font-semibold text-center text-muted-foreground">Lanterna</h4>
                                <div className="flex items-center justify-between p-3 rounded-md bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={lastPlace.avatar_url || ''} />
                                            <AvatarFallback>{lastPlace.name.substring(0,1)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-bold flex items-center gap-2">
                                                <Badge variant="destructive">{rankingData?.length}º</Badge>
                                                {lastPlace.name}
                                            </p>
                                            {lastPlace.prize && <p className="text-xs text-red-700 dark:text-red-400 font-semibold">{lastPlace.prize}</p>}
                                        </div>
                                    </div>
                                    <span className="font-mono text-sm font-bold">{lastPlace.points} pts</span>
                                </div>
                             </div>
                         )}
                    </div>
                )
            }
        </div>
      </CardContent>
    </Card>
  );
};

export default NoticeBoard;