// src/pages/Dashboard.tsx (VERSÃO ATUALIZADA)

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import RankingTable from "@/components/home/RankingTable";
import NextMatches from "@/components/home/NextMatches";
import StatsCard from "@/components/home/StatsCard";
import { Users, Volleyball as SoccerBallIcon, Flag as FlagIcon, Loader2, Settings, BellRing } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Pool } from "@/types/matches";
import { subscribeUserToPush } from "@/utils/push";
import { toast } from "sonner";
import NoticeBoard from "@/components/dashboard/NoticeBoard"; // NOVO
import PaymentManagement from "@/components/dashboard/PaymentManagement"; // NOVO

const Dashboard = () => {
  const { user, pool, loading: authLoading } = useAuth(); // Pegando o 'pool' do contexto
  const [stats, setStats] = useState({
    totalUsers: 0,
    matchesPlayed: 0,
    totalMatches: 0,
    nextMatch: { date: "", teams: "" },
  });
  const [loading, setLoading] = useState(true);

  const handleSubscribe = async () => {
    if (!user) {
        toast.error("Você precisa estar logado para ativar as notificações.");
        return;
    }
    await subscribeUserToPush(user.id);
  };
  
  const fetchData = useCallback(async () => {
    if (!user?.pool_id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Simplificando as chamadas, já que o pool agora vem do contexto
      const [
        userCountData,
        finishedMatchesData,
        totalMatchesData,
        nextMatchReqData
      ] = await Promise.all([
        supabase.from('users_custom').select('*', { count: 'exact', head: true }).eq('is_admin', false).eq('pool_id', user.pool_id),
        supabase.from('matches').select('*', { count: 'exact', head: true }).eq('is_finished', true).eq('stage', 'Fase de Grupos'),
        supabase.from('matches').select('*', { count: 'exact', head: true }).eq('stage', 'Fase de Grupos'),
        supabase.from('matches').select(`match_date, home_team:home_team_id(name), away_team:away_team_id(name)`).gte('match_date', new Date().toISOString()).order('match_date', { ascending: true }).limit(1).maybeSingle()
      ]);

      let nextMatchInfo = { date: "N/A", teams: "Aguardando definição" };
      if (nextMatchReqData.data) {
        nextMatchInfo = {
          date: new Date(nextMatchReqData.data.match_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          teams: `${nextMatchReqData.data.home_team?.name || 'N/A'} vs ${nextMatchReqData.data.away_team?.name || 'N/A'}`,
        };
      }
      
      setStats({
        totalUsers: userCountData.count || 0,
        matchesPlayed: finishedMatchesData.count || 0,
        totalMatches: totalMatchesData.count || 0,
        nextMatch: nextMatchInfo,
      });

    } catch (error: any) {
      console.error("ERRO FATAL ao buscar estatísticas do bolão:", error.message);
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
  
  const isOwner = user?.id === pool?.owner_id;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-fifa-blue">
            Dashboard: <span className="text-gray-700 dark:text-gray-300">{pool?.name || 'Meu Bolão'}</span>
          </h1>
          <Link to="/pool-settings">
              <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações do Bolão
              </Button>
          </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <StatsCard title="Participantes no Bolão" value={stats.totalUsers} icon={<Users className="h-5 w-5" />} description="Membros neste grupo" />
          <StatsCard title="Partidas da Fase de Grupos" value={`${stats.matchesPlayed} / ${stats.totalMatches}`} icon={<SoccerBallIcon className="h-5 w-5" />} description="Jogos com resultados" />
          <StatsCard title="Próxima Partida" value={stats.nextMatch.date} icon={<FlagIcon className="h-5 w-5" />} description={stats.nextMatch.teams} />
      </div>

      {/* NOVO: Inserção do NoticeBoard */}
      <div className="mb-8">
        <NoticeBoard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RankingTable />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-8">
          <NextMatches />
          
          {/* NOVO: Condicional para exibir a Gestão de Pagamentos */}
          {isOwner && pool?.payment_required && (
              <PaymentManagement />
          )}

          <Card className="shadow-lg">
              <CardHeader className="bg-fifa-blue text-white">
                <div className="flex items-center gap-2">
                    <BellRing className="h-5 w-5 text-fifa-gold" />
                    <CardTitle>Notificações</CardTitle>
                </div>
                <CardDescription className="text-gray-300">Seja avisado sobre os resultados</CardDescription>
              </CardHeader>
              <CardContent className="p-6 text-center">
                   <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                     Clique no botão para permitir o envio de notificações e não perder nenhuma atualização de pontos!
                   </p>
                   <Button onClick={handleSubscribe} className="w-full bg-fifa-blue hover:bg-opacity-90">
                     Ativar Notificações
                   </Button>
              </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;