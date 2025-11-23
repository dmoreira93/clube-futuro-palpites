import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const fetchPoolData = async (poolId: string | undefined) => {
  if (!poolId) return null;
  
  // Chama a função no banco para pegar as estatísticas
  const { data, error } = await supabase.rpc('get_pool_data', { p_pool_id: poolId });
  
  if (error) {
      console.error("Erro no fetchPoolData:", error);
      throw new Error(error.message);
  }
  
  // Retorna o objeto de dados
  return (data && data.length > 0) ? data[0] : null;
};

// O hook aceita um ID opcional para forçar a busca de um bolão específico
const usePoolData = (poolIdOverride?: string) => {
  const { activePool } = useAuth();
  
  // Usa o ID da URL (se passado) ou o do contexto
  const targetPoolId = poolIdOverride || activePool?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['poolData', targetPoolId],
    queryFn: () => fetchPoolData(targetPoolId),
    enabled: !!targetPoolId,
  });

  return {
    stats: data?.stats || null, 
    loading: isLoading,
    error: error?.message || null,
  };
};

export default usePoolData;