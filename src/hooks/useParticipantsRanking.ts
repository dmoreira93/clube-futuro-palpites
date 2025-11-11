// src/hooks/useParticipantsRanking.ts (VERSÃO MELHORADA E SEGURA)

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from "@/contexts/AuthContext";

// Usando a sua interface original para não quebrar nada
export interface Participant {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  points: number;
  is_admin: boolean;
  matchesplayed: number;
  scored_matches: number;
  exactscores: number;
  rank?: number;
  accuracy?: string;
  prize?: string | null;
}

// A função de busca agora é externa ao hook principal
const fetchRanking = async (poolId: string | undefined): Promise<Participant[]> => {
  // Se não houver poolId, retorna um array vazio.
  if (!poolId) {
    return [];
  }

  const { data, error: rpcError } = await supabase.rpc('get_pool_ranking', {
    p_pool_id: poolId,
  });

  if (rpcError) {
    console.error("Erro ao buscar ranking via RPC:", rpcError);
    throw new Error(rpcError.message);
  }
  
  // Mantendo sua formatação de dados original
  const formattedData = data.map((p: any) => ({
      ...p, 
      points: p.total_points || 0
  }));

  return formattedData as Participant[];
};


// O hook agora é mais simples e usa useQuery
const useParticipantsRanking = () => {
  const { activePool } = useAuth();

  const { 
    data: participants = [], // Valor padrão para evitar 'undefined'
    isLoading: loading, 
    error 
  } = useQuery<Participant[], Error>({
    // A chave da query inclui o activePool.id para que os dados sejam recarregados se o bolão mudar
    queryKey: ['poolRanking', activePool?.id], 
    // A função que será executada
    queryFn: () => fetchRanking(activePool?.id),
    // A query só será ativada se activePool.id existir
    enabled: !!activePool?.id, 
  });

  return { participants, loading, error: error ? error.message : null };
};

export default useParticipantsRanking;