import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import RankingTable from '@/components/home/RankingTable';
import { Loader2 } from 'lucide-react';
import { Pool } from '@/types/matches';
import { toast } from 'sonner';

const RankingPage = () => {
  const { user, loading: authLoading } = useAuth(); // Pegamos o 'loading' do AuthContext
  const [poolSettings, setPoolSettings] = useState<Pool | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    const fetchPoolSettings = async () => {
      // A função só prossegue se tivermos um pool_id.
      if (!user?.pool_id) {
        // Se não tiver, apenas aguardamos. O AuthContext irá atualizar o user e disparar o efeito novamente.
        setSettingsLoading(false); // Já podemos parar de carregar as configurações.
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
          setPoolSettings(data);
        } else {
          // Isso pode acontecer se o pool_id do usuário não for válido.
          toast.error("Não foi possível encontrar as configurações do seu bolão. Verifique se você está no bolão correto.");
        }

      } catch (error: any) {
        toast.error("Erro ao carregar as configurações do bolão.");
        console.error("Erro ao buscar configurações do bolão:", error);
      } finally {
        setSettingsLoading(false);
      }
    };

    // O useEffect agora depende diretamente do pool_id.
    // Ele só será executado quando authLoading for false e o pool_id estiver disponível.
    if (!authLoading) {
      fetchPoolSettings();
    }
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
        Ranking do Bolão: <span className="text-gray-700">{poolSettings?.name || 'Bolão sem nome'}</span>
      </h1>
      <div className="max-w-4xl mx-auto">
        <RankingTable poolSettings={poolSettings} />
      </div>
    </div>
  );
};

export default RankingPage;