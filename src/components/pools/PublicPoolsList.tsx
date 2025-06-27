// src/components/pools/PublicPoolsList.tsx

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { PublicPoolCard, PublicPool } from '@/components/home/PublicPoolCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface Championship {
  id: string;
  name: string;
}

const PublicPoolsList = () => {
  const [publicPools, setPublicPools] = useState<PublicPool[]>([]);
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChampionship, setSelectedChampionship] = useState('all');

  useEffect(() => {
    const fetchPoolData = async () => {
      setLoading(true);
      try {
        const [{ data: champsData, error: champsError }, { data: poolsData, error: poolsError }] = await Promise.all([
          supabase.from('championships').select('id, name'),
          supabase.rpc('get_public_pools')
        ]);
        if (champsError || poolsError) throw champsError || poolsError;
        setChampionships(champsData || []);
        setPublicPools(poolsData || []);
      } catch (error) {
        console.error("Erro ao buscar dados dos bolões públicos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPoolData();
  }, []);

  const handleFilterChange = async (championshipId: string) => {
    setSelectedChampionship(championshipId);
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_public_pools', { p_championship_id: championshipId === 'all' ? null : championshipId });
      if (error) throw error;
      setPublicPools(data || []);
    } catch (error) {
      console.error("Erro ao filtrar bolões:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full">
      <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8">
        <div className="flex items-center gap-2">
          <Label htmlFor="championship-filter">Filtrar por Campeonato:</Label>
          <Select value={selectedChampionship} onValueChange={handleFilterChange}>
            <SelectTrigger id="championship-filter" className="w-[250px]"><SelectValue placeholder="Campeonato..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Campeonatos</SelectItem>
              {championships.map(champ => (<SelectItem key={champ.id} value={champ.id}>{champ.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-fifa-blue" /></div>
      ) : publicPools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicPools.map(pool => (<PublicPoolCard key={pool.id} pool={pool} />))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground pt-8">Nenhum bolão público encontrado com os filtros selecionados.</p>
      )}
    </section>
  );
};

export default PublicPoolsList;