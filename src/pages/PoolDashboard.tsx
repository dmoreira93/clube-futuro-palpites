import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import usePoolData from '@/hooks/usePoolData'; 
import useParticipantsRanking from '@/hooks/useParticipantsRanking';
import NoticeBoard from '@/components/dashboard/NoticeBoard';
import PaymentManagement from '@/components/dashboard/PaymentManagement';
import { PoolNextMatches } from '@/components/dashboard/PoolNextMatches'; 
import { PoolRulesDialog } from '@/components/pools/PoolRulesDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    AlertCircle, Copy, Check, Trophy, Target, 
    Calculator, ListChecks, BarChart2, Users, Info, Eye, Settings, ShieldCheck, BookOpen, FileSearch
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface PoolHeaderData {
  id: string;
  name: string;
  invite_code: string;
  description?: string | null;
  owner_id: string;
  championship_id: string;
  entry_fee: number;
  admin_fee_percent: number;
  prize_percent_1st: number;
  prize_percent_2nd: number;
  prize_percent_3rd: number;
  punishment_description?: string | null;
  enable_punishment?: boolean;
  points_exact_score: number;
  points_winner_diff: number;
  points_winner: number;
  points_wrong: number;
  points_match_draw: number;
  points_match_one_score: number;
  points_group_winner: number;
  points_group_inverted: number;
  points_group_single: number;
  points_champion: number;
  points_runner_up: number;
  points_third_place: number;
  points_fourth_place: number;
  points_final_score: number;
  points_top4_bonus: number;
  is_public: boolean;
}

