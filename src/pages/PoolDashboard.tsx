import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import usePoolData from '@/hooks/usePoolData'; 
import useParticipantsRanking from '@/hooks/useParticipantsRanking';
import NoticeBoard from '@/components/dashboard/NoticeBoard';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Copy, Check, Trophy, Medal, Target, AlertTriangle, Calculator, ListChecks, BarChart2, Users } from 'lucide-react'; 
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PoolHeaderData {
  name: string;
  invite_code: string;
  description?: string;
}

const PoolDashboard = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const { switchPool, user } = useAuth(); 
  const navigate = useNavigate();
  const [poolDetails, setPoolDetails] = useState<PoolHeaderData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (poolId) {
      switchPool(poolId);
      const fetchPoolDetails = async () => {
        const { data, error } = await supabase
          .from('pools')
          .select('name, invite_code, description')
          .eq('id', poolId)
          .single();
        if (!error && data) setPoolDetails(data);
      };
      fetchPoolDetails();
    }
  }, [poolId, switchPool]);

  const { participants: ranking, loading: rankingLoading, error: rankingError } = useParticipantsRanking();
  const { stats, loading: statsLoading, error: statsError } = usePoolData();

  const isLoading = rankingLoading || statsLoading;
  const combinedError = rankingError || statsError;

  const copyToClipboard = () => {
    if (poolDetails?.invite_code) {
      navigator.clipboard.writeText(poolDetails.invite_code);
      setCopied(true);
      toast.success("Código copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Cálculos de Estatísticas Extras
  const myRankData = ranking.find(p => p.id === user?.id);
  const leaderPoints = ranking.length > 0 ? ranking[0].points : 0;
  const myPoints = myRankData?.points || 0;
  const pointsToLeader = leaderPoints - myPoints;
  
  // Pódio (Top 3) e Último
  const top3 = ranking.slice(0, 3);
  const lastPlace = ranking.length > 1 ? ranking[ranking.length - 1] : null;

  if (isLoading) return <PoolDashboardSkeleton />;
  if (combinedError) return <ErrorAlert message={combinedError.message} />;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      
      {/* --- CABEÇALHO DO BOLÃO --- */}
      <div className="bg-white border-b border-gray-200 pb-8 pt-8 shadow-sm">
        <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-fifa-blue border-fifa-blue bg-blue-50">Bolão Ativo</Badge>
                        {poolDetails?.description && <span className="text-xs text-gray-500 truncate max-w-xs">{poolDetails.description}</span>}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-fifa-blue">{poolDetails?.name || 'Carregando...'}</h1>
                </div>

                {poolDetails?.invite_code && (
                    <div className="flex items-center gap-3 bg-gray-100 p-2 pr-4 rounded-lg border border-gray-200">
                        <span className="text-xs font-bold text-gray-500 uppercase pl-2">Código:</span>
                        <code className="text-lg font-mono font-bold text-fifa-gold tracking-wider">{poolDetails.invite_code}</code>
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white rounded-full" onClick={copyToClipboard}>
                            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-gray-500" />}
                        </Button>
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">

        {/* --- GRID DE ESTATÍSTICAS PESSOAIS --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
                title="Minha Pontuação" 
                value={myPoints} 
                icon={<Target className="h-5 w-5 text-blue-500" />} 
                subtext="pontos acumulados"
            />
            <StatCard 
                title="Minha Posição" 
                value={`${myRankData?.rank || '-'}º`} 
                icon={<Trophy className="h-5 w-5 text-yellow-500" />} 
                subtext={ranking.length > 0 ? `de ${ranking.length} participantes` : ''}
                highlight
            />
            <StatCard 
                title="Distância pro Líder" 
                value={pointsToLeader === 0 ? 'Liderando!' : pointsToLeader} 
                icon={<BarChart2 className="h-5 w-5 text-green-500" />} 
                subtext={pointsToLeader === 0 ? 'Mantenha o ritmo' : 'pontos para alcançar'}
            />
             <StatCard 
                title="Placares Exatos" 
                value={myRankData?.exactscores || 0} 
                icon={<Target className="h-5 w-5 text-purple-500" />} 
                subtext="na mosca!"
            />
        </div>

        {/* --- ÁREA DE AÇÃO RÁPIDA (BOTÕES) --- */}
        <div className="flex flex-wrap gap-3">
            <ActionButton icon={<ListChecks />} label="Meus Palpites" onClick={() => navigate(`/pool/${poolId}/palpites`)} primary />
            <ActionButton icon={<BarChart2 />} label="Resultados" onClick={() => navigate(`/pool/${poolId}/resultados`)} />
            <ActionButton icon={<Trophy />} label="Ranking Completo" onClick={() => navigate(`/pool/${poolId}/ranking`)} />
            <ActionButton icon={<Calculator />} label="Simulador" onClick={() => navigate(`/pool/${poolId}/simulador`)} />
            <ActionButton icon={<AlertTriangle />} label="Auditoria" onClick={() => navigate(`/auditoria`)} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* --- COLUNA ESQUERDA: PÓDIO E MURAL --- */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* PÓDIO (TOP 3) */}
                <Card className="border-t-4 border-t-fifa-gold shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl"><Trophy className="text-fifa-gold"/> Pódio do Bolão</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {ranking.length > 0 ? (
                            <div className="flex flex-col md:flex-row justify-center items-end gap-4 pt-4 pb-2">
                                {/* 2º Lugar */}
                                {top3[1] && <PodiumStep participant={top3[1]} place={2} color="bg-gray-300" height="h-24" />}
                                {/* 1º Lugar */}
                                {top3[0] && <PodiumStep participant={top3[0]} place={1} color="bg-fifa-gold" height="h-32" isFirst />}
                                {/* 3º Lugar */}
                                {top3[2] && <PodiumStep participant={top3[2]} place={3} color="bg-orange-300" height="h-20" />}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">Ainda não há ranking disponível.</div>
                        )}

                        {/* Lanterna */}
                        {lastPlace && ranking.length > 3 && (
                            <div className="mt-6 pt-4 border-t flex items-center justify-between bg-red-50 p-3 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">🐢</span>
                                    <div>
                                        <p className="text-sm font-bold text-red-700">Zona de Punição</p>
                                        <p className="text-xs text-red-600">Último colocado: {lastPlace.name}</p>
                                    </div>
                                </div>
                                <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">
                                    {poolDetails?.description || "Pagar o café!"}
                                </Badge>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* MURAL DE AVISOS */}
                <NoticeBoard />
            </div>

            {/* --- COLUNA DIREITA: DESTAQUES E PRÓXIMOS JOGOS --- */}
            <div className="space-y-8">
                 {/* Card de Destaques (Top Scorer / Mais Exatos) */}
                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5 text-fifa-blue"/> Destaques</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Maior Pontuador</p>
                                <p className="font-semibold text-fifa-blue">{stats?.top_scorer?.name || 'N/A'}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xl font-bold text-green-600">{stats?.top_scorer?.points || 0}</span>
                                <span className="text-xs text-gray-400 block">pts</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Rei da Cravada</p>
                                <p className="font-semibold text-fifa-blue">{stats?.most_exact?.name || 'N/A'}</p>
                            </div>
                            <div className="text-right">
                                <span className="text-xl font-bold text-purple-600">{stats?.most_exact?.exact_scores || 0}</span>
                                <span className="text-xs text-gray-400 block">cravadas</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Próximos Jogos (Placeholder - Idealmente viria do useMatchResults ou similar) */}
                <Card className="bg-blue-50/50 border-blue-100">
                    <CardHeader>
                        <CardTitle className="text-lg text-fifa-blue">Próximas Partidas</CardTitle>
                        <CardDescription>Prepare seus palpites!</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="text-center py-4 text-gray-500 text-sm">
                            <p>Consulte a aba "Palpites" para ver a agenda completa.</p>
                            <Button variant="link" onClick={() => navigate(`/pool/${poolId}/palpites`)} className="mt-2 text-fifa-blue">
                                Ir para Palpites
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTES AUXILIARES ---

const StatCard = ({ title, value, icon, subtext, highlight = false }: any) => (
    <Card className={`${highlight ? 'border-fifa-gold bg-yellow-50/30' : ''} shadow-sm`}>
        <CardContent className="p-4 flex flex-col items-center text-center justify-center h-full">
            <div className="mb-2 bg-white p-2 rounded-full shadow-sm">{icon}</div>
            <p className="text-xs text-gray-500 font-medium uppercase">{title}</p>
            <p className="text-2xl font-bold text-gray-800 my-1">{value}</p>
            {subtext && <p className="text-[10px] text-gray-400">{subtext}</p>}
        </CardContent>
    </Card>
);

const ActionButton = ({ icon, label, onClick, primary = false }: any) => (
    <Button 
        variant={primary ? "default" : "outline"} 
        className={`flex-1 min-w-[140px] h-12 ${primary ? 'bg-fifa-blue hover:bg-blue-900' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
        onClick={onClick}
    >
        {icon} <span className="ml-2">{label}</span>
    </Button>
);

const PodiumStep = ({ participant, place, color, height, isFirst = false }: any) => (
    <div className="flex flex-col items-center">
        <div className="mb-2 flex flex-col items-center">
            <Avatar className={`${isFirst ? 'w-16 h-16 border-4 border-fifa-gold' : 'w-12 h-12 border-2 border-gray-200'}`}>
                <AvatarImage src={participant.avatar_url} />
                <AvatarFallback>{participant.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className={`text-xs font-bold mt-1 ${isFirst ? 'text-base' : ''} text-center max-w-[80px] truncate`}>{participant.name}</span>
            <span className="text-xs text-gray-500">{participant.points} pts</span>
        </div>
        <div className={`${color} ${height} w-16 md:w-24 rounded-t-lg flex items-start justify-center pt-2 shadow-inner relative`}>
            <span className={`font-bold ${isFirst ? 'text-3xl text-white drop-shadow-md' : 'text-xl text-gray-600'}`}>{place}º</span>
        </div>
    </div>
);

const ErrorAlert = ({ message }: { message: string }) => (
    <div className="container mx-auto p-8">
        <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
        </Alert>
    </div>
);

const PoolDashboardSkeleton = () => (
  <div className="container mx-auto p-4 space-y-8">
    <Skeleton className="h-32 w-full" />
    <div className="grid grid-cols-4 gap-4"><Skeleton className="h-24"/><Skeleton className="h-24"/><Skeleton className="h-24"/><Skeleton className="h-24"/></div>
    <div className="grid grid-cols-3 gap-8"><Skeleton className="h-96 col-span-2"/><Skeleton className="h-96"/></div>
  </div>
);

export default PoolDashboard;