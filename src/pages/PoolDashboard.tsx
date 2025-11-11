// src/pages/PoolDashboard.tsx (VERSÃO COM ERRO DE SINTAXE CORRIGIDO)

import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import usePoolData from '@/hooks/usePoolData'; 
import useParticipantsRanking from '@/hooks/useParticipantsRanking';
import { StatsCard } from '@/components/home/StatsCard';
import { RankingTable } from '@/components/home/RankingTable';
import { NoticeBoard } from '@/components/dashboard/NoticeBoard';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const PoolDashboard = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const { switchPool } = useAuth(); 

  useEffect(() => {
    if (poolId) {
      switchPool(poolId);
    }
  }, [poolId, switchPool]);

  // --- ESTA É A LINHA CORRIGIDA (O "_" FOI REMOVIDO) ---
  const { ranking, loading: rankingLoading, error: rankingError } = useParticipantsRanking();
  // --- FIM DA CORREÇÃO ---
  
  const { stats, loading: statsLoading, error: statsError } = usePoolData();

  const isLoading = rankingLoading || statsLoading;
  const combinedError = rankingError || statsError;

  if (isLoading) {
    return <PoolDashboardSkeleton />;
  }

  if (combinedError) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao Carregar Bolão</AlertTitle>
          <AlertDescription>{combinedError.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      {/* Seção de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Sua Pontuação" value={stats?.user_points ?? 0} />
        <StatsCard title="Sua Posição" value={`${stats?.user_rank ?? 0}º`} />
        <StatsCard title="Top Scorer" value={stats?.top_scorer?.name ?? 'N/A'} description={`com ${stats?.top_scorer?.points ?? 0} pts`} />
        <StatsCard title="Mais Exatos" value={stats?.most_exact?.name ?? 'N/A'} description={`${stats?.most_exact?.exact_scores ?? 0} placares`} />
      </div>

      {/* Seção de Mural de Avisos e Ranking */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RankingTable participants={ranking} />
        </div>
        <div className="lg:col-span-1">
          <NoticeBoard />
        </div>
      </div>
    </div>
  );
};

// Componente Skeleton para o loading
const PoolDashboardSkeleton = () => (
  <div className="container mx-auto p-4 space-y-8">
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Skeleton className="h-64 w-full" />
      </div>
      <div className="lg:col-span-1">
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  </div>
);

export default PoolDashboard;