const PoolDashboard = () => {
  const { poolId } = useParams<{ poolId: string }>();
  const { switchPool, user } = useAuth(); 
  const navigate = useNavigate();
  
  const [poolDetails, setPoolDetails] = useState<PoolHeaderData | null>(null);
  const [copied, setCopied] = useState(false);

  const { participants: ranking, loading: rankingLoading, error: rankingError } = useParticipantsRanking(poolId);
  const { stats, loading: statsLoading, error: statsError } = usePoolData(poolId);

  useEffect(() => {
    if (poolId) {
      switchPool(poolId);
      
      const fetchPoolDetails = async () => {
        try {
            const { data, error } = await supabase
            .from('pools')
            .select('*')
            .eq('id', poolId)
            .single();
            
            if (error) throw error;
            
            if (data) {
                setPoolDetails(data as PoolHeaderData);
            }
        } catch (error) {
            console.error("Erro ao buscar detalhes do bolão:", error);
        }
      };
      fetchPoolDetails();
    }
  }, [poolId, switchPool]);

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

  const isOwner = user?.id && poolDetails?.owner_id && user.id === poolDetails.owner_id;

  // Lógica de Ranking Limpa (Remove Admin e IA)
  const humanParticipants = ranking.filter(p => !p.is_ai && !p.is_admin);
  const myRankData = humanParticipants.find(p => p.id === user?.id);
  const myHumanIndex = humanParticipants.findIndex(p => p.id === user?.id);
  const myDisplayRank = myHumanIndex !== -1 ? myHumanIndex + 1 : '-';
  
  const leaderPoints = humanParticipants.length > 0 ? humanParticipants[0].points : 0;
  const myPoints = myRankData?.points || 0;
  const pointsToLeader = leaderPoints - myPoints;
  
  const top3 = humanParticipants.slice(0, 3);
  const lastPlace = humanParticipants.length > 1 ? humanParticipants[humanParticipants.length - 1] : null;

  const showPunishment = poolDetails?.enable_punishment && lastPlace && humanParticipants.length > 1;

  if (isLoading && !poolDetails) return <PoolDashboardSkeleton />;
  if (combinedError) return <ErrorAlert message={combinedError} />;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      
      {/* CABEÇALHO */}
      <div className="bg-white border-b border-gray-200 pb-8 pt-8 shadow-sm">
        <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-fifa-blue border-fifa-blue bg-blue-50">Bolão Ativo</Badge>
                        {isOwner && <Badge className="bg-purple-100 text-purple-700 border-purple-200"><ShieldCheck className="w-3 h-3 mr-1"/> Admin</Badge>}
                        {poolDetails?.is_public && <Badge className="bg-green-100 text-green-700 border-green-200">Público</Badge>}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-fifa-blue">
                        {poolDetails ? poolDetails.name : <Skeleton className="h-10 w-64" />}
                    </h1>
                    {poolDetails?.description && (
                        <p className="text-sm text-gray-500 mt-1 max-w-2xl line-clamp-2">{poolDetails.description}</p>
                    )}
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

        {/* ESTATÍSTICAS PESSOAIS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="Minha Pontuação" value={myPoints} icon={<Target className="h-5 w-5 text-blue-500" />} />
            <StatCard title="Minha Posição" value={`${myDisplayRank}º`} icon={<Trophy className="h-5 w-5 text-yellow-500" />} highlight />
            <StatCard title="Distância pro Líder" value={pointsToLeader <= 0 ? 'Liderando!' : pointsToLeader} icon={<BarChart2 className="h-5 w-5 text-green-500" />} />
            <StatCard title="Placares Exatos" value={myRankData?.exactscores || 0} icon={<Target className="h-5 w-5 text-purple-500" />} />
        </div>

        {/* MENUS / BOTÕES */}
        <div className="flex flex-wrap gap-3">
            <ActionButton icon={<ListChecks />} label="Meus Palpites" onClick={() => navigate(`/pool/${poolId}/palpites`)} primary />
            <ActionButton icon={<Eye />} label="Palpites da Galera" onClick={() => navigate(`/pool/${poolId}/palpites-galera`)} />
            <ActionButton icon={<BarChart2 />} label="Resultados" onClick={() => navigate(`/pool/${poolId}/resultados`)} />
            <ActionButton icon={<Trophy />} label="Ranking" onClick={() => navigate(`/pool/${poolId}/ranking`)} />
            <ActionButton icon={<Calculator />} label="Simulador" onClick={() => navigate(`/pool/${poolId}/simulador`)} />
            <ActionButton icon={<Info />} label="Participantes" onClick={() => navigate(`/pool/${poolId}/info-participantes`)} />
            <ActionButton icon={<FileSearch />} label="Auditoria" onClick={() => navigate(`/pool/${poolId}/auditoria`)} />
            
            {/* BOTÃO DE CRITÉRIOS */}
            {poolDetails && (
                <PoolRulesDialog 
                    pool={poolDetails} 
                    triggerButton={
                        <Button variant="outline" className="flex-1 min-w-[130px] h-12 border-gray-200 text-gray-700 hover:bg-gray-50">
                            <BookOpen className="mr-2 h-4 w-4" /> <span className="text-sm font-medium">Critérios</span>
                        </Button>
                    }
                />
            )}

            {/* BOTÃO EXCLUSIVO PARA O DONO */}
            {isOwner && (
                <ActionButton 
                    icon={<Settings />} 
                    label="Configurações" 
                    onClick={() => navigate(`/pool/${poolId}/settings`)} 
                    variant="outline"
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                />
            )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
                
                {/* --- ÁREA DO DONO: GESTÃO FINANCEIRA --- */}
                {isOwner && poolId && (
                    <div className="animate-in fade-in slide-in-from-left-4">
                        <PaymentManagement poolId={poolId} />
                    </div>
                )}

                {/* PÓDIO */}
                <Card className="border-t-4 border-t-fifa-gold shadow-md">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-xl"><Trophy className="text-fifa-gold"/> Pódio do Bolão</CardTitle></CardHeader>
                    <CardContent>
                        {humanParticipants.length > 0 ? (
                            <div className="flex flex-col md:flex-row justify-center items-end gap-4 pt-4 pb-2">
                                {top3[1] && <PodiumStep participant={top3[1]} place={2} color="bg-gray-300" height="h-24" />}
                                {top3[0] && <PodiumStep participant={top3[0]} place={1} color="bg-fifa-gold" height="h-32" isFirst />}
                                {top3[2] && <PodiumStep participant={top3[2]} place={3} color="bg-orange-300" height="h-20" />}
                            </div>
                        ) : <div className="text-center py-8 text-gray-500">Ainda não há ranking disponível.</div>}

                        {/* ÁREA DE PUNIÇÃO */}
                        {showPunishment && lastPlace && (
                         <div className="mt-6 pt-4 border-t flex items-center justify-between bg-red-50 p-3 rounded-lg animate-in fade-in gap-4">
                         <div className="flex items-center gap-3 flex-shrink-0">
                         <span className="text-2xl">🐢</span>
                        <div>
                          <p className="text-sm font-bold text-red-700">Zona de Punição</p>
                          <p className="text-xs text-red-600">Último colocado: <span className="font-bold">{lastPlace.name}</span></p>
                        </div>
                    </div>

        {/* Ajuste: removido 'max-w' e 'truncate', adicionado 'h-auto' e 'whitespace-normal' */}
        <Badge 
            variant="destructive" 
            className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 h-auto py-1.5 px-3 text-right whitespace-normal leading-tight"
        >
            {poolDetails?.punishment_description || "Pagar a prenda!"}
        </Badge>
    </div>
)}
                    </CardContent>
                </Card>

                <NoticeBoard />
            </div>

            <div className="space-y-8">
                {/* DESTAQUES */}
                <Card>
                    <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5 text-fifa-blue"/> Destaques</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div><p className="text-xs text-gray-500 uppercase font-bold">Maior Pontuador</p><p className="font-semibold text-fifa-blue">{stats?.top_scorer?.name || 'N/A'}</p></div>
                            <div className="text-right"><span className="text-xl font-bold text-green-600">{stats?.top_scorer?.points || 0}</span></div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div><p className="text-xs text-gray-500 uppercase font-bold">Rei da Cravada</p><p className="font-semibold text-fifa-blue">{stats?.most_exact?.name || 'N/A'}</p></div>
                            <div className="text-right"><span className="text-xl font-bold text-purple-600">{stats?.most_exact?.exact_scores || 0}</span></div>
                        </div>
                    </CardContent>
                </Card>

                {/* PRÓXIMOS JOGOS */}
                {poolDetails?.championship_id && poolId && (
                    <PoolNextMatches championshipId={poolDetails.championship_id} poolId={poolId} />
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

// Componentes auxiliares
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

const ActionButton = ({ icon, label, onClick, primary = false, variant = "outline", className }: any) => (
    <Button 
        variant={primary ? "default" : variant} 
        className={`flex-1 min-w-[130px] h-12 ${primary ? 'bg-fifa-blue hover:bg-blue-900 shadow-sm' : ''} ${className}`}
        onClick={onClick}
    >
        {icon} <span className="ml-2 text-sm font-medium">{label}</span>
    </Button>
);

const PodiumStep = ({ participant, place, color, height, isFirst = false }: any) => (
    <div className="flex flex-col items-center group cursor-pointer hover:-translate-y-1 transition-transform duration-300">
        <div className="mb-2 flex flex-col items-center">
            <Avatar className={`${isFirst ? 'w-16 h-16 border-4 border-fifa-gold shadow-md' : 'w-12 h-12 border-2 border-gray-200'}`}>
                <AvatarImage src={participant.avatar_url || undefined} />
                <AvatarFallback className="bg-gray-100 text-gray-600 font-bold">{participant.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className={`text-xs font-bold mt-2 ${isFirst ? 'text-base text-fifa-blue' : 'text-gray-700'} text-center max-w-[90px] truncate`}>{participant.name}</span>
            <Badge variant="secondary" className="mt-1 text-[10px] h-5 px-2 bg-gray-100 text-gray-600">{participant.points} pts</Badge>
        </div>
        <div className={`${color} ${height} w-16 md:w-24 rounded-t-lg flex items-start justify-center pt-2 shadow-inner relative opacity-90 group-hover:opacity-100 transition-opacity`}>
            <span className={`font-black ${isFirst ? 'text-3xl text-white drop-shadow-md' : 'text-xl text-gray-600/50'}`}>{place}º</span>
        </div>
    </div>
);

const ErrorAlert = ({ message }: { message: string }) => (
    <div className="container mx-auto p-8"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Erro</AlertTitle><AlertDescription>{message}</AlertDescription></Alert></div>
);

const PoolDashboardSkeleton = () => (
  <div className="container mx-auto p-4 space-y-8">
    <Skeleton className="h-32 w-full" />
    <div className="grid grid-cols-4 gap-4"><Skeleton className="h-24"/><Skeleton className="h-24"/><Skeleton className="h-24"/><Skeleton className="h-24"/></div>
    <div className="grid grid-cols-3 gap-8"><Skeleton className="h-96 col-span-2"/><Skeleton className="h-96"/></div>
  </div>
);

export default PoolDashboard;