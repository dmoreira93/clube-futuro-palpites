// src/pages/HomePage.tsx (VERSÃO COMPLETA com todas as seções restauradas)

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import StatsCard from '@/components/home/StatsCard';
import { Users, Shield, ArrowRight, Gamepad2, UserPlus, Award, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PublicPoolCard, PublicPool } from '@/components/home/PublicPoolCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Championship {
  id: string;
  name: string;
}

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ totalUsers: 0, totalPools: 0 });
  const [publicPools, setPublicPools] = useState<PublicPool[]>([]);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChampionship, setSelectedChampionship] = useState('all');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [
          { count: userCount },
          { count: poolCount },
          { data: champsData, error: champsError },
          { data: poolsData, error: poolsError }
        ] = await Promise.all([
          supabase.from('users_custom').select('*', { count: 'exact', head: true }),
          supabase.from('pools').select('*', { count: 'exact', head: true }),
          supabase.from('championships').select('id, name'),
          supabase.rpc('get_public_pools')
        ]);
        
        if (champsError || poolsError) {
            throw champsError || poolsError;
        }

        setStats({ totalUsers: userCount || 0, totalPools: poolCount || 0 });
        setChampionships(champsData || []);
        setPublicPools(poolsData || []);

      } catch (error) {
        console.error("Erro ao buscar dados da homepage:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (!isAuthenticated) {
      fetchInitialData();
    }
  }, [isAuthenticated, navigate]);
  
  const handleFilterChange = async (championshipId: string) => {
    setSelectedChampionship(championshipId);
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_public_pools', {
        p_championship_id: championshipId === 'all' ? null : championshipId
      });
      if (error) throw error;
      setPublicPools(data || []);
    } catch (error) {
      console.error("Erro ao filtrar bolões:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) return null;

  return (
    <div className="w-full space-y-16">
      {/* Seção Principal (Hero) */}
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-6xl font-bold text-fifa-blue">
          Clube Futuro Palpites
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          A plataforma definitiva para criar e competir em bolões de futebol. Encontre um bolão público ou crie o seu!
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/cadastro">
            <Button size="lg" className="bg-fifa-green hover:bg-green-700 text-white font-bold shadow-lg w-full sm:w-auto">
              Crie seu Bolão Grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="shadow-md w-full sm:w-auto">
              Acessar meu Bolão
            </Button>
          </Link>
        </div>
      </section>

      {/* Seção de Estatísticas */}
      <section className="py-12 bg-muted rounded-lg">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
          <StatsCard
            title="Bolões Criados na Plataforma"
            value={loading ? '...' : stats.totalPools}
            icon={<Shield />}
            description="Grupos de amigos competindo ativamente."
          />
          <StatsCard
            title="Total de Participantes"
            value={loading ? '...' : stats.totalUsers}
            icon={<Users />}
            description="Apaixonados por futebol dando seus palpites."
          />
        </div>
      </section>

      {/* Seção de Bolões Públicos com Filtros */}
      <section>
        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8">
            <h2 className="text-3xl font-bold">Bolões Públicos Abertos</h2>
            <div className="flex items-center gap-2">
                <Label htmlFor="championship-filter">Filtrar por:</Label>
                <Select value={selectedChampionship} onValueChange={handleFilterChange}>
                    <SelectTrigger id="championship-filter" className="w-[250px]">
                        <SelectValue placeholder="Campeonato..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Campeonatos</SelectItem>
                        {championships.map(champ => (
                            <SelectItem key={champ.id} value={champ.id}>{champ.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-fifa-blue" /></div>
        ) : publicPools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {publicPools.map(pool => (
              <PublicPoolCard key={pool.id} pool={pool} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground pt-8">Nenhum bolão público encontrado com os filtros selecionados.</p>
        )}
      </section>

      {/* Seção "Como Funciona" - Restaurada */}
      <section className="py-16">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center mb-12">É fácil começar!</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center items-center mb-4 w-16 h-16 mx-auto bg-fifa-blue text-white rounded-full">
                <UserPlus className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold">1. Crie seu Bolão</h3>
              <p className="text-muted-foreground mt-2">Dê um nome ao seu bolão e receba um código de convite exclusivo em segundos.</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center items-center mb-4 w-16 h-16 mx-auto bg-fifa-blue text-white rounded-full">
                <Gamepad2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold">2. Convide seus Amigos</h3>
              <p className="text-muted-foreground mt-2">Compartilhe o código ou torne seu bolão público para que outros participem.</p>
            </div>
            <div className="text-center">
              <div className="flex justify-center items-center mb-4 w-16 h-16 mx-auto bg-fifa-blue text-white rounded-full">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold">3. Palpite e Comemore</h3>
              <p className="text-muted-foreground mt-2">Dê seus palpites, acompanhe o ranking e mostre quem entende mais.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Seção de FAQ (Perguntas Frequentes) - Restaurada */}
      <section className="py-16 bg-muted rounded-lg">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">Dúvidas Frequentes</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>É gratuito para jogar?</AccordionTrigger>
              <AccordionContent>
                Sim! Você pode criar e participar de bolões gratuitamente. A plataforma é mantida por taxas administrativas opcionais definidas pelos criadores dos bolões.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Como funciona o sistema de pontuação?</AccordionTrigger>
              <AccordionContent>
                Nosso sistema de pontuação é detalhado. Você ganha pontos por acertar o placar exato, o vencedor da partida, e mais. Confira todos os detalhes na nossa página de <Link to="/criterios" className="text-fifa-blue underline">Critérios de Pontuação</Link>.
              </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-3">
              <AccordionTrigger>Posso participar de mais de um bolão?</AccordionTrigger>
              <AccordionContent>
                Atualmente, cada cadastro está vinculado a um único bolão para simplificar a competição, mas você pode criar uma nova conta para participar de outro.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </div>
  );
};

export default HomePage;