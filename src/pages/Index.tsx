import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import RankingTable from "@/components/home/RankingTable";
import NextMatches from "@/components/home/NextMatches";
import DailyPredictions from "@/components/home/DailyPredictions";
import StatsCard from "@/components/home/StatsCard";
import { Trophy as TrophyIcon, User as UserIcon, Volleyball as SoccerBallIcon, Flag as FlagIcon, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

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

        // Buscar usuário com maior pontuação
        // Esta é a query que estava causando o 406. 
        // A política RLS já foi confirmada, então a causa provável é a falta de dados ou o .single() com 0 resultados.
        const { data: topScoreUser, error: topScoreUserError } = await supabase
          .from('user_stats')
          .select('total_points, user_id')
          .order('total_points', { ascending: false })
          .limit(1)
          .single(); // Mantém o .single()

        if (topScoreUserError) {
          // Logar o erro, mas não impedir o carregamento da página inteira
          console.error("Erro ao buscar o usuário com maior pontuação da tabela user_stats:", topScoreUserError);
          // Podemos definir valores padrão ou vazios para topScore caso haja erro
        }

        let topUserName = "Não disponível";
        if (topScoreUser) {
          // Buscar o nome do usuário a partir do user_id obtido de user_stats
          const { data: userData, error: userDataError } = await supabase
            .from('users_custom')
            .select('name')
            .eq('id', topScoreUser.user_id)
            .single();
          
          if (userDataError) {
            console.error("Erro ao buscar nome do usuário com maior pontuação:", userDataError);
          }
          
          if (userData) {
            topUserName = userData.name;
          }
        }

        // Buscar próxima partida
        const now = new Date().toISOString();
        const { data: nextMatchData, error: nextMatchDataError } = await supabase
          .from('matches')
          .select('id, match_date, home_team_id, away_team_id')
          .gt('match_date', now)
          .eq('is_finished', false)
          .order('match_date')
          .limit(1)
          .single();

        if (nextMatchDataError && nextMatchDataError.code !== 'PGRST116') { // PGRST116 é para "não encontrado" (No rows found)
            console.error("Erro ao buscar próxima partida:", nextMatchDataError);
        }

        let nextMatchInfo = {
          date: "Não agendado",
          teams: "Não definido"
        };

        if (nextMatchData) {
          const matchDate = new Date(nextMatchData.match_date);
          const formattedDate = `${matchDate.getDate().toString().padStart(2, '0')}/${(matchDate.getMonth() + 1).toString().padStart(2, '0')}`;

          const { data: homeTeam, error: homeTeamError } = await supabase
            .from('teams')
            .select('name')
            .eq('id', nextMatchData.home_team_id)
            .single();
          if (homeTeamError) console.error("Erro ao buscar home team:", homeTeamError);

          const { data: awayTeam, error: awayTeamError } = await supabase
            .from('teams')
            .select('name')
            .eq('id', nextMatchData.away_team_id)
            .single();
          if (awayTeamError) console.error("Erro ao buscar away team:", awayTeamError);

          nextMatchInfo = {
            date: formattedDate,
            teams: `${homeTeam?.name || 'Time A'} vs ${awayTeam?.name || 'Time B'}`
          };
        }

        setStats({
          totalUsers: userCount || 0,
          matchesPlayed: finishedMatchCount || 0,
          totalMatches: totalMatchCount || 0,
          topScore: {
            points: topScoreUser?.total_points || 0,
            userName: topUserName
          },
          nextMatch: nextMatchInfo
        });
      } catch (error) {
        console.error("Erro geral ao buscar estatísticas:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <Layout>
      <div className="mb-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-fifa-blue mb-2">
            Copa Mundial de Clubes FIFA 2025
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Participe do nosso bolão e teste seus conhecimentos sobre futebol mundial!
          </p>
        </div>

        <div className="bg-gradient-to-r from-fifa-blue to-fifa-green rounded-lg shadow-xl p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-3/5 mb-6 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">Mostre que você entende de futebol!</h2>
              <p className="mb-4">Faça seus palpites para todos os jogos da Copa Mundial de Clubes e concorra a prêmios incríveis!</p>
              <div className="flex flex-wrap gap-3">
                <Link to="/cadastro">
                  <Button className="bg-fifa-gold hover:bg-opacity-90 text-fifa-blue font-semibold">
                    Participar Agora
                  </Button>
                </Link>
                <Link to="/criterios">
                  <Button variant="outline" className="border-white text-fifa-gold hover:bg-white hover:bg-opacity-20 font-semibold">
                    Ver Critérios
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:w-2/5 flex justify-center">
              <TrophyIcon size={120} className="text-fifa-gold" />
            </div>
          </div>
        </div>

        {/* Componente de palpites diários (só aparecerá após 14/06/2025) */}
        <DailyPredictions />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatsCard 
            title="Total de Participantes" 
            value={stats.totalUsers.toString()} 
            icon={<UserIcon className="h-4 w-4" />}
            description="Jogadores registrados" 
          />
          <StatsCard 
            title="Jogos Realizados" 
            value={`${stats.matchesPlayed}/${stats.totalMatches}`} 
            icon={<SoccerBallIcon className="h-4 w-4" />}
            description={stats.totalMatches > 0 ? `${Math.round((stats.matchesPlayed / stats.totalMatches) * 100)}% concluído` : "0% concluído"} 
          />
          <StatsCard 
            title="Maior Pontuação" 
            value={stats.topScore.points.toString()} 
            icon={<TrophyIcon className="h-4 w-4" />}
            description={stats.topScore.userName} 
          />
          <StatsCard 
            title="Próximo Jogo" 
            value={stats.nextMatch.date} 
            icon={<FlagIcon className="h-4 w-4" />}
            description={stats.nextMatch.teams} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <RankingTable />
            <div className="mt-4 flex gap-2">
              <Link to="/palpites">
                <Button size="wide" className="bg-fifa-blue hover:bg-fifa-blue/90 text-white gap-2">
                  <SoccerBallIcon className="h-4 w-4" />
                  Fazer Meus Palpites
                </Button>
              </Link>
              <Link to="/palpites-usuarios">
                <Button size="wide" className="bg-fifa-green hover:bg-fifa-green/90 text-white gap-2">
                  <Users className="h-4 w-4" />
                  Ver Todos os Palpites
                </Button>
              </Link>
            </div>
          </div>
          <div>
            <div className="space-y-6">
              <NextMatches />
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