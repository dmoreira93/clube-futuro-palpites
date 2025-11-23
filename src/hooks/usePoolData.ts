// src/hooks/usePoolData.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const fetchPoolData = async (poolId: string | undefined) => {
  if (!poolId) return null;
  
  // A RPC get_pool_data retorna os dados das estatísticas
  const { data, error } = await supabase.rpc('get_pool_data', { p_pool_id: poolId });
  
  if (error) throw new Error(error.message);
  
  // Retorna o objeto completo (que contém 'stats' e 'ranking')
  return (data && data.length > 0) ? data[0] : null;
};

// AGORA ACEITA UM ARGUMENTO OPCIONAL poolIdOverride
const usePoolData = (poolIdOverride?: string) => {
  const { activePool } = useAuth();
  
  // Prioriza o ID que veio por parâmetro (da URL), se não tiver, usa o do contexto
  const targetPoolId = poolIdOverride || activePool?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['poolData', targetPoolId], // A chave reage ao ID correto
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