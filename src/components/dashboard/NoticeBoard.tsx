// src/components/dashboard/NoticeBoard.tsx (VERSÃO FINAL COM CÁLCULOS LOCAIS E CORRIGIDA)

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Megaphone, Trophy, Star, UserX, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Participant } from '@/hooks/useParticipantsRanking';
import useParticipantsRanking from '@/hooks/useParticipantsRanking'; // Importa o hook
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { isAIParticipant } from '@/lib/utils';

// Função para formatar o prêmio
const formatPrize = (prizeString: string | null | undefined): string | null => {
    if (!prizeString || !prizeString.startsWith('R$')) return prizeString;
    return `R$ ${parseFloat(prizeString.replace('R$ ', '').replace(',', '.')).toFixed(2).replace('.', ',')}`;
};

const NoticeBoard = () => {
  const { user, pool, isOwner } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  
  // A única fonte de dados de ranking que precisamos é este hook.
  const { participants: rankingData, loading: isLoadingRanking, error: rankingError } = useParticipantsRanking();
  
  const poolId = pool?.id;
  const poolMessagesQueryKey = ['poolMessages', poolId];

  // Busca o recado mais recente do mural
  const { data: message } = useQuery({
    queryKey: poolMessagesQueryKey,
    queryFn: async () => {
      if (!poolId) return null;
      const { data, error } = await supabase.from('pool_messages').select('message').eq('pool_id', poolId).maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!poolId,
    onSuccess: (data) => setNewMessage(data?.message || '')
  });

  const upsertMessage = useMutation({
    mutationFn: async (messageText: string) => {
      if (!poolId || !user?.id) throw new Error("Usuário ou bolão não encontrado.");
      // Usando upsert direto na tabela, que é mais robusto
      const { error } = await supabase.from('pool_messages').upsert({ pool_id: poolId, user_id: user.id, message: messageText }, { onConflict: 'pool_id, user_id' });
      if(error) throw error;
    },
    onSuccess: () => {
      toast.success("Recado atualizado!");
      queryClient.invalidateQueries({ queryKey: poolMessagesQueryKey });
    },
    onError: (error: any) => toast.error("Falha ao salvar o recado.", { description: error.message })
  });

  const deleteMessage = useMutation({
    mutationFn: async () => {
      if (!poolId || !user?.id) throw new Error("Bolão não encontrado.");
      const { error } = await supabase.from('pool_messages').delete().eq('pool_id', poolId).eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Recado removido!");
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: poolMessagesQueryKey });
    },
    onError: (error: any) => toast.error("Falha ao remover o recado.", { description: error.message })
  });
  
  // Calcula as estatísticas e o pódio a partir dos dados do ranking
  const { stats, topThree, lastPlace } = useMemo(() => {
    const humanParticipants = rankingData.filter(p => !isAIParticipant(p) && !p.is_admin);

    if (humanParticipants.length === 0) {
      return { stats: null, topThree: [], lastPlace: null };
    }
    
    const topScorer = humanParticipants[0];
    const lastScorer = humanParticipants[humanParticipants.length - 1];
    const mostExact = [...humanParticipants].sort((a, b) => (b.exactscores || 0) - (a.exactscores || 0))[0];
    const pointsGap = (topScorer?.points || 0) - (lastScorer?.points || 0);

    const calculatedStats = {
        top_scorer: { name: topScorer.name, points: topScorer.points },
        most_exact: { name: mostExact.name, exact_scores: mostExact.exactscores },
        last_place: { name: lastScorer.name, points: lastScorer.points },
        points_gap: pointsGap
    };
    
    return { 
      stats: calculatedStats, 
      topThree: humanParticipants.slice(0, 3), 
      lastPlace: humanParticipants.length > 3 ? lastScorer : null 
    };
  }, [rankingData]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Megaphone className="text-fifa-blue"/> Mural do Bolão</CardTitle>
        <CardDescription>Recados do administrador e destaques da competição.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isOwner && (
          <div className="space-y-2">
            <Textarea placeholder="Deixe um recado para os participantes..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} rows={3}/>
            <div className="flex gap-2">
              <Button onClick={() => upsertMessage.mutate(newMessage)} disabled={upsertMessage.isPending}>{upsertMessage.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button>
              {message?.message && <Button variant="destructive" onClick={() => deleteMessage.mutate()} disabled={deleteMessage.isPending}>{deleteMessage.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4"/>} Remover</Button>}
            </div>
          </div>
        )}
        {!isOwner && message?.message && <blockquote className="mt-6 border-l-2 pl-6 italic">"{message.message}"</blockquote>}
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {isLoadingRanking ? <div className="col-span-full flex justify-center py-8"><Loader2 className="animate-spin"/></div> : stats ? (
            <>
              <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-lg"><Trophy className="text-yellow-500 mb-1"/><span className="font-bold text-sm">{stats.top_scorer?.name}</span><span className="text-xs text-muted-foreground">{stats.top_scorer?.points} pts</span><span className="text-xs font-semibold text-gray-500 mt-1">Maior Pontuador</span></div>
              <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-lg"><Star className="text-blue-500 mb-1"/><span className="font-bold text-sm">{stats.most_exact?.name}</span><span className="text-xs text-muted-foreground">{stats.most_exact?.exact_scores} exatos</span><span className="text-xs font-semibold text-gray-500 mt-1">Mais Acertos Exatos</span></div>
              <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-lg"><UserX className="text-red-500 mb-1"/><span className="font-bold text-sm">{stats.last_place?.name}</span><span className="text-xs text-muted-foreground">{stats.last_place?.points} pts</span><span className="text-xs font-semibold text-gray-500 mt-1">Menor Pontuador</span></div>
              <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-lg"><span className="font-bold text-lg">{stats.points_gap}</span><span className="text-xs font-semibold text-gray-500">Diferença 1º/Últ.</span></div>
            </>
          ) : <div className="col-span-full text-center text-muted-foreground py-8">Não há dados de estatísticas.</div>}
        </div>
        
        {(isLoadingRanking || topThree.length > 0 || lastPlace) && <Separator />}
        
        <div>
          {isLoadingRanking ? <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div> : (topThree.length > 0 || lastPlace) && (
            <div className="space-y-4">
              {topThree.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-center text-muted-foreground">Primeiros Colocados</h4>
                  {topThree.map(winner => (
                    <div key={winner.id} className={cn("flex items-center justify-between p-3 rounded-md border-l-4", winner.rank === 1 && "bg-blue-50 dark:bg-blue-900/30 border-blue-500", winner.rank === 2 && "bg-green-50 dark:bg-green-900/20 border-green-500", winner.rank === 3 && "bg-green-50/50 dark:bg-green-900/10 border-green-400")}>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8"><AvatarImage src={winner.avatar_url || ''} /><AvatarFallback>{winner.name.substring(0,1)}</AvatarFallback></Avatar>
                        <div>
                          <p className="font-bold flex items-center gap-2"><Badge variant="secondary" className={cn("font-bold", winner.rank === 1 && "bg-blue-600 text-white", winner.rank === 2 && "bg-green-600 text-white", winner.rank === 3 && "bg-green-500 text-white")}>{winner.rank}º</Badge>{winner.name}</p>
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
                      <Avatar className="h-8 w-8"><AvatarImage src={lastPlace.avatar_url || ''} /><AvatarFallback>{lastPlace.name.substring(0,1)}</AvatarFallback></Avatar>
                      <div>
                        <p className="font-bold flex items-center gap-2"><Badge variant="destructive">{lastPlace.rank}º</Badge>{lastPlace.name}</p>
                        {lastPlace.prize && <p className="text-xs text-red-700 dark:text-red-400 font-semibold">{lastPlace.prize}</p>}
                      </div>
                    </div>
                    <span className="font-mono text-sm font-bold">{lastPlace.points} pts</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NoticeBoard;