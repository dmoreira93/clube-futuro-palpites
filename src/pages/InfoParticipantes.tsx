import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Target, AlertTriangle, Coffee, ArrowLeft, Crown, Medal, Info } from 'lucide-react';
import { toast } from 'sonner';

interface ParticipantStats {
  user_id: string;
  name: string;
  avatar_url: string | null;
  total_wins: number;
  total_last_place: number;
  total_exact_scores: number;
  is_admin: boolean;
}

const InfoParticipantes = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const { switchPool, activePool } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState<ParticipantStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (poolId) {
      if (activePool?.id !== poolId) {
          switchPool(poolId);
      }
      fetchStats();
    }
  }, [poolId]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      if (!poolId) return;

      // 1. Busca os participantes do bolão ATUAL (quem vamos exibir na tela)
      const { data: currentPoolData, error: currentError } = await supabase
        .from('participations')
        .select(`
          user_id,
          user:users_custom (
            id,
            name,
            username,
            avatar_url,
            is_admin
          )
        `)
        .eq('pool_id', poolId);

      if (currentError) throw currentError;

      // 2. Busca DADOS GERAIS de participações para calcular histórico
      // Precisamos saber se o campeonato do bolão está finalizado para contar vitórias/derrotas
      const { data: allHistoryData, error: historyError } = await supabase
        .from('participations')
        .select(`
          user_id,
          pool_id,
          points,
          exact_scores,
          matches_played,
          pool:pools (
            id,
            championship:championships (
              is_finished
            )
          )
        `);

      if (historyError) throw historyError;

      // --- PROCESSAMENTO DOS DADOS (Cálculo de Campeões e Lanternas) ---
      
      const winsMap: Record<string, number> = {};
      const lastPlaceMap: Record<string, number> = {};
      const totalExactScoresMap: Record<string, number> = {};

      // Agrupa participações por bolão para descobrir quem ganhou cada um
      const participationsByPool: Record<string, any[]> = {};

      (allHistoryData || []).forEach((p: any) => {
        // Acumula Cravadas (Placares Exatos) de TODOS os bolões
        totalExactScoresMap[p.user_id] = (totalExactScoresMap[p.user_id] || 0) + (p.exact_scores || 0);

        // Agrupamento para ranking
        if (!participationsByPool[p.pool_id]) {
            participationsByPool[p.pool_id] = [];
        }
        participationsByPool[p.pool_id].push(p);
      });

      // Para cada bolão, verifica se está finalizado e define 1º e último
      Object.keys(participationsByPool).forEach(pId => {
          const poolParts = participationsByPool[pId];
          const isFinished = poolParts[0]?.pool?.championship?.is_finished === true;

          if (isFinished && poolParts.length > 1) { // Só conta se tiver finalizado e tiver competidores
              // Ordena: Mais pontos > Mais cravadas
              poolParts.sort((a, b) => {
                  if (b.points !== a.points) return b.points - a.points;
                  return b.exact_scores - a.exact_scores;
              });

              // Campeão (1º lugar)
              const winnerId = poolParts[0].user_id;
              winsMap[winnerId] = (winsMap[winnerId] || 0) + 1;

              // Lanterna (Último lugar com jogos jogados)
              // Filtramos quem jogou pelo menos 1 jogo para não punir quem entrou e saiu ou nunca jogou
              const activePlayers = poolParts.filter((p: any) => p.matches_played > 0);
              if (activePlayers.length > 0) {
                  const loserId = activePlayers[activePlayers.length - 1].user_id;
                  lastPlaceMap[loserId] = (lastPlaceMap[loserId] || 0) + 1;
              }
          }
      });

      // 3. Monta o objeto final combinando os participantes atuais com o histórico calculado
      const formattedData: ParticipantStats[] = (currentPoolData || []).map((item: any) => {
          const userId = item.user?.id;
          return {
            user_id: userId || 'unknown',
            name: item.user?.name || 'Participante',
            avatar_url: item.user?.avatar_url,
            total_wins: winsMap[userId] || 0,
            total_last_place: lastPlaceMap[userId] || 0,
            total_exact_scores: totalExactScoresMap[userId] || 0, // Soma total de cravadas na carreira
            is_admin: item.user?.is_admin || false
          };
      });

      setStats(formattedData);

    } catch (error: any) {
      console.error("Erro ao processar estatísticas:", error);
      toast.error("Não foi possível carregar o histórico.");
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  // --- Filtros de Exibição ---
  
  const champions = stats
    .filter(s => s.total_wins > 0)
    .sort((a, b) => b.total_wins - a.total_wins);

  const sharpshooters = stats
    .filter(s => s.total_exact_scores > 0)
    .sort((a, b) => b.total_exact_scores - a.total_exact_scores)
    .slice(0, 5); 

  const punished = stats
    .filter(s => s.total_last_place > 0)
    .sort((a, b) => b.total_last_place - a.total_last_place);
  
  const cafeComLeite = stats
    .filter(s => s.total_wins === 0 && s.total_last_place === 0);

  if (loading) return <InfoSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Cabeçalho */}
        <div className="bg-white border-b border-gray-200 py-8 px-4 shadow-sm">
            <div className="container mx-auto max-w-5xl relative">
                <Button variant="ghost" onClick={() => navigate(-1)} className="absolute left-0 top-1/2 -translate-y-1/2 hidden md:flex text-gray-500 hover:text-fifa-blue">
                    <ArrowLeft className="h-5 w-5 mr-2" /> Voltar
                </Button>
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-fifa-blue flex items-center justify-center gap-3">
                        <Info className="h-8 w-8 text-fifa-gold" /> Hall da Fama
                    </h1>
                    <p className="text-gray-500 mt-2">Curiosidades e estatísticas históricas.</p>
                </div>
            </div>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-5xl space-y-12 flex-grow">
            
            {/* 1. OS CAMPEÕES */}
            <section>
                <h2 className="text-2xl font-bold text-fifa-blue mb-6 flex items-center">
                    <Crown className="mr-3 h-6 w-6 text-yellow-500" /> Campeões de Bolões
                </h2>
                {champions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {champions.map(user => (
                            <Card key={user.user_id} className="border-t-4 border-t-yellow-500 hover:shadow-lg transition-shadow text-center overflow-hidden group">
                                <CardContent className="pt-6 pb-6 flex flex-col items-center relative">
                                    <div className="absolute top-2 right-2">
                                        <Trophy className="h-4 w-4 text-yellow-500 opacity-50" />
                                    </div>
                                    <Avatar className="h-20 w-20 border-4 border-yellow-100 mb-3 shadow-sm group-hover:border-yellow-300 transition-colors">
                                        <AvatarImage src={user.avatar_url || undefined} />
                                        <AvatarFallback className="bg-yellow-50 text-yellow-700 font-bold text-xl">{user.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <h3 className="font-bold text-gray-800 truncate w-full px-2">{user.name}</h3>
                                    <Badge variant="secondary" className="mt-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                                        {user.total_wins} {user.total_wins === 1 ? 'Título' : 'Títulos'}
                                    </Badge>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <EmptyState message="Ninguém ganhou títulos históricos ainda." icon={<Trophy className="h-10 w-10 text-gray-300"/>} />
                )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                
                {/* 2. REIS DA CRAVADA (Top 5) */}
                <section>
                    <h2 className="text-2xl font-bold text-fifa-blue mb-6 flex items-center">
                        <Target className="mr-3 h-6 w-6 text-blue-500" /> Maiores Cravadores
                        <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Histórico Total</span>
                    </h2>
                    <Card>
                        <CardContent className="p-0">
                            {sharpshooters.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {sharpshooters.map((user, index) => (
                                        <div key={user.user_id} className="flex items-center justify-between p-4 hover:bg-blue-50/30 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' : index === 1 ? 'bg-gray-100 text-gray-700' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-white text-gray-400 border border-gray-100'}`}>
                                                    {index + 1}º
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={user.avatar_url || undefined} />
                                                        <AvatarFallback className="bg-gray-100 text-gray-500">{user.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-gray-700">{user.name}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="block font-bold text-blue-600 text-lg">{user.total_exact_scores}</span>
                                                <span className="text-[10px] text-gray-400 uppercase font-bold">Cravadas</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-500">Nenhum placar exato encontrado no histórico.</div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                {/* 3. PAGADORES DE PRENDA */}
                <section>
                    <h2 className="text-2xl font-bold text-fifa-blue mb-6 flex items-center">
                        <AlertTriangle className="mr-3 h-6 w-6 text-red-500" /> Já Pagaram Prenda
                    </h2>
                    <Card className="bg-red-50/30 border-red-100">
                        <CardContent className="p-6">
                            {punished.length > 0 ? (
                                <div className="flex flex-wrap gap-4">
                                    {punished.map(user => (
                                        <div key={user.user_id} className="flex items-center gap-2 bg-white p-2 pr-4 rounded-full border border-red-100 shadow-sm">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.avatar_url || undefined} />
                                                <AvatarFallback className="bg-red-100 text-red-600 font-bold">
                                                    {user.name ? user.name.substring(0, 2).toUpperCase() : "??"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col leading-none">
                                                <span className="text-sm font-bold text-gray-800">{user.name}</span>
                                                <span className="text-[10px] text-red-500 font-medium">{user.total_last_place}x Lanterna</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState message="Por enquanto, todos estão salvos da vergonha." icon={<Medal className="h-8 w-8 text-gray-300"/>} />
                            )}
                        </CardContent>
                    </Card>
                </section>
            </div>

            {/* 4. CAFÉ COM LEITE */}
            <section>
                <h2 className="text-2xl font-bold text-fifa-blue mb-6 flex items-center">
                    <Coffee className="mr-3 h-6 w-6 text-gray-400" /> Turma do "Café com Leite"
                </h2>
                <Card className="bg-gray-50 border-dashed border-2 border-gray-200">
                    <CardContent className="p-6 text-center">
                        <p className="text-gray-500 mb-6 max-w-2xl mx-auto">
                            Estes participantes ainda não ganharam bolões e nem ficaram em último lugar nos campeonatos finalizados.
                        </p>
                        {cafeComLeite.length > 0 ? (
                            <div className="flex flex-wrap justify-center gap-3">
                                {cafeComLeite.map(user => (
                                    <Badge key={user.user_id} variant="outline" className="px-3 py-1 text-gray-600 bg-white border-gray-300 text-sm font-normal">
                                        {user.name}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400">Todos aqui têm história pra contar.</p>
                        )}
                    </CardContent>
                </Card>
            </section>

        </div>
    </div>
  );
};

const EmptyState = ({ message, icon }: { message: string, icon: React.ReactNode }) => (
    <div className="bg-white rounded-lg border border-dashed border-gray-200 p-8 text-center flex flex-col items-center justify-center h-full">
        <div className="bg-gray-50 p-3 rounded-full mb-3">{icon}</div>
        <p className="text-gray-500 text-sm">{message}</p>
    </div>
);

const InfoSkeleton = () => (
    <div className="container mx-auto px-4 py-12 space-y-12">
        <div className="space-y-4"><Skeleton className="h-8 w-64 mx-auto"/><Skeleton className="h-4 w-96 mx-auto"/></div>
        <div className="grid grid-cols-4 gap-6"><Skeleton className="h-48"/><Skeleton className="h-48"/><Skeleton className="h-48"/><Skeleton className="h-48"/></div>
        <div className="grid grid-cols-2 gap-12"><Skeleton className="h-64"/><Skeleton className="h-64"/></div>
    </div>
);

export default InfoParticipantes;