// src/pages/Index.tsx (Conteúdo COMPLETO e ATUALIZADO)
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import RankingTable from "@/components/home/RankingTable";
import NextMatches from "@/components/home/NextMatches";
import DailyPredictions from "@/components/home/DailyPredictions";
import StatsCard from "@/components/home/StatsCard";
import { Trophy as TrophyIcon, User as UserIcon, Volleyball as SoccerBallIcon, Flag as FlagIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// IMPORTANTE: Importar o useParticipantsRanking
import useParticipantsRanking from "@/hooks/useParticipantsRanking"; 

const Index = () => {
  // O estado 'stats' será populado com base nos dados do ranking e outras contagens
  const [stats, setStats] = useState({
    totalUsers: 0,
    matchesPlayed: 0, // Corrigido para representar o total de partidas FINALIZADAS
    totalMatches: 0, // Total de partidas no campeonato
    topScore: {
      points: 0,
      userName: ""
    },
    nextMatch: {
      date: "", // Você precisaria buscar isso separadamente ou de um hook de partidas futuras
      teams: ""
    }
  });

  // Use o hook de ranking para obter os participantes e o estado de carregamento/erro
  const { participants, loading: rankingLoading, error: rankingError } = useParticipantsRanking();

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Contar usuários (do useParticipantsRanking já temos os participantes)
        // Mas para totalUsers aqui, podemos fazer uma busca direta para ser mais preciso antes do ranking carregar
        const { count: userCount, error: userCountError } = await supabase
          .from('users_custom') // Usar users_custom
          .select('*', { count: 'exact', head: true });
        if (userCountError) throw userCountError;

        // Contar partidas realizadas (is_finished = true)
        const { count: finishedMatchCount, error: finishedMatchCountError } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true })
          .eq('is_finished', true); // Contar apenas as finalizadas
        if (finishedMatchCountError) throw finishedMatchCountError;

        // Contar total de partidas (todas as partidas)
        const { count: totalMatchCount, error: totalMatchCountError } = await supabase
          .from('matches')
          .select('*', { count: 'exact', head: true });
        if (totalMatchCountError) throw totalMatchCountError;


        setStats(prevStats => ({
          ...prevStats,
          totalUsers: userCount || 0,
          matchesPlayed: finishedMatchCount || 0, // Total de partidas finalizadas
          totalMatches: totalMatchCount || 0, // Total de partidas no sistema
          // topScore será atualizado após o carregamento dos participantes
        }));

      } catch (err: any) {
        console.error("Erro ao buscar contagens:", err);
      }
    };

    fetchCounts();
  }, []); // Rodar apenas uma vez na montagem

  // Efeito para atualizar topScore quando os participantes do ranking carregarem
  useEffect(() => {
    if (!rankingLoading && participants.length > 0) {
      // O primeiro participante no ranking já é o de maior pontuação
      const topScorer = participants[0];
      setStats(prevStats => ({
        ...prevStats,
        topScore: {
          points: topScorer.points,
          userName: topScorer.name
        }
      }));
    }
  }, [participants, rankingLoading]); // Rodar quando participantes ou rankingLoading mudarem

  // Se você precisa buscar o próximo jogo, faria isso aqui ou em NextMatches
  // Exemplo (adapte conforme sua estrutura):
  // useEffect(() => {
  //   const fetchNextMatch = async () => {
  //     try {
  //       const { data, error } = await supabase
  //         .from('matches')
  //         .select('home_team_id, away_team_id, match_date, teams(name)') // Ajuste sua seleção
  //         .eq('is_finished', false)
  //         .order('match_date', { ascending: true })
  //         .limit(1)
  //         .single();
  //       if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
  //       if (data) {
  //         setStats(prevStats => ({
  //           ...prevStats,
  //           nextMatch: {
  //             date: new Date(data.match_date).toLocaleDateString(), // Formate a data
  //             teams: `${data.teams[0].name} vs ${data.teams[1].name}` // Ajuste para como teams vem
  //           }
  //         }));
  //       }
  //     } catch (err) {
  //       console.error("Erro ao buscar próximo jogo:", err);
  //     }
  //   };
  //   fetchNextMatch();
  // }, []);


  return (
    <Layout>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <h1 className="text-3xl md:text-4xl font-extrabold text-center text-fifa-blue mb-8">
          Copa dos Palpites
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard 
            icon={<UserIcon className="h-6 w-6 text-white" />} 
            title="Participantes" 
            value={stats.totalUsers.toString()} 
            className="bg-gradient-to-r from-blue-500 to-blue-700 text-white"
          />
          <StatsCard 
            icon={<SoccerBallIcon className="h-6 w-6 text-white" />} 
            title="Partidas Jogadas" 
            value={`${stats.matchesPlayed}/${stats.totalMatches}`} 
            className="bg-gradient-to-r from-green-500 to-green-700 text-white"
          />
          <StatsCard 
            icon={<TrophyIcon className="h-6 w-6 text-white" />} 
            title="Maior Pontuação" 
            value={stats.topScore.points.toString()} 
            subtitle={stats.topScore.userName} 
            className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
          />
          <StatsCard 
            icon={<FlagIcon className="h-6 w-6 text-white" />} 
            title="Próximo Jogo" 
            value={stats.nextMatch.date || "Carregando..."} 
            subtitle={stats.nextMatch.teams || "Aguarde..."} 
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RankingTable />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <NextMatches />
            <DailyPredictions />
            <div className="mt-8">
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