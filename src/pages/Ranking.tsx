import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import RankingTable from '@/components/home/RankingTable';
import { Loader2 } from 'lucide-react';
import { Pool } from '@/types/matches';
import { toast } from 'sonner';

const RankingPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [poolSettings, setPoolSettings] = useState<Pool | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    const fetchPoolSettings = async () => {
      if (!user?.pool_id) {
        setSettingsLoading(false);
        return;
      }
      
      setSettingsLoading(true);
      try {
        console.log(`DEBUG: Iniciando busca pelo bolão com pool_id: ${user.pool_id}`);
        
        const { data, error } = await supabase
          .from('pools')
          .select('*')
          .eq('id', user.pool_id)
          .single();

        // LINHA DE DIAGNÓSTICO CRÍTICA
        console.log('DEBUG: Resultado da busca pelo bolão (pools):', { data, error });

        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (data) {
          setPoolSettings(data);
        } else {
          toast.info("As configurações do seu bolão ainda não foram definidas.");
        }

      } catch (error: any) {
        toast.error("Erro ao carregar as configurações do bolão.");
        console.error("Erro ao buscar configurações do bolão:", error);
      } finally {
        setSettingsLoading(false);
      }
    };

    if (!authLoading) {
      fetchPoolSettings();
    }
  }, [user?.pool_id, authLoading]);

  if (authLoading || settingsLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-fifa-blue" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center text-fifa-blue mb-6">
        Ranking do Bolão: <span className="text-gray-700">{poolSettings?.name || 'Bolão sem nome'}</span>
      </h1>
      <div className="max-w-4xl mx-auto">
        <RankingTable poolSettings={poolSettings} />
      </div>
    </div>
  );
};

export default RankingPage;