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
import usePoolData from "@/hooks/usePoolData";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface PoolHeaderData {
  name: string;
  invite_code: string;
  description?: string;
  championship_id?: string; // Adicionado para uso interno
  owner_id?: string;
  payment_required?: boolean;
}

const PoolDashboard = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const { user, switchPool } = useAuth();
  const navigate = useNavigate();

  // Estado local robusto para os dados do cabeçalho
  const [poolHeader, setPoolHeader] = useState<PoolHeaderData | null>(null);
  
  // Estado para estatísticas de jogos
  const [gameStats, setGameStats] = useState({
    totalUsers: 0,
    matchesPlayed: 0,
    totalMatches: 0,
    nextMatch: { date: "", teams: "" },
  });
  const [loadingGameStats, setLoadingGameStats] = useState(true);

  // 1. Hook de Dados do Usuário (Pontos, Ranking)
  // Passamos o poolId direto da URL para não depender do contexto
  const { stats: userStats, loading: userStatsLoading } = usePoolData(poolId);

  // 2. Buscar Informações do Bolão e Campeonato
  useEffect(() => {
    if (!poolId) return;

    // Sincroniza o contexto global (sem bloquear a renderização)
    switchPool(poolId);

    const fetchPoolInfo = async () => {
      setLoadingGameStats(true);
      try {
        // Busca detalhes do bolão INCLUINDO o championship_id
        const { data: poolData, error: poolError } = await supabase
          .from('pools')
          .select('name, invite_code, description, championship_id, owner_id, payment_required')
          .eq('id', poolId)
          .single();

        if (poolError) throw poolError;
        setPoolHeader(poolData);

        if (poolData?.championship_id) {
          // Busca estatísticas de jogos usando o campeonato correto
          const [
            userCountData,
            finishedMatchesData,
            totalMatchesData,
            nextMatchReqData
          ] = await Promise.all([
            supabase.from('participations').select('*', { count: 'exact', head: true }).eq('pool_id', poolId),
            supabase.from('matches').select('*', { count: 'exact', head: true }).eq('is_finished', true).eq('championship_id', poolData.championship_id),
            supabase.from('matches').select('*', { count: 'exact', head: true }).eq('championship_id', poolData.championship_id),
            supabase.from('matches')
                .select(`match_date, home_team:home_team_id(name), away_team:away_team_id(name)`)
                .eq('championship_id', poolData.championship_id)
                .gte('match_date', new Date().toISOString())
                .order('match_date', { ascending: true })
                .limit(1)
                .maybeSingle()
          ]);

          let nextMatchInfo = { date: "N/A", teams: "Aguardando definição" };
          if (nextMatchReqData.data) {
            nextMatchInfo = {
              date: new Date(nextMatchReqData.data.match_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
              teams: `${nextMatchReqData.data.home_team?.name || 'N/A'} vs ${nextMatchReqData.data.away_team?.name || 'N/A'}`,
            };
          }

          setGameStats({
            totalUsers: userCountData.count || 0,
            matchesPlayed: finishedMatchesData.count || 0,
            totalMatches: totalMatchesData.count || 0,
            nextMatch: nextMatchInfo,
          });
        }
      } catch (error: any) {
        console.error("Erro ao carregar dashboard:", error.message);
      } finally {
        setLoadingGameStats(false);
      }
    };

    fetchPoolInfo();
  }, [poolId, switchPool]); // Dependência apenas do ID da URL

  if (!poolHeader && loadingGameStats) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-fifa-blue" />
      </div>
    );
  }
  
  const isOwner = user?.id === poolHeader?.owner_id;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
             <Badge variant="outline" className="mb-2 bg-blue-50 text-blue-700 border-blue-200">
                Código: {poolHeader?.invite_code}
             </Badge>
             <h1 className="text-2xl md:text-3xl font-bold text-fifa-blue">
               {poolHeader?.name}
             </h1>
             {poolHeader?.description && <p className="text-gray-500 text-sm mt-1">{poolHeader.description}</p>}
          </div>
          {isOwner && (
            <Link to={`/pool/${poolId}/settings`}>
                <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Configurações
                </Button>
            </Link>
          )}
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <StatsCard 
            title="Participantes" 
            value={gameStats.totalUsers} 
            icon={<Users className="h-5 w-5" />} 
            description="Membros ativos" 
        />
        <StatsCard 
            title="Progresso" 
            value={`${gameStats.matchesPlayed}/${gameStats.totalMatches}`} 
            icon={<SoccerBallIcon className="h-5 w-5" />} 
            description="Jogos realizados" 
        />
        <StatsCard 
            title="Próxima Partida" 
            value={gameStats.nextMatch.date} 
            icon={<FlagIcon className="h-5 w-5" />} 
            description={gameStats.nextMatch.teams} 
        />
      </div>

      {/* Botão de Ação Principal */}
      <div className="text-center mb-8">
        <Link to={`/pool/${poolId}/palpites`}>
          <Button className="bg-fifa-green hover:bg-green-700 text-white font-bold py-6 px-8 text-lg rounded-xl shadow-lg transition-transform hover:scale-105">
            Meus Palpites
          </Button>
        </Link>
      </div>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <NoticeBoard />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-8">
          
          {isOwner && poolHeader?.payment_required && (
              <PaymentManagement />
          )}

          <NextMatches />
        </div>
      </div>
    </div>
  );
};

export default PoolDashboard;