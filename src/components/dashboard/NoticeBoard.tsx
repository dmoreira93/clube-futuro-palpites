// src/components/dashboard/NoticeBoard.tsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Megaphone, Trophy, Star, Users } from 'lucide-react';
import { toast } from 'sonner';

const NoticeBoard = () => {
  const { user, pool } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboardStats', pool?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_pool_dashboard_stats', { p_pool_id: pool!.id });
      if (error) throw new Error("Não foi possível carregar as estatísticas do bolão.");
      return data;
    },
    enabled: !!pool,
  });

  const { data: message, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['poolMessages', pool?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pool_messages')
        .select('message')
        .eq('pool_id', pool!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!pool,
    onSuccess: (data) => {
      if(data?.message) setNewMessage(data.message);
    }
  });

  const upsertMessage = useMutation({
    mutationFn: async (messageText: string) => {
      const { error } = await supabase.from('pool_messages').upsert({
        pool_id: pool!.id,
        user_id: user!.id,
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

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Megaphone className="text-fifa-blue"/> Mural do Bolão</CardTitle>
        <CardDescription>Recados do administrador e estatísticas do grupo.</CardDescription>
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
        {isLoadingMessages ? <Loader2 className="animate-spin" /> : message?.message && (
          <blockquote className="mt-6 border-l-2 pl-6 italic">
            "{message.message}"
          </blockquote>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {isLoadingStats ? <Loader2 className="animate-spin" /> : stats && (
            <>
              <div className="flex flex-col items-center p-2 bg-slate-50 rounded-lg">
                <Trophy className="text-yellow-500"/>
                <span className="font-bold text-sm mt-1">{stats.top_3?.[0]?.name || 'N/A'}</span>
                <span className="text-xs text-muted-foreground">{stats.top_3?.[0]?.points || 0} pts</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-slate-50 rounded-lg">
                <Star className="text-blue-500"/>
                <span className="font-bold text-sm mt-1">{stats.most_exact?.name || 'N/A'}</span>
                <span className="text-xs text-muted-foreground">{stats.most_exact?.exact_scores || 0} exatos</span>
              </div>
              <div className="flex flex-col items-center p-2 bg-slate-50 rounded-lg">
                <Users className="text-red-500"/>
                <span className="font-bold text-sm mt-1">{stats.last_place?.name || 'N/A'}</span>
                <span className="text-xs text-muted-foreground">{stats.last_place?.points || 0} pts</span>
              </div>
               <div className="flex flex-col items-center p-2 bg-slate-50 rounded-lg">
                 <span className="font-bold text-lg">{stats.points_gap || 0}</span>
                <span className="text-xs text-muted-foreground">Pontos de Diferença</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NoticeBoard;