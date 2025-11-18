// src/pages/PoolDashboard.tsx (VERSÃO FINAL COM CABEÇALHO E CÓDIGO DE CONVITE)

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client'; // Import para buscar dados do bolão
import usePoolData from '@/hooks/usePoolData'; 
import useParticipantsRanking from '@/hooks/useParticipantsRanking';
import StatsCard from '@/components/home/StatsCard'; 
import RankingTable from '@/components/home/RankingTable'; 
import NoticeBoard from '@/components/dashboard/NoticeBoard';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Copy, Check } from 'lucide-react'; // Ícones novos
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Interface para os detalhes do bolão
interface PoolHeaderData {
  name: string;
  invite_code: string;
}

const PoolDashboard = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const { switchPool } = useAuth(); 
  const [poolDetails, setPoolDetails] = useState<PoolHeaderData | null>(null);
  const [copied, setCopied] = useState(false);

  // Efeito para ativar o bolão e buscar o nome/código
  useEffect(() => {
    if (poolId) {
      switchPool(poolId);
      
      // Busca apenas o nome e o código do bolão atual
      const fetchPoolDetails = async () => {
        const { data, error } = await supabase
          .from('pools')
          .select('name, invite_code')
          .eq('id', poolId)
          .single();
        
        if (!error && data) {
          setPoolDetails(data);
        }
      };
      fetchPoolDetails();
    }
  }, [poolId, switchPool]);

  const { participants: ranking, loading: rankingLoading, error: rankingError } = useParticipantsRanking();
  const { stats, loading: statsLoading, error: statsError } = usePoolData();

  const isLoading = rankingLoading || statsLoading;
  const combinedError = rankingError || statsError;

  // Função para copiar o código
  const copyToClipboard = () => {
    if (poolDetails?.invite_code) {
      navigator.clipboard.writeText(poolDetails.invite_code);
      setCopied(true);
      toast.success("Código copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
      
      {/* NOVO: Cabeçalho com Nome do Bolão e Código */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-lg shadow-sm border">
        <div>
           <h1 className="text-3xl font-bold text-primary">{poolDetails?.name || 'Carregando...'}</h1>
           <p className="text-muted-foreground text-sm">Painel Principal</p>
        </div>

        {poolDetails?.invite_code && (
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Código de Convite</span>
            <div className="flex items-center gap-2 bg-secondary/50 p-2 rounded-md border border-secondary">
              <code className="text-lg font-mono font-bold tracking-widest text-primary">
                {poolDetails.invite_code}
              </code>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 hover:bg-background"
                onClick={copyToClipboard}
              >
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}
      </div>

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
    <Skeleton className="h-24 w-full" /> {/* Skeleton do Header */}
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