// src/hooks/useMyPools.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { Pool } from '../types/matches';

export function useMyPools() {
  const { user } = useAuth();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPools = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Buscar os IDs dos bolões que o usuário participa
      const { data: participationData, error: participationError } = await supabase
        .from('participations')
        .select('pool_id')
        .eq('user_id', user.id);

      if (participationError) throw participationError;

      const poolIds = participationData.map(p => p.pool_id);

      if (poolIds.length === 0) {
        setPools([]);
        return;
      }

      // 2. Buscar os detalhes desses bolões
      const { data: poolsData, error: poolsError } = await supabase
        .from('pools')
        .select('*')
        .in('id', poolIds);

      if (poolsError) throw poolsError;

      setPools(poolsData || []);
    } catch (err: any) {
      setError(err);
      console.error("Erro ao buscar bolões:", err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPools();
  }, [fetchPools]);

  return { pools, loading, error, refetch: fetchPools };
}