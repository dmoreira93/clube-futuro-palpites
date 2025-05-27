// src/pages/Index.tsx

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import RankingTable from "@/components/home/RankingTable";
import NextMatches from "@/components/home/NextMatches";
// import { DailyPredictions } from "@/components/home/DailyPredictions"; // Comentado se não usado/ajustado
import StatsCard from "@/components/home/StatsCard";
import { Users, Volleyball as SoccerBallIcon, Flag as FlagIcon } from "lucide-react"; // Removido TrophyIcon se não for mais usado
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    matchesPlayed: 0,
    totalMatches: 0,
    // Removido topScorer do estado, pois o card não será mais exibido
    nextMatch: {
      date: "",
      teams: "",
    },
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        // Contar usuários (excluindo administradores)
        const { count: userCount, error: userCountError } = await supabase
          .from('users_custom')
          .select('*', { count: 'exact', head: true })
          .eq('is_admin', false);
        if (userCountError) throw userCountError;

        // Contar partidas finalizadas APENAS da fase de grupos
        const { count: finishedGroupStageMatchCount, error: finishedMatchCountError } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .eq('is_finished', true)
          .eq('stage', 'Fase de Grupos');
        if (finishedMatchCountError) throw finishedMatchCountError;

        // Contar total de partidas APENAS da fase de grupos
        const { count: totalGroupStageMatchCount, error: totalMatchCountError } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .eq('stage', 'Fase de Grupos');
        if (totalMatchCountError) throw totalMatchCountError;

        // Lógica para buscar maior pontuador foi REMOVIDA

        // Buscar próxima partida
        const { data: nextMatchData, error: nextMatchError } = await supabase
          .from('matches')
          .select(`match_date, home_team:home_team_id(name), away_team:away_team_id(name)`)
          .gte('match_date', new Date().toISOString())
          .order('match_date', { ascending: true })
          .limit(1)
          .maybeSingle();

        let nextMatchInfo = { date: "N/A", teams: "Aguardando definição" };
        if (nextMatchError && nextMatchError.code !== 'PGRST116') {
          console.error("Erro ao buscar próxima partida:", nextMatchError);
        } else if (nextMatchData) {
          nextMatchInfo = {
            date: new Date(nextMatchData.match_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            teams: `${nextMatchData.home_team?.name || 'N/A'} vs ${nextMatchData.away_team?.name || 'N/A'}`,
          };
        }

        setStats({
          totalUsers: userCount || 0,
          matchesPlayed: finishedGroupStageMatchCount || 0,
          totalMatches: totalGroupStageMatchCount || 0,
          // Removido topScorer daqui
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
        <h1 className="text-3xl font-bold text-center text-fifa-blue mb-8">Bem-vindo ao Clube Futuro Palpites!</h1>

        {loadingStats ? (
          // Ajustado para 3 colunas de skeleton se o card do Maior Pontuador foi removido
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-300 rounded w-1/2 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Ajustado para 3 colunas de cards
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatsCard
              title="Total de Usuários"
              value={stats.totalUsers}
              icon={<Users className="h-5 w-5" />}
              description="Participantes registrados no bolão"
            />
            <StatsCard
              title="Partidas da Fase de Grupos"
              value={`${stats.matchesPlayed} / ${stats.totalMatches}`}
              icon={<SoccerBallIcon className="h-5 w-5" />}
              description="Jogos da fase de Grupos com resultados"
            />
            {/* Card "Maior Pontuador" REMOVIDO */}
            <StatsCard
              title="Próxima Partida"
              value={stats.nextMatch.date}
              icon={<FlagIcon className="h-5 w-5" />}
              description={stats.nextMatch.teams}
            />
          </div>
        )}

        <div className="text-center mb-8">
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
            {/* <DailyPredictions matches={[]} matchPredictions={[]} onMatchPredictionsChange={() => {}} /> */}

            <div className="hidden lg:block">
              <Card className="shadow-lg">
                <CardHeader>
                  <h3 className="text-lg font-semibold text-fifa-blue">Regras Rápidas</h3>
                </CardHeader>
                <CardContent className="p-6 pt-2">
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2.5 mt-0.5 shrink-0">10</span>
                      <span>Acerto do placar exato da partida.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2.5 mt-0.5 shrink-0">7</span>
                      <span>Acerto de empate (sem acertar o placar).</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2.5 mt-0.5 shrink-0">5</span>
                      <span>Acerto do vencedor da partida (sem acertar o placar).</span>
                    </li>
                     <li className="flex items-start">
                      <span className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2.5 mt-0.5 shrink-0">3</span>
                      <span>Acerto do número de gols de um dos times (errando o vencedor/placar).</span>
                    </li>
                  </ul>
                  <div className="mt-4">
                    <Link to="/criterios">
                      <Button variant="link" className="p-0 text-fifa-blue hover:text-fifa-blue/80">
                        Ver todas as regras →
                      </Button>
                    </Link>
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