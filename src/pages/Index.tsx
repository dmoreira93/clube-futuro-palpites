import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import RankingTable from "@/components/home/RankingTable";
import NextMatches from "@/components/home/NextMatches";
import DailyPredictions from "@/components/home/DailyPredictions"; // Este componente mostra os palpites do usuário logado
import StatsCard from "@/components/home/StatsCard";
import { Trophy as TrophyIcon, User as UserIcon, Volleyball as SoccerBallIcon, Flag as FlagIcon, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom"; // Certifique-se de que Link está importado

const Index = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    matchesPlayed: 0,
    totalMatches: 0,
    topScore: {
      points: 0,
      userName: ""
    },
    nextMatch: {
      date: "",
      teams: ""
    }
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Contar usuários
        const { count: userCount, error: userCountError } = await supabase
          .from('users_custom')
          .select('*', { count: 'exact', head: true });
        if (userCountError) throw userCountError;

        // Contar partidas realizadas
        const { count: finishedMatchCount, error: finishedMatchCountError } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .eq('is_finished', true);
        if (finishedMatchCountError) throw finishedMatchCountError;

        // Contar total de partidas
        const { count: totalMatchCount, error: totalMatchCountError } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true });
        if (totalMatchCountError) throw totalMatchCountError;

        // Buscar pontuação máxima
        const { data: topUserPoints, error: topUserPointsError } = await supabase
          .from('user_points')
          .select('points, user_id, users_custom(name)')
          .order('points', { ascending: false })
          .limit(1);
        
        let topScore = { points: 0, userName: "" };
        if (topUserPoints && topUserPoints.length > 0) {
          const user = topUserPoints[0].users_custom as { name: string } | null;
          topScore = {
            points: topUserPoints[0].points || 0,
            userName: user?.name || "N/A"
          };
        }
        if (topUserPointsError) console.error("Erro ao buscar pontuação máxima:", topUserPointsError);


        // Buscar próxima partida (exemplo, você pode ajustar a lógica de filtro)
        const { data: nextMatchData, error: nextMatchError } = await supabase
          .from('matches')
          .select('match_date, home_team (name), away_team (name)')
          .gte('match_date', new Date().toISOString()) // Apenas partidas futuras
          .order('match_date', { ascending: true })
          .limit(1)
          .single();

        let nextMatch = { date: "", teams: "" };
        if (nextMatchData) {
          nextMatch = {
            date: new Date(nextMatchData.match_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            teams: `${nextMatchData.home_team?.name || 'N/A'} vs ${nextMatchData.away_team?.name || 'N/A'}`
          };
        }
        if (nextMatchError && nextMatchError.code !== 'PGRST116') { // PGRST116 é "No rows found", não é um erro para nós aqui
          console.error("Erro ao buscar próxima partida:", nextMatchError);
        }

        setStats({
          totalUsers: userCount || 0,
          matchesPlayed: finishedMatchCount || 0,
          totalMatches: totalMatchCount || 0,
          topScore: topScore,
          nextMatch: nextMatch
        });
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center text-fifa-blue mb-8">Bem-vindo ao Clube Futuro Palpites!</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total de Usuários"
            value={stats.totalUsers}
            icon={<Users className="h-5 w-5" />}
            description="Participantes registrados no bolão"
          />
          <StatsCard
            title="Partidas Finalizadas"
            value={`${stats.matchesPlayed} / ${stats.totalMatches}`}
            icon={<SoccerBallIcon className="h-5 w-5" />}
            description="Jogos com resultados registrados"
          />
          <StatsCard
            title="Maior Pontuação"
            value={stats.topScore.points}
            icon={<TrophyIcon className="h-5 w-5" />}
            description={`Maior pontuação até agora, de ${stats.topScore.userName}`}
          />
          <StatsCard
            title="Próxima Partida"
            value={stats.nextMatch.date || "N/A"}
            icon={<FlagIcon className="h-5 w-5" />}
            description={stats.nextMatch.teams || "Aguardando definição"}
          />
        </div>

        {/* NOVO BOTÃO AQUI para a tela de palpites do dia */}
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
            <DailyPredictions /> {/* Mantido o componente DailyPredictions aqui, se ele for para o usuário logado fazer/ver seus palpites do dia */}

            {/* Regras Rápidas */}
            <div className="hidden lg:block"> {/* Oculta em telas menores */}
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 text-fifa-blue">Regras Rápidas</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="bg-fifa-gold text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">10</span>
                      <span>Acerto do vencedor e placar</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-fifa-blue text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">7</span>
                      <span>Acerto apenas do vencedor</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-fifa-green text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
                      <span>Acerto parcial (placar de um time)</span>
                    </li>
                  </ul>
                  <div className="mt-4">
                    <Link to="/criterios">
                      <Button variant="link" className="p-0 text-fifa-blue">
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