// src/pages/Dashboard.tsx - VERSÃO COM BOTÃO CORRIGIDO

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import RankingTable from "@/components/home/RankingTable";
import NextMatches from "@/components/home/NextMatches";
import StatsCard from "@/components/home/StatsCard";
import { Users, Volleyball as SoccerBallIcon, Flag as FlagIcon, Loader2, Settings } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    poolName: "",
    totalUsers: 0,
    matchesPlayed: 0,
    totalMatches: 0,
    nextMatch: { date: "", teams: "" },
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.pool_id) {
        setLoadingStats(false);
        return;
      }
      
      try {
        setLoadingStats(true);

        const { data: poolData, error: poolError } = await supabase
            .from('pools')
            .select('name')
            .eq('id', user.pool_id)
            .single();

        if (poolError) throw poolError;

        const { count: userCount } = await supabase
            .from('users_custom')
            .select('*', { count: 'exact', head: true })
            .eq('is_admin', false)
            .eq('pool_id', user.pool_id);

        const { count: finishedGroupStageMatchCount } = await supabase.from('matches').select('*', { count: 'exact', head: true }).eq('is_finished', true).eq('stage', 'Fase de Grupos');
        const { count: totalGroupStageMatchCount } = await supabase.from('matches').select('*', { count: 'exact', head: true }).eq('stage', 'Fase de Grupos');
        const { data: nextMatchData } = await supabase.from('matches').select(`match_date, home_team:home_team_id(name), away_team:away_team_id(name)`).gte('match_date', new Date().toISOString()).order('match_date', { ascending: true }).limit(1).maybeSingle();
        
        let nextMatchInfo = { date: "N/A", teams: "Aguardando definição" };
        if (nextMatchData) {
          nextMatchInfo = {
            date: new Date(nextMatchData.match_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            teams: `${nextMatchData.home_team?.name || 'N/A'} vs ${nextMatchData.away_team?.name || 'N/A'}`,
          };
        }
        
        setStats({
          poolName: poolData.name || 'Meu Bolão',
          totalUsers: userCount || 0,
          matchesPlayed: finishedGroupStageMatchCount || 0,
          totalMatches: totalGroupStageMatchCount || 0,
          nextMatch: nextMatchInfo,
        });

      } catch (error: any) {
        console.error("ERRO FATAL ao buscar estatísticas do bolão:", error.message);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loadingStats) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-fifa-blue" />
        <span className="ml-4 text-lg">Carregando dados do seu bolão...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-fifa-blue">
              Dashboard do Bolão: <span className="text-gray-700">{stats.poolName}</span>
          </h1>
          <Link to="/pool-settings">
              <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações do Bolão
              </Button>
          </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          <StatsCard
            title="Participantes no Bolão"
            value={stats.totalUsers}
            icon={<Users className="h-5 w-5" />}
            description="Membros neste grupo"
          />
          <StatsCard
            title="Partidas da Fase de Grupos"
            value={`${stats.matchesPlayed} / ${stats.totalMatches}`}
            icon={<SoccerBallIcon className="h-5 w-5" />}
            description="Jogos com resultados"
          />
          <StatsCard
            title="Próxima Partida"
            value={stats.nextMatch.date}
            icon={<FlagIcon className="h-5 w-5" />}
            description={stats.nextMatch.teams}
          />
      </div>

      <div className="text-center mb-8">
        {/* --- CORREÇÃO AQUI --- */}
        <Link to="/palpites-do-dia">
          <Button className="bg-fifa-green hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors duration-300">
            Ver Palpites dos Jogos do Dia
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RankingTable />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-8">
          <NextMatches />
          <div className="hidden lg:block">
            <Card className="shadow-lg">
              <CardHeader>
                <h3 className="text-lg font-semibold text-fifa-blue">Regras Rápidas</h3>
              </CardHeader>
              <CardContent className="p-6 pt-2">
                 <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start"><span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2.5 mt-0.5 shrink-0">10</span><span>Acerto do placar exato.</span></li>
                  <li className="flex items-start"><span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2.5 mt-0.5 shrink-0">7</span><span>Acerto de empate (sem placar exato).</span></li>
                  <li className="flex items-start"><span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2.5 mt-0.5 shrink-0">5</span><span>Acerto do vencedor (sem placar exato).</span></li>
                  <li className="flex items-start"><span className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2.5 mt-0.5 shrink-no">3</span><span>Acerto de gols de um time.</span></li>
                </ul>
                <div className="mt-4">
                  <Link to="/criterios"><Button variant="link" className="p-0 text-fifa-blue hover:text-fifa-blue/80">Ver todas as regras →</Button></Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;