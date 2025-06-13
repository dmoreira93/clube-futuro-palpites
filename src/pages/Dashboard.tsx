import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import RankingTable from '@/components/home/RankingTable';
import { Loader2 } from 'lucide-react';
import { Pool } from '@/types/matches'; // Importar o tipo Pool
import { toast } from 'sonner';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [poolSettings, setPoolSettings] = useState<Pool | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Lógica para buscar as configurações do bolão - a mesma da página de Ranking
  useEffect(() => {
    const fetchPoolSettings = async () => {
      if (!user?.pool_id) {
        setSettingsLoading(false);
        return;
      }
      
      setSettingsLoading(true);
      try {
        const { data, error } = await supabase
          .from('pools')
          .select('*')
          .eq('id', user.pool_id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
          setPoolSettings(data);
        }
      } catch (error: any) {
        toast.error("Erro ao carregar as configurações do bolão no dashboard.");
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
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-fifa-blue">
          Bem-vindo ao Bolão, <span className="text-gray-800 dark:text-gray-200">{user?.name || user?.email}!</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Confira o ranking atual e faça seus palpites para os próximos jogos.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-center mb-4">Ranking Parcial</h2>
        {/* Agora passamos as poolSettings para a tabela do dashboard */}
        <RankingTable poolSettings={poolSettings} />
      </div>
    </div>
  );
};

export default Dashboard;