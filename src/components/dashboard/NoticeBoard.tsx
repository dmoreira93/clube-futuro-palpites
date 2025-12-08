import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Megaphone, Trophy, Star, UserX, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import useParticipantsRanking, { Participant } from '@/hooks/useParticipantsRanking';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';

// Função auxiliar para identificar IA
const isAIParticipant = (p: Participant) => p.name?.startsWith('IA ') || p.username?.startsWith('GPT');

const NoticeBoard = () => {
  const { user, activePool: pool } = useAuth(); // Corrigido para activePool
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Busca ranking para calcular estatísticas localmente (sem precisar de RPC)
  const { participants: rankingData = [], loading: isLoadingRanking } = useParticipantsRanking();
  
  const poolMessagesQueryKey = ['poolMessages', pool?.id];

  // 1. Busca a mensagem do bolão
  const { data: messageData, isLoading: isLoadingMessages } = useQuery({
    queryKey: poolMessagesQueryKey,
    queryFn: async () => {
      if (!pool?.id) return null;
      const { data, error } = await supabase
        .from('pool_messages')
        .select('message')
        .eq('pool_id', pool.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!pool?.id,
  });

  // Atualiza o estado local quando a mensagem chega do banco
  useMemo(() => {
    if (messageData?.message) {
        setNewMessage(messageData.message);
    } else {
        setNewMessage('');
    }
  }, [messageData]);

  // 2. Salvar Mensagem (Upsert)
  const upsertMessage = useMutation({
    mutationFn: async (text: string) => {
      if (!pool?.id || !user?.id) throw new Error("Dados inválidos.");
      
      const { error } = await supabase
        .from('pool_messages')
        .upsert({ 
            pool_id: pool.id, 
            message: text,
            updated_at: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Mural atualizado!");
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: poolMessagesQueryKey });
    },
    onError: () => toast.error("Erro ao atualizar mural.")
  });

  // 3. Apagar Mensagem
  const deleteMessage = useMutation({
    mutationFn: async () => {
        if (!pool?.id) return;
        const { error } = await supabase.from('pool_messages').delete().eq('pool_id', pool.id);
        if (error) throw error;
    },
    onSuccess: () => {
        toast.success("Recado removido.");
        setNewMessage('');
        setIsEditing(false);
        queryClient.invalidateQueries({ queryKey: poolMessagesQueryKey });
    },
    onError: () => toast.error("Erro ao remover.")
  });

  const isOwner = user?.id === pool?.owner_id;

  // 4. Calcular Estatísticas do Dashboard (Baseado no Ranking carregado)
  const stats = useMemo(() => {
    if (!rankingData || rankingData.length === 0) return null;

    // Filtra IAs e Admins para estatísticas justas
    const validParticipants = rankingData.filter(p => !isAIParticipant(p) && !p.is_admin);
    
    if (validParticipants.length === 0) return null;

    // Maior Pontuador
    const topScorer = validParticipants.reduce((prev, current) => (prev.points > current.points) ? prev : current);
    
    // Rei da Cravada (Mais placares exatos)
    const mostExact = validParticipants.reduce((prev, current) => (prev.exactscores > current.exactscores) ? prev : current);
    
    // Lanterna (Menor pontuação entre quem jogou)
    // Se só tiver 1, ele é tudo. Se tiver mais, pega o último.
    const lastPlace = validParticipants.length > 1 ? validParticipants[validParticipants.length - 1] : null;

    const pointsGap = topScorer.points - (lastPlace?.points || 0);

    return { topScorer, mostExact, lastPlace, pointsGap };
  }, [rankingData]);

  // 5. Processar Pódio (Top 3)
  const topThree = useMemo(() => {
      const valid = rankingData.filter(p => !isAIParticipant(p) && !p.is_admin);
      return valid.slice(0, 3).map((p, i) => ({ ...p, rank: i + 1 }));
  }, [rankingData]);

  return (
    <Card className="shadow-lg border-t-4 border-t-blue-500">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-xl text-fifa-blue">
                <Megaphone className="h-6 w-6 text-fifa-gold"/> Mural do Bolão
            </CardTitle>
            {isOwner && !isEditing && (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2"/> Editar Recado
                </Button>
            )}
        </div>
        <CardDescription>Fique por dentro das novidades e estatísticas.</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        
        {/* ÁREA DE MENSAGEM */}
        {isEditing ? (
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-blue-100 animate-in fade-in">
                <label className="text-sm font-bold text-gray-700">Escreva seu recado:</label>
                <Textarea 
                    placeholder="Ex: Pessoal, o pagamento vence sexta-feira!" 
                    value={newMessage} 
                    onChange={(e) => setNewMessage(e.target.value)} 
                    rows={3}
                    className="bg-white"
                />
                <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancelar</Button>
                    {messageData?.message && (
                        <Button variant="destructive" size="sm" onClick={() => deleteMessage.mutate()} disabled={deleteMessage.isPending}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    )}
                    <Button size="sm" onClick={() => upsertMessage.mutate(newMessage)} disabled={upsertMessage.isPending}>
                        {upsertMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publicar"}
                    </Button>
                </div>
            </div>
        ) : (
            messageData?.message ? (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                    <p className="text-gray-800 italic font-medium">"{messageData.message}"</p>
                    <p className="text-xs text-right text-gray-400 mt-2 font-bold uppercase tracking-wider">- Admin</p>
                </div>
            ) : (
                <p className="text-center text-gray-400 italic py-2 text-sm">Nenhum recado fixado no momento.</p>
            )
        )}

        <Separator />

        {/* ESTATÍSTICAS RÁPIDAS */}
        {isLoadingRanking ? (
            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-fifa-blue"/></div>
        ) : stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <StatBox icon={<Trophy className="text-yellow-500"/>} label="Maior Pontuador" value={stats.topScorer.name} sub={`${stats.topScorer.points} pts`} />
                <StatBox icon={<Star className="text-purple-500"/>} label="Rei da Cravada" value={stats.mostExact.name} sub={`${stats.mostExact.exactscores} exatos`} />
                <StatBox icon={<UserX className="text-red-500"/>} label="Lanterna" value={stats.lastPlace?.name || '-'} sub={stats.lastPlace ? `${stats.lastPlace.points} pts` : '-'} />
                <StatBox icon={<span className="text-xl font-bold text-blue-500">GAP</span>} label="Diferença 1º/Últ." value={stats.pointsGap} sub="pontos" />
            </div>
        )}

        {/* LISTA DE LÍDERES */}
        {topThree.length > 0 && (
            <>
                <Separator />
                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Líderes Atuais</h4>
                    {topThree.map((p, i) => (
                        <div key={p.id} className={cn("flex items-center justify-between p-2 rounded-lg border", i === 0 ? "bg-yellow-50 border-yellow-200" : "bg-white border-gray-100")}>
                            <div className="flex items-center gap-3">
                                <Badge variant={i === 0 ? "default" : "secondary"} className={i===0 ? "bg-yellow-500 hover:bg-yellow-600" : ""}>{i + 1}º</Badge>
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6"><AvatarImage src={p.avatar_url || ''}/><AvatarFallback>{p.name?.substring(0,1)}</AvatarFallback></Avatar>
                                    <span className="font-semibold text-sm text-gray-800">{p.name}</span>
                                </div>
                            </div>
                            <span className="font-bold text-sm text-fifa-blue">{p.points} pts</span>
                        </div>
                    ))}
                </div>
            </>
        )}
      </CardContent>
    </Card>
  );
};

// Componente visual simples para os stats
const StatBox = ({ icon, label, value, sub }: any) => (
    <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-lg border border-slate-100">
        <div className="mb-1">{icon}</div>
        <span className="font-bold text-sm text-gray-800 truncate w-full">{value}</span>
        <span className="text-xs text-gray-500">{sub}</span>
        <span className="text-[10px] uppercase font-bold text-gray-400 mt-1">{label}</span>
    </div>
);

export default NoticeBoard;