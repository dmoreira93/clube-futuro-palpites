import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Target, AlertTriangle, Coffee, ArrowLeft, Crown, Medal, Info } from 'lucide-react';

// Tipos para as estatísticas retornadas pela RPC
interface ParticipantStats {
  user_id: string;
  name: string;
  avatar_url: string | null;
  total_wins: number;        // Vezes que foi campeão em bolões finalizados
  total_last_place: number;  // Vezes que foi lanterninha em bolões finalizados
  total_exact_scores: number;// Total de cravadas na história (em todos os bolões)
  is_cafe_com_leite: boolean;// Se nunca ganhou nem perdeu
}

const InfoParticipantes = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const { switchPool } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ParticipantStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (poolId) {
      switchPool(poolId);
      fetchStats();
    }
  }, [poolId, switchPool]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Chama a função RPC que calcula as estatísticas
      const { data, error } = await supabase.rpc('get_pool_participants_stats', { p_pool_id: poolId });

      if (error) throw error;
      
      // Se a função ainda não existir ou retornar nulo, usamos um array vazio para não quebrar a tela
      setStats(data || []);

    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      // Em caso de erro (ex: função não criada), não mostramos nada ou dados vazios
      setStats([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtros para as categorias
  const champions = stats.filter(s => s.total_wins > 0).sort((a, b) => b.total_wins - a.total_wins);
  const sharpshooters = stats.filter(s => s.total_exact_scores > 0).sort((a, b) => b.total_exact_scores - a.total_exact_scores).slice(0, 5); // Top 5
  const punished = stats.filter(s => s.total_last_place > 0).sort((a, b) => b.total_last_place - a.total_last_place);
  
  // Café com leite: quem tem 0 vitórias E 0 derrotas E participa do bolão
  const cafeComLeite = stats.filter(s => s.total_wins === 0 && s.total_last_place === 0);

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
                        <Info className="h-8 w-8 text-fifa-gold" /> Hall da Fama (e da Vergonha)
                    </h1>
                    <p className="text-gray-500 mt-2">Curiosidades históricas sobre os participantes deste bolão.</p>
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
                                        <AvatarFallback className="bg-yellow-50 text-yellow-700 font-bold text-xl">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
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
                    <EmptyState message="Ninguém aqui ganhou um bolão ainda. A chance é agora!" icon={<Trophy className="h-10 w-10 text-gray-300"/>} />
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
                                                        <AvatarFallback className="bg-gray-100 text-gray-500">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
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
                                <div className="p-8 text-center text-gray-500">Nenhum dado de placar exato encontrado.</div>
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
                                                <AvatarFallback className="bg-red-100 text-red-600">{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col leading-none">
                                                <span className="text-sm font-bold text-gray-700">{user.name}</span>
                                                <span className="text-[10px] text-red-500 font-medium">{user.total_last_place}x Lanterninha</span>
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
                            Estes participantes nunca sentiram o gosto da vitória (1º lugar), mas também nunca amargaram a lanterna. Estão ali, no meio da tabela, vivendo perigosamente na mediocridade.
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
                            <p className="text-sm text-gray-400">Todos aqui têm história pra contar (ou não há dados suficientes).</p>
                        )}
                    </CardContent>
                </Card>
            </section>

        </div>
    </div>
  );
};

// Componentes Auxiliares
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