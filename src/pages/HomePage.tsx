// src/pages/HomePage.tsx

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import StatsCard from '@/components/home/StatsCard';
import { Users, Shield, ArrowRight, Gamepad2, UserPlus, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalUsers: 0, totalPools: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Se o usuário já está logado, navega direto para o dashboard.
    if (isAuthenticated) {
      navigate('/dashboard');
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        const [
          { count: userCount },
          { count: poolCount }
        ] = await Promise.all([
          supabase.from('users_custom').select('*', { count: 'exact', head: true }),
          supabase.from('pools').select('*', { count: 'exact', head: true })
        ]);
        setStats({ totalUsers: userCount || 0, totalPools: poolCount || 0 });
      } catch (error) {
        console.error("Erro ao buscar estatísticas públicas:", error);
      } finally {
        setLoading(false);
      }
    };
    
    // Apenas busca as estatísticas se o usuário não estiver autenticado.
    if (!isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated, navigate]);

  // Enquanto verifica a autenticação, não mostra nada para evitar um "flash" da página.
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Seção Principal (Hero) */}
      <section className="text-center py-16 md:py-24">
        <h1 className="text-4xl md:text-6xl font-bold text-fifa-blue">
          Clube Futuro Palpites
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          A plataforma definitiva para criar e competir em bolões de futebol com seus amigos. Simples, divertido e totalmente seu.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/cadastro">
            <Button size="lg" className="bg-fifa-green hover:bg-green-700 text-white font-bold w-full sm:w-auto">
              Crie seu Bolão Grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
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

      {/* Seção "Como Funciona" */}
      <section className="py-16 md:py-24">
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
              <p className="text-muted-foreground mt-2">Compartilhe o código e junte toda a turma para a competição.</p>
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
      
      {/* Seção de FAQ (Perguntas Frequentes) */}
      <section className="py-16 md:py-24 bg-muted rounded-lg">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold text-center mb-12">Dúvidas Frequentes</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>É gratuito para jogar?</AccordionTrigger>
              <AccordionContent>
                Sim! Você pode criar e participar de bolões gratuitamente. No futuro, planejamos adicionar funcionalidades premium opcionais.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Como funciona o sistema de pontuação?</AccordionTrigger>
              <AccordionContent>
                Nosso sistema de pontuação é detalhado. Você ganha pontos por acertar o placar exato, o vencedor da partida, o placar de um dos times e mais. Confira todos os detalhes na nossa página de <Link to="/criterios" className="text-fifa-blue underline">Critérios de Pontuação</Link>.
              </AccordionContent>
            </AccordionItem>
             <AccordionItem value="item-3">
              <AccordionTrigger>Posso participar de mais de um bolão?</AccordionTrigger>
              <AccordionContent>
                Atualmente, cada cadastro está vinculado a um único bolão para simplificar a competição.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </div>
  );
};

export default HomePage;