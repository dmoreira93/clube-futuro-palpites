// src/hooks/usePoolData.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Participant } from '@/hooks/useParticipantsRanking'; // Reutilizaremos este tipo

const fetchPoolData = async (poolId: string | undefined) => {
  if (!poolId) return null;
  const { data, error } = await supabase.rpc('get_pool_data', { p_pool_id: poolId });
  if (error) throw new Error(error.message);
  return data;
};

const usePoolData = () => {
  const { pool } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ['poolData', pool?.id],
    queryFn: () => fetchPoolData(pool?.id),
    enabled: !!pool?.id,
  });

  return {
    ranking: (data?.ranking || []) as Participant[],
    stats: data?.stats,
    loading: isLoading,
    error: error?.message || null,
  };
};

export default usePoolData;