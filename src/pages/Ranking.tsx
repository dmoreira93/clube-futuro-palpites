import { useState, useEffect } from 'react';
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
      // Se o AuthContext ainda está carregando o usuário, esperamos.
      if (authLoading) {
        return;
      }

      // Se o usuário carregado não tem um pool_id, nos avisa.
      if (!user?.pool_id) {
        toast.info("DEBUG: Usuário não tem um 'pool_id' associado.");
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

        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        
        if (data) {
          toast.success("DEBUG: Regras do bolão carregadas com sucesso!");
          setPoolSettings(data);
        } else {
          toast.warning("DEBUG: A busca no banco funcionou, mas não encontrou um bolão com o ID do seu usuário.");
        }

      } catch (error: any) {
        toast.error(`DEBUG: Erro ao buscar no banco: ${error.message}`);
        console.error("Erro ao buscar configurações do bolão:", error);
      } finally {
        setSettingsLoading(false);
      }
    };

    fetchPoolSettings();
  }, [user?.pool_id, authLoading]);

  // A página está carregando se a autenticação OU as configurações estiverem carregando.
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
        Ranking do Bolão: <span className="text-gray-700">{poolSettings?.name || 'Bolão'}</span>
      </h1>
      <div className="max-w-4xl mx-auto">
        <RankingTable poolSettings={poolSettings} />
      </div>
    </div>
  );
};

export default RankingPage;