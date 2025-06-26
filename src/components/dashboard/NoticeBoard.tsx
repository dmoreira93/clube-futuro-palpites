// src/components/dashboard/NoticeBoard.tsx (VERSÃO FINAL COM PÓDIO)

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Megaphone, Trophy, Star, UserX, Award } from 'lucide-react';
import { toast } from 'sonner';
import { Participant } from '@/hooks/useParticipantsRanking';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';

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
      const { data, error } = await supabase.from('pool_messages').select('message').eq('pool_id', pool.id).order('created_at', { ascending: false }).limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!pool,
    onSuccess: (data) => {
      if(data?.message) setNewMessage(data.message);
    }
  });
  
  // Busca o ranking completo para pegar os premiados
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

  const upsertMessage = useMutation({
    mutationFn: async (messageText: string) => {
      if (!pool?.id || !user?.id) throw new Error("Usuário ou bolão não encontrado.");
      const { error } = await supabase.from('pool_messages').upsert({
        pool_id: pool.id,
        user_id: user.id,
        message: messageText,
      }, { onConflict: 'pool_id, user_id' }); // Supondo uma constraint unique(pool_id, user_id)
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Recado do bolão atualizado!");
      queryClient.invalidateQueries({ queryKey: ['poolMessages', pool?.id] });
    },
    onError: (error: any) => {
      toast.error("Falha ao salvar o recado.", { description: error.message });
    }
  });

  const isOwner = user?.id === pool?.owner_id;
  
  // Filtra os premiados e o punido do ranking
  const prizeWinners = rankingData?.filter(p => p.prize && p.prize.startsWith('R$')) || [];
  const punishmentWinner = rankingData?.find(p => p.prize && !p.prize.startsWith('R$')) || null;

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
          {isLoadingStats ? <Loader2 className="animate-spin" /> : stats && (
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

        {/* ALTERADO: Seção de Prêmios e Punições agora renderiza as linhas do ranking */}
        {(isLoadingRanking || prizeWinners.length > 0 || punishmentWinner) && <Separator />}

        <div>
            {isLoadingRanking ? <div className="flex justify-center"><Loader2 className="animate-spin" /></div> :
                (prizeWinners.length > 0 || punishmentWinner) && (
                    <div className="space-y-3">
                        <h4 className="font-semibold text-center text-muted-foreground">Pódio e Punição</h4>
                        {prizeWinners.sort((a,b) => a.rank - b.rank).map(winner => (
                            <div key={winner.id} className="flex items-center justify-between p-3 rounded-md bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={winner.avatar_url || ''} />
                                      <AvatarFallback>{winner.name.substring(0,1)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold flex items-center gap-2">
                                          <Badge variant="secondary" className="bg-yellow-400 text-black">{winner.rank}º</Badge>
                                          {winner.name}
                                        </p>
                                        <p className="text-xs text-green-700 dark:text-green-400 font-semibold">{winner.prize}</p>
                                    </div>
                                </div>
                                <span className="font-mono text-sm font-bold">{winner.points} pts</span>
                            </div>
                        ))}
                         {punishmentWinner && (
                             <div className="flex items-center justify-between p-3 rounded-md bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={punishmentWinner.avatar_url || ''} />
                                      <AvatarFallback>{punishmentWinner.name.substring(0,1)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold flex items-center gap-2">
                                          <Badge variant="destructive">{punishmentWinner.rank}º</Badge>
                                          {punishmentWinner.name}
                                        </p>
                                        <p className="text-xs text-red-700 dark:text-red-400 font-semibold">{punishmentWinner.prize}</p>
                                    </div>
                                </div>
                                <span className="font-mono text-sm font-bold">{punishmentWinner.points} pts</span>
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