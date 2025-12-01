import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PoolStats {
  user_points: number;
  user_rank: number;
  top_scorer: { name: string; points: number } | null;
  most_exact: { name: string; exact_scores: number } | null;
}

const fetchPoolData = async (poolId: string, userId: string): Promise<PoolStats | null> => {
  try {
    // 1. Buscar dados do próprio usuário
    const { data: myData, error: myError } = await supabase
      .from('participations')
      .select('points')
      .eq('pool_id', poolId)
      .eq('user_id', userId)
      .maybeSingle();

    if (myError) throw myError;
    const myPoints = myData?.points || 0;

    // 2. Calcular Ranking (ignorando apenas quem tem mais pontos, filtro visual é feito no front)
    // Nota: Para precisão total, deveríamos filtrar IAs aqui também, mas o count simples é mais rápido
    const { count: rankCount, error: rankError } = await supabase
      .from('participations')
      .select('*', { count: 'exact', head: true })
      .eq('pool_id', poolId)
      .gt('points', myPoints);

    if (rankError) throw rankError;
    const myRank = (rankCount || 0) + 1;

    // 3. Buscar Maior Pontuador (HUMANO APENAS)
    // Usamos !inner para garantir que o filtro se aplique ao join
    const { data: topScorerData, error: topScorerError } = await supabase
      .from('participations')
      .select('points, user:users_custom!inner(name, is_ai, is_admin)') 
      .eq('pool_id', poolId)
      .eq('user.is_ai', false)     // Filtra IA
      .eq('user.is_admin', false)  // Filtra Admin
      .order('points', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (topScorerError) console.warn("Erro ao buscar top scorer:", topScorerError);

    // 4. Buscar Rei da Cravada (HUMANO APENAS)
    const { data: mostExactData, error: mostExactError } = await supabase
      .from('participations')
      .select('exact_scores, user:users_custom!inner(name, is_ai, is_admin)')
      .eq('pool_id', poolId)
      .eq('user.is_ai', false)     // Filtra IA
      .eq('user.is_admin', false)  // Filtra Admin
      .order('exact_scores', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (mostExactError) console.warn("Erro ao buscar most exact:", mostExactError);

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
  const targetPoolId = poolIdOverride || activePool?.id;
  const userId = user?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['poolData', targetPoolId, userId],
    queryFn: () => {
      if (!targetPoolId || !userId) return null;
      return fetchPoolData(targetPoolId, userId);
    },
    enabled: !!targetPoolId && !!userId,
  });

  return {
    stats: data || null, 
    loading: isLoading,
    error: error ? (error as Error).message : null,
  };
};

export default usePoolData;