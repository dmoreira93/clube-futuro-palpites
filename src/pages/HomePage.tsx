// src/pages/HomePage.tsx (VERSÃO ATUALIZADA com Filtros)

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, UserPlus, Gamepad2, Award } from 'lucide-react';
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

  const [publicPools, setPublicPools] = useState<PublicPool[]>([]);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para o filtro selecionado
  const [selectedChampionship, setSelectedChampionship] = useState('all');

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }

    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Busca os campeonatos para popular o filtro
        const { data: champsData, error: champsError } = await supabase
          .from('championships').select('id, name');
        if (champsError) throw champsError;
        setChampionships(champsData || []);

        // Busca os bolões (inicialmente sem filtro)
        const { data: poolsData, error: poolsError } = await supabase.rpc('get_public_pools');
        if (poolsError) throw poolsError;
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

  // Função que é chamada quando o filtro muda
  const handleFilterChange = async (championshipId: string) => {
    setSelectedChampionship(championshipId);
    setLoading(true);
    try {
      // Chama a função RPC com o parâmetro de filtro
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
        {/* ... (Conteúdo da seção Hero permanece igual) ... */}
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

      {/* ... (Seções "Como Funciona" e "FAQ" permanecem iguais) ... */}
    </div>
  );
};

export default HomePage;