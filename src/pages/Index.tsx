import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import RankingTable from "@/components/home/RankingTable";
import NextMatches from "@/components/home/NextMatches";
import StatsCard from "@/components/home/StatsCard";
import { Users, Volleyball as SoccerBallIcon, Flag as FlagIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    matchesPlayed: 0,
    totalMatches: 0,
    nextMatch: { date: "", teams: "" },
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const { count: userCount } = await supabase.from('users_custom').select('*', { count: 'exact', head: true }).eq('is_admin', false);
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
          totalUsers: userCount || 0,
          matchesPlayed: finishedGroupStageMatchCount || 0,
          totalMatches: totalGroupStageMatchCount || 0,
          nextMatch: nextMatchInfo,
        });
      } catch (error: any) {
        console.error("Erro ao buscar estatísticas:", error.message);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-center text-fifa-blue mb-8">Bem-vindo ao Clube Futuro Palpites!</h1>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <StatsCard title="Próxima Partida" value={stats.nextMatch.date} icon={<FlagIcon className="h-5 w-5" />} description={stats.nextMatch.teams}/>
            <StatsCard title="Partidas da Fase de Grupos" value={`${stats.matchesPlayed} / ${stats.totalMatches}`} icon={<SoccerBallIcon className="h-5 w-5" />} description="Jogos com resultados"/>
        </div>

        {/* Ranking Table */}
        <div className="mt-8">
          <RankingTable />
        </div>
      </div>
    </Layout>
  );
};

export default Index;