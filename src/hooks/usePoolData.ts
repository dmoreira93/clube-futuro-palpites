// src/hooks/usePoolData.ts (VERSÃO CORRIGIDA)

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const fetchPoolData = async (poolId: string | undefined) => {
  if (!poolId) return null;
  
  const { data, error } = await supabase.rpc('get_pool_data', { p_pool_id: poolId });
  
  if (error) throw new Error(error.message);
  
  // Retorna o objeto completo (que contém 'stats' e 'ranking')
  return (data && data.length > 0) ? data[0] : null;
};

const usePoolData = () => {
  const { pool } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['poolData', pool?.id],
    queryFn: () => fetchPoolData(pool?.id),
    enabled: !!pool?.id,
  });

  return {
    // AQUI ESTÁ A CORREÇÃO:
    // Acessamos a propriedade .stats de dentro do objeto retornado
    stats: data?.stats || null, 
    loading: isLoading,
    error: error?.message || null,
  };
};

export default usePoolData;