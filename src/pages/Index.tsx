// src/pages/Index.tsx

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import RankingTable from "@/components/home/RankingTable";
import NextMatches from "@/components/home/NextMatches"; // Se você tem este componente
import DailyPredictions from "@/components/home/DailyPredictions"; // Se você tem este componente
import StatsCard from "@/components/home/StatsCard";
import { Trophy as TrophyIcon, User as UserIcon, Volleyball as SoccerBallIcon, Flag as FlagIcon, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; // Importe os componentes Dialog
import DailyMatchPredictions from "@/components/predictions/DailyMatchPredictions"; // <--- IMPORTE O NOVO COMPONENTE

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

  const [showDailyPredictionsModal, setShowDailyPredictionsModal] = useState(false); // Novo estado para controlar o modal

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
          .eq('is_finished', true); // Contar apenas as partidas finalizadas
        if (finishedMatchCountError) throw finishedMatchCountError;

        // Contar total de partidas
        const { count: totalMatchCount, error: totalMatchCountError } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true });
        if (totalMatchCountError) throw totalMatchCountError;

        // Buscar o usuário com mais pontos (Top Score)
        const { data: topScorerData, error: topScorerError } = await supabase
          .from('user_points')
          .select('user_id, points, users_custom(name)') // Seleciona o nome do usuário através do join
          .order('points', { ascending: false })
          .limit(1)
          .single();

        if (topScorerError && topScorerError.code !== 'PGRST116') { // PGRST116 é "No rows found"
          console.error('Erro ao buscar top scorer:', topScorerError);
          // Não jogue um erro fatal aqui, apenas não defina o top score
        }

        // Buscar a próxima partida
        const { data: nextMatchData, error: nextMatchError } = await supabase
          .from('matches')
          .select('match_date, home_team:home_team_id(name), away_team:away_team_id(name)')
          .gte('match_date', new Date().toISOString()) // Partidas no futuro
          .order('match_date', { ascending: true })
          .limit(1)
          .single();

        if (nextMatchError && nextMatchError.code !== 'PGRST116') {
          console.error('Erro ao buscar próxima partida:', nextMatchError);
        }

        setStats({
          totalUsers: userCount || 0,
          matchesPlayed: finishedMatchCount || 0,
          totalMatches: totalMatchCount || 0,
          topScore: topScorerData
            ? {
                points: topScorerData.points,
                userName: (topScorerData.users_custom as { name: string })?.name || "N/A"
              }
            : { points: 0, userName: "N/A" },
          nextMatch: nextMatchData
            ? {
                date: new Date(nextMatchData.match_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                teams: `${(nextMatchData.home_team as { name: string })?.name} vs ${(nextMatchData.away_team as { name: string })?.name}`
              }
            : { date: "N/A", teams: "Nenhuma partida futura" }
        });

      } catch (err) {
        console.error("Erro ao carregar estatísticas:", err);
      }
    };

    fetchStats();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center text-fifa-blue mb-8">Bem-vindo ao Bolão da Copa!</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Principal - Ranking */}
          <div className="lg:col-span-2">
            <RankingTable />
          </div>

          {/* Coluna Lateral - Estatísticas e Regras */}
          <div className="space-y-8">
            {/* Seção de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatsCard
                title="Total de Participantes"
                value={stats.totalUsers}
                icon={<UserIcon className="h-5 w-5" />}
              />
              <StatsCard
                title="Partidas Jogadas"
                value={`${stats.matchesPlayed} / ${stats.totalMatches}`}
                icon={<SoccerBallIcon className="h-5 w-5" />}
              />
              <StatsCard
                title="Maior Pontuação"
                value={`${stats.topScore.points} pts`}
                icon={<TrophyIcon className="h-5 w-5" />}
                description={stats.topScore.userName}
              />
              <StatsCard
                title="Próxima Partida"
                value={stats.nextMatch.date}
                icon={<FlagIcon className="h-5 w-5" />}
                description={stats.nextMatch.teams}
              />
            </div>

            {/* Botão para Palpites do Dia (NOVO) */}
            <Dialog open={showDailyPredictionsModal} onOpenChange={setShowDailyPredictionsModal}>
              <DialogTrigger asChild>
                <Button className="w-full bg-fifa-gold hover:bg-fifa-gold/90 text-white font-bold py-2 px-4 rounded-md shadow-md transition-colors">
                  Ver Palpites do Dia
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Palpites de {format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}</DialogTitle>
                </DialogHeader>
                <DailyMatchPredictions date={new Date()} /> {/* Passa a data atual */}
              </DialogContent>
            </Dialog>

            {/* Seção de Regras Rápidas */}
            <div className="w-full">
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