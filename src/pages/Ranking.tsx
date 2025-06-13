import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import RankingTable from '@/components/home/RankingTable';
import { Loader2 } from 'lucide-react';
import { Pool } from '@/types/matches';
import { toast } from 'sonner';

const RankingPage = () => {
  const { user } = useAuth();
  const [poolSettings, setPoolSettings] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPoolSettings = useCallback(async () => {
    if (!user?.pool_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pools')
        .select('*')
        .eq('id', user.pool_id)
        .single();
      
      // --- LINHAS DE DEBUG ADICIONADAS ---
      console.log('DEBUG: Resultado da busca pelo bolão (pools):', { data, error });
      // ------------------------------------

      if (error) throw error;
      setPoolSettings(data);
    } catch (error: any) {
      toast.error("Não foi possível carregar as configurações do bolão.");
      console.error("Erro ao buscar configurações do bolão:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.pool_id]);

  useEffect(() => {
    fetchPoolSettings();
  }, [fetchPoolSettings]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-fifa-blue" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center text-fifa-blue mb-6">
        Ranking do Bolão: <span className="text-gray-700">{poolSettings?.name || '...'}</span>
      </h1>
      <div className="max-w-4xl mx-auto">
        <RankingTable poolSettings={poolSettings} />
      </div>
    </div>
  );
};

export default RankingPage;