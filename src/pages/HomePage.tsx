// src/pages/HomePage.tsx (VERSÃO FINAL COM AJUSTES NO PWA)

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import StatsCard from '@/components/home/StatsCard';
import { Users, Shield, ArrowRight, Gamepad2, UserPlus, Award, Loader2, PlusCircle, LogIn, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PublicPoolCard, PublicPool } from '@/components/home/PublicPoolCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { usePwaDisplayMode } from '@/hooks/usePwaDisplayMode';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import PublicPoolsList from '@/components/pools/PublicPoolsList'; // Importe o novo componente

interface Championship {
  id: string;
  name: string;
}

// ===================================================================
//  LAYOUT PARA DESKTOP
// ===================================================================
// Substitua a função DesktopHomePage inteira por esta em src/pages/HomePage.tsx

const DesktopHomePage = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalPools: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const [{ count: userCount }, { count: poolCount }] = await Promise.all([
          supabase.from('users_custom').select('*', { count: 'exact', head: true }),
          supabase.from('pools').select('*', { count: 'exact', head: true }),
        ]);
        setStats({ totalUsers: userCount || 0, totalPools: poolCount || 0 });
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  return (
    // CORREÇÃO: Adicionado um <div> principal para envolver todo o conteúdo
    <div className="w-full space-y-16">
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-6xl font-bold text-fifa-blue">Clube Futuro Palpites</h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">A plataforma definitiva para criar e competir em bolões de futebol. Encontre um bolão público ou crie o seu!</p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/cadastro"><Button size="lg" className="bg-fifa-green hover:bg-green-700 text-white font-bold shadow-lg w-full sm:w-auto">Crie seu Bolão Grátis<ArrowRight className="ml-2 h-5 w-5" /></Button></Link>
          <Link to="/login"><Button size="lg" variant="outline" className="shadow-md w-full sm:w-auto">Acessar meu Bolão</Button></Link>
        </div>
      </section>

      <section className="py-12 bg-muted rounded-lg">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
          <StatsCard title="Bolões Criados na Plataforma" value={loadingStats ? '...' : stats.totalPools} icon={<Shield />} description="Grupos de amigos competindo ativamente." />
          <StatsCard title="Total de Participantes" value={loadingStats ? '...' : stats.totalUsers} icon={<Users />} description="Apaixonados por futebol dando seus palpites." />
        </div>
      </section>

      {/* CORREÇÃO: A seção de Bolões Públicos agora fica aqui, e a chamada duplicada foi removida */}
      <section className="py-12">
        <div className="container mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold">Bolões Públicos Abertos</h2>
            </div>
            <PublicPoolsList /> 
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto max-w-5xl"><h2 className="text-3xl font-bold text-center mb-12">É fácil começar!</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-8"><div className="text-center"><div className="flex justify-center items-center mb-4 w-16 h-16 mx-auto bg-fifa-blue text-white rounded-full"><UserPlus className="w-8 h-8" /></div><h3 className="text-xl font-semibold">1. Crie seu Bolão</h3><p className="text-muted-foreground mt-2">Dê um nome ao seu bolão e receba um código de convite exclusivo em segundos.</p></div><div className="text-center"><div className="flex justify-center items-center mb-4 w-16 h-16 mx-auto bg-fifa-blue text-white rounded-full"><Gamepad2 className="w-8 h-8" /></div><h3 className="text-xl font-semibold">2. Convide seus Amigos</h3><p className="text-muted-foreground mt-2">Compartilhe o código ou torne seu bolão público para que outros participem.</p></div><div className="text-center"><div className="flex justify-center items-center mb-4 w-16 h-16 mx-auto bg-fifa-blue text-white rounded-full"><Award className="w-8 h-8" /></div><h3 className="text-xl font-semibold">3. Palpite e Comemore</h3><p className="text-muted-foreground mt-2">Dê seus palpites, acompanhe o ranking e mostre quem entende mais.</p></div></div></div>
      </section>
      
      <section className="py-16 bg-muted rounded-lg">
        <div className="container mx-auto max-w-3xl"><h2 className="text-3xl font-bold text-center mb-12">Dúvidas Frequentes</h2><Accordion type="single" collapsible className="w-full"><AccordionItem value="item-1"><AccordionTrigger>É gratuito para jogar?</AccordionTrigger><AccordionContent>Sim! Você pode criar e participar de bolões gratuitamente. A plataforma é mantida por taxas administrativas opcionais definidas pelos criadores dos bolões.</AccordionContent></AccordionItem><AccordionItem value="item-2"><AccordionTrigger>Como funciona o sistema de pontuação?</AccordionTrigger><AccordionContent>Nosso sistema de pontuação é detalhado. Você ganha pontos por acertar o placar exato, o vencedor da partida, e mais. Confira todos os detalhes na nossa página de <Link to="/criterios" className="text-fifa-blue underline">Critérios de Pontuação</Link>.</AccordionContent></AccordionItem><AccordionItem value="item-3"><AccordionTrigger>Posso participar de mais de um bolão?</AccordionTrigger><AccordionContent>Atualmente, cada cadastro está vinculado a um único bolão para simplificar a competição, mas você pode criar uma nova conta para participar de outro.</AccordionContent></AccordionItem></Accordion></div>
      </section>
    </div>
  );
};

