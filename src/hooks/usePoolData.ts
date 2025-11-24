import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Define a estrutura que o Dashboard espera receber
export interface PoolStats {
  user_points: number;
  user_rank: number;
  top_scorer: { name: string; points: number } | null;
  most_exact: { name: string; exact_scores: number } | null;
}

const fetchPoolData = async (poolId: string, userId: string): Promise<PoolStats | null> => {
  try {
    // 1. Buscar dados do próprio usuário (Pontos atuais)
    const { data: myData, error: myError } = await supabase
      .from('participations')
      .select('points')
      .eq('pool_id', poolId)
      .eq('user_id', userId)
      .maybeSingle();

    if (myError) throw myError;
    
    const myPoints = myData?.points || 0;

    // 2. Calcular Ranking (Contar quantas pessoas têm mais pontos que eu)
    // Esta count é super rápida no Postgres
    const { count: rankCount, error: rankError } = await supabase
      .from('participations')
      .select('*', { count: 'exact', head: true })
      .eq('pool_id', poolId)
      .gt('points', myPoints);

    if (rankError) throw rankError;
    const myRank = (rankCount || 0) + 1;

    // 3. Buscar Maior Pontuador (Top Scorer)
    const { data: topScorerData, error: topScorerError } = await supabase
      .from('participations')
      .select('points, user:users_custom(name)') // Join com usuário para pegar o nome
      .eq('pool_id', poolId)
      .order('points', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (topScorerError) throw topScorerError;

    // 4. Buscar Rei da Cravada (Most Exact)
    const { data: mostExactData, error: mostExactError } = await supabase
      .from('participations')
      .select('exact_scores, user:users_custom(name)')
      .eq('pool_id', poolId)
      .order('exact_scores', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (mostExactError) throw mostExactError;

    // Montar objeto final
    return {
      user_points: myPoints,
      user_rank: myRank,
      top_scorer: topScorerData ? { 
        name: (topScorerData.user as any)?.name || 'Anônimo', 
        points: topScorerData.points 
      } : null,
      most_exact: mostExactData ? { 
        name: (mostExactData.user as any)?.name || 'Anônimo', 
        exact_scores: mostExactData.exact_scores 
      } : null,
    };

  } catch (error) {
    console.error("Erro ao buscar dados do bolão:", error);
    return null;
  }
};

const usePoolData = (poolIdOverride?: string) => {
  const { activePool, user } = useAuth();
  
  // Garante que temos os IDs necessários
  const targetPoolId = poolIdOverride || activePool?.id;
  const userId = user?.id;

  const { data, isLoading, error } = useQuery({
    // A chave inclui o userId para garantir que atualiza se trocar de conta
    queryKey: ['poolData', targetPoolId, userId],
    queryFn: () => {
      if (!targetPoolId || !userId) return null;
      return fetchPoolData(targetPoolId, userId);
    },
    // Só executa se tivermos um bolão e um usuário definidos
    enabled: !!targetPoolId && !!userId,
  });

  return {
    stats: data || null, 
    loading: isLoading,
    error: error ? (error as Error).message : null,
  };
};

export default usePoolData;