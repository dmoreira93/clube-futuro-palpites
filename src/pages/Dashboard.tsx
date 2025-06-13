import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import RankingTable from '@/components/home/RankingTable';
import NextMatches from '@/components/home/NextMatches';
import { Loader2, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Pool } from '@/types/matches';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [poolSettings, setPoolSettings] = useState<Pool | null>(null);
  const [loading, setLoading] = useState(true);

  // Hook unificado para buscar todas as informações do bolão
  const fetchData = useCallback(async () => {
    if (!user?.pool_id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      // Busca as configurações do bolão (prêmios, nome, etc.)
      const { data: poolData, error: poolError } = await supabase
        .from('pools')
        .select('*')
        .eq('id', user.pool_id)
        .single();

      if (poolError && poolError.code !== 'PGRST116') throw poolError;
      setPoolSettings(poolData);

    } catch (error) {
      console.error("ERRO FATAL ao buscar dados do bolão:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.pool_id]);

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, fetchData]);

  if (authLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-fifa-blue" />
        <span className="ml-4 text-lg">Carregando dados do seu bolão...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Cabeçalho com nome do bolão e botão de configurações */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-fifa-blue">
            Dashboard: <span className="text-gray-700 dark:text-gray-300">{poolSettings?.name || 'Meu Bolão'}</span>
          </h1>
          <Link to="/pool-settings">
              <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações do Bolão
              </Button>
          </Link>
      </div>

      {/* Cards de Próximos Jogos */}
      <Card>
        <CardHeader>
            <CardTitle>Seus Próximos Palpites</CardTitle>
            <CardDescription>Estes são os próximos jogos para os quais você ainda não palpitou.</CardDescription>
        </CardHeader>
        <CardContent>
            <NextMatches userId={user?.id} />
        </CardContent>
      </Card>
      
      {/* Card do Ranking */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking Parcial</CardTitle>
          <CardDescription>A classificação atualizada do seu bolão.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Passando as configurações para a tabela de ranking */}
          <RankingTable poolSettings={poolSettings} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;