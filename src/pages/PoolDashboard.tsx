// src/pages/PoolDashboard.tsx (VERSÃO FINAL COM SEUS COMPONENTES INTEGRADOS)

import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import NextMatches from "@/components/home/NextMatches";
import StatsCard from "@/components/home/StatsCard";
import NoticeBoard from "@/components/dashboard/NoticeBoard";
import PaymentManagement from "@/components/dashboard/PaymentManagement";
import { Users, Volleyball as SoccerBallIcon, Flag as FlagIcon, Loader2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const PoolDashboard = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const { user, activePool, switchPool, loading: authLoading, userParticipations } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalUsers: 0,
    matchesPlayed: 0,
    totalMatches: 0,
    nextMatch: { date: "", teams: "" },
  });
  const [loading, setLoading] = useState(true);

  // Lógica de busca de dados adaptada para o 'activePool'
  const fetchData = useCallback(async () => {
    // A condição agora é o 'activePool'
    if (!activePool?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const [
        userCountData,
        finishedMatchesData,
        totalMatchesData,
        nextMatchReqData
      ] = await Promise.all([
        // A busca de usuários agora é na tabela 'participations'
        supabase.from('participations').select('*', { count: 'exact', head: true }).eq('pool_id', activePool.id),
        // A busca de partidas agora usa o 'championship_id' do bolão ativo
        supabase.from('matches').select('*', { count: 'exact', head: true }).eq('is_finished', true).eq('championship_id', activePool.championship_id),
        supabase.from('matches').select('*', { count: 'exact', head: true }).eq('championship_id', activePool.championship_id),
        supabase.from('matches').select(`match_date, home_team:home_team_id(name), away_team:away_team_id(name)`).eq('championship_id', activePool.championship_id).gte('match_date', new Date().toISOString()).order('match_date', { ascending: true }).limit(1).maybeSingle()
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
  }, [activePool]); // A dependência agora é o 'activePool'

  useEffect(() => {
    // Garante que o poolId da URL seja o ativo
    if (!authLoading && poolId && activePool?.id !== poolId) {
      const isValidParticipation = userParticipations.some(p => p.pool.id === poolId);
      if (isValidParticipation) {
        switchPool(poolId);
      } else {
        navigate('/dashboard');
      }
    }
    // Se o bolão ativo estiver carregado, busca os dados dele
    if (activePool) {
      fetchData();
    }
  }, [authLoading, activePool, poolId, switchPool, fetchData, navigate, userParticipations]);

  // Tela de carregamento
  if (authLoading || loading || !activePool || activePool.id !== poolId) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-fifa-blue" />
        <span className="ml-4 text-lg">Carregando dados do seu bolão...</span>
      </div>
    );
  }
  
  const isOwner = user?.id === activePool?.owner_id;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-fifa-blue">
            Dashboard: <span className="text-gray-700 dark:text-gray-300">{activePool?.name}</span>
          </h1>
          {isOwner && (
            <Link to="/pool-settings">
                <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações do Bolão
                </Button>
            </Link>
          )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <StatsCard title="Participantes no Bolão" value={stats.totalUsers} icon={<Users className="h-5 w-5" />} description="Membros neste grupo" />
        <StatsCard title="Partidas do Campeonato" value={`${stats.matchesPlayed} / ${stats.totalMatches}`} icon={<SoccerBallIcon className="h-5 w-5" />} description="Jogos com resultados" />
        <StatsCard title="Próxima Partida" value={stats.nextMatch.date} icon={<FlagIcon className="h-5 w-5" />} description={stats.nextMatch.teams} />
      </div>

      <div className="text-center mb-8">
        <Link to="/palpites-do-dia">
          <Button className="bg-fifa-green hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-colors duration-300">
            Ver Palpites dos Jogos do Dia
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <NoticeBoard />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-8">
          
          {/* Condicional para exibir a Gestão de Pagamentos */}
          {isOwner && activePool?.payment_required && (
              <PaymentManagement />
          )}

          <NextMatches />
        </div>
      </div>
    </div>
  );
};

export default PoolDashboard;