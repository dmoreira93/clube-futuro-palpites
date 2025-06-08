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

        {/* Layout dos Cards de Estatísticas com Lógica Responsiva */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            {/* Card "Total de Usuários" - Aparece apenas em telas de desktop (md ou maior) */}
            <div className="hidden md:block">
              <StatsCard
                title="Total de Usuários"
                value={stats.totalUsers}
                icon={<Users className="h-5 w-5" />}
                description="Participantes registrados no bolão"
              />
            </div>

            {/* Estes dois cards aparecem em todas as telas, mas o grid se ajusta */}
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

        {/* Layout principal da página com duas colunas no desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RankingTable />
          </div>
          <div className="lg:col-span-1 flex flex-col gap-8">
            {/* O componente NextMatches foi movido para cá para o layout de 2 colunas no desktop */}
            <NextMatches />
            
            {/* Card de Regras Rápidas - Aparece apenas no desktop */}
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
    </Layout>
  );
};

export default Index;