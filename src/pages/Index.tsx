// src/pages/Index.tsx

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import RankingTable from "@/components/home/RankingTable";
import NextMatches from "@/components/home/NextMatches";
// import { DailyPredictions } from "@/components/home/DailyPredictions"; // Comentado se não usado/ajustado
import StatsCard from "@/components/home/StatsCard";
import { Trophy as TrophyIcon, Users, Volleyball as SoccerBallIcon, Flag as FlagIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    matchesPlayed: 0,
    totalMatches: 0,
    topScorer: {
      points: 0,
      userName: "Ninguém",
    },
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
        const { count: userCount, error: userCountError } = await supabase
          .from('users_custom')
          .select('*', { count: 'exact', head: true })
          .eq('is_admin', false);
        if (userCountError) throw userCountError;

        const { count: finishedGroupStageMatchCount, error: finishedMatchCountError } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .eq('is_finished', true)
          .eq('stage', 'Fase de Grupos');
        if (finishedMatchCountError) throw finishedMatchCountError;

        const { count: totalGroupStageMatchCount, error: totalMatchCountError } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .eq('stage', 'Fase de Grupos');
        if (totalMatchCountError) throw totalMatchCountError;

        // Buscar o participante com a maior pontuação (não admin)
        // Ordenar por total_points DESC, tratando NULLS como os menores (colocando-os por último na ordem DESC)
        const { data: topUserData, error: topUserError } = await supabase
          .from('users_custom')
          .select('name, total_points')
          .eq('is_admin', false)
          // Garante que usuários com pontos apareçam primeiro, e NULLs por último.
          // Para Supabase JS v2, nullsLast é o padrão para DESC, mas ser explícito pode ajudar em algumas DBs.
          // Se total_points for NULL, queremos que ele seja tratado como menor que 0.
          // Uma forma é filtrar por total_points IS NOT NULL, ou confiar na ordenação padrão de NULLS LAST para DESC.
          // Vamos primeiro tentar garantir que apenas usuários com pontuação > 0 sejam considerados,
          // ou se todos tiverem 0, que pegue um deles.
          .order('total_points', { ascending: false, nullsLast: true })
          .limit(1)
          .maybeSingle();

        let topScorerData = { points: 0, userName: "Ninguém" };
        if (topUserError && topUserError.code !== 'PGRST116') {
          console.error("Erro ao buscar maior pontuador:", topUserError.message);
        } else if (topUserData) {
          // Se total_points for null ou undefined, userData.total_points || 0 garante que points seja 0.
          // Apenas considera como pontuador se os pontos forem maiores que 0,
          // ou se for o único usuário e tiver 0 pontos.
          if (topUserData.total_points !== null && topUserData.total_points > 0) {
            topScorerData = {
              points: topUserData.total_points,
              userName: topUserData.name || "Desconhecido",
            };
          } else if (topUserData.total_points === 0) {
             // Se o "maior" pontuador tem 0 pontos, ainda o exibimos.
             // Se o valor padrão "Ninguém" é mantido, é porque não há usuários com pontos > 0
             // e o .maybeSingle() retornou um usuário com 0 ou null pontos,
             // ou não retornou nenhum usuário não-admin.
            topScorerData = {
                points: 0,
                userName: topUserData.name || "Desconhecido",
            }
          }
          // Se topUserData.total_points for null, e for o único retornado,
          // a lógica de `points: topUserData.total_points || 0` resultaria em 0 pontos.
          // Se topScorerData permanecer como { points: 0, userName: "Ninguém" },
          // isso acontecerá se topUserData for null ou se o usuário encontrado tiver total_points null
          // e não cair nas condições acima.
        }


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
          topScorer: topScorerData,
          nextMatch: nextMatchInfo,
        });
      } catch (error: any) {
        console.error("Erro ao buscar estatísticas:", error.message);
        setStats(prevStats => ({
            ...prevStats,
            topScorer: { points: 0, userName: "Erro ao carregar" }
        }));
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  // O restante do componente permanece o mesmo...
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center text-fifa-blue mb-8">Bem-vindo ao Clube Futuro Palpites!</h1>

        {loadingStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
            <StatsCard
              title="Maior Pontuador"
              value={`${stats.topScorer.userName} (${stats.topScorer.points} pts)`}
              icon={<TrophyIcon className="h-5 w-5" />}
              description="Quem está liderando o bolão"
            />
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