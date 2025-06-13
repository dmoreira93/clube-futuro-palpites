import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import RankingTable from '@/components/home/RankingTable';
import { Loader2 } from 'lucide-react';
import { Pool } from '@/types/matches';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import NextMatches from '@/components/home/NextMatches';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [poolSettings, setPoolSettings] = useState<Pool | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    const fetchPoolSettings = async () => {
      if (authLoading || !user?.pool_id) {
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
        setPoolSettings(data);
      } catch (error: any) {
        // Silencioso no dashboard para não poluir
        console.error("Erro ao buscar configurações do bolão no dashboard:", error);
      } finally {
        setSettingsLoading(false);
      }
    };

    fetchPoolSettings();
  }, [user?.pool_id, authLoading]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-fifa-blue" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
      {/* SEÇÃO DE BOAS-VINDAS RESTAURADA */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-fifa-blue">
          Bem-vindo ao Bolão, <span className="text-gray-800 dark:text-gray-200">{user?.name || user?.email}!</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Confira o ranking e seus próximos palpites.
        </p>
      </div>

      {/* SEÇÃO DE PRÓXIMOS JOGOS (Exemplo de outro item) */}
      <Card>
          <CardHeader>
              <CardTitle>Seus Próximos Palpites</CardTitle>
              <CardDescription>Estes são os próximos jogos para os quais você ainda não palpitou.</CardDescription>
          </CardHeader>
          <CardContent>
              <NextMatches userId={user?.id} />
          </CardContent>
      </Card>
      
      {/* SEÇÃO DO RANKING */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking Parcial</CardTitle>
          <CardDescription>A classificação atualizada do seu bolão.</CardDescription>
        </CardHeader>
        <CardContent>
          {settingsLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <RankingTable poolSettings={poolSettings} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;