// ===================================================================
//  LAYOUT PARA PWA (VERSÃO COM AJUSTES)
// ===================================================================
const Stat = ({ icon: Icon, value, label }: { icon: React.ElementType, value: string, label: string }) => (
  <div className="flex items-center gap-4"><div className="bg-fifa-gold/20 p-3 rounded-lg"><Icon className="h-6 w-6 text-fifa-gold" /></div><div className="flex flex-col"><span className="text-2xl font-bold text-fifa-blue">{value}</span><span className="text-sm text-muted-foreground">{label}</span></div></div>
);

const StatBanner = () => {
  const { data, isLoading } = useQuery({ queryKey: ['platformStats'], queryFn: async () => { const { data, error } = await supabase.rpc('get_platform_stats'); if (error) throw error; return data[0]; }});
  if (isLoading) return <Card className="w-full bg-white/80 backdrop-blur-sm"><CardContent className="pt-6 flex justify-around"><Skeleton className="h-16 w-36" /><Skeleton className="h-16 w-36" /></CardContent></Card>;
  return <Card className="w-full bg-white/80 backdrop-blur-sm shadow-lg"><CardHeader><CardTitle className='flex items-center gap-2 text-fifa-blue'><BarChart3/> Estatísticas</CardTitle></CardHeader><CardContent className="flex flex-col sm:flex-row justify-around items-center gap-6"><Stat icon={Award} value={String(data?.pool_count || 0)} label="Bolões Criados" /><Stat icon={Users} value={String(data?.participant_count || 0)} label="Participantes" /></CardContent></Card>;
};

const ActionButton = ({ icon: Icon, label, onClick }: { icon: React.ElementType, label: string, onClick: () => void }) => (
    <Button variant="outline" className="flex flex-col items-center justify-center h-28 w-full gap-2 border-2 border-fifa-blue/20 bg-white/80 shadow-md hover:bg-fifa-blue/5" onClick={onClick}><Icon className="h-8 w-8 text-fifa-blue" /><span className="text-sm font-semibold text-fifa-blue">{label}</span></Button>
);

const PwaHomePage = () => {
    const navigate = useNavigate();
    const currentYear = new Date().getFullYear();

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 text-fifa-blue">
            {/* Cabeçalho Ajustado */}
            <header className="bg-fifa-blue p-4 shadow-md flex items-center justify-center gap-3">
                <BarChart3 className="w-7 h-7 text-fifa-gold" />
                <h1 className="text-xl font-bold text-fifa-gold">Futuro Palpites</h1>
            </header>

            {/* Conteúdo Principal */}
            <main className="flex-grow flex flex-col gap-8 p-4">
                <StatBanner />
                <div className="grid grid-cols-3 gap-4">
                    <ActionButton icon={PlusCircle} label="Criar Bolão" onClick={() => navigate('/login')} />
                    <ActionButton icon={LogIn} label="Acessar Bolão" onClick={() => navigate('/login')} />
                    <ActionButton icon={Award} label="Critérios" onClick={() => navigate('/criterios')} />
                </div>
                <div className='w-full'>
                    <PublicPoolsSection />
                </div>
            </main>

            {/* Rodapé Simplificado */}
            <footer className="bg-fifa-blue text-center p-4">
                <p className="text-xs text-gray-300">&copy; {currentYear} Clube do Futuro Palpites. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
};


// ===================================================================
//  COMPONENTE PRINCIPAL (ROTEADOR DE LAYOUT)
// ===================================================================
const HomePage = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const { isPwa } = usePwaDisplayMode();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading || isAuthenticated) {
    return <div className="flex h-screen w-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-fifa-blue" /></div>;
  }

  return isPwa ? <PwaHomePage /> : <DesktopHomePage />;
};

export default HomePage;