// src/components/pools/PublicPoolsList.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';
import { Pool } from '@/types/matches';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

export function PublicPoolsList() {
  const [publicPools, setPublicPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicPools = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('pools')
        .select('*')
        .eq('is_public', true) // Filtra apenas bolões públicos
        .order('created_at', { ascending: false });

      if (error) {
        setError('Não foi possível carregar os bolões públicos.');
        console.error(error);
      } else {
        setPublicPools(data);
      }
      setLoading(false);
    };

    fetchPublicPools();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-center">{error}</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Bolões Públicos</h2>
      {publicPools.length > 0 ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {publicPools.map((pool) => (
            <Card key={pool.id}>
              <CardHeader>
                <CardTitle>{pool.name}</CardTitle>
                <CardDescription>{pool.description || 'Sem descrição'}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Criado em: {new Date(pool.created_at).toLocaleDateString()}</p>
              </CardContent>
              <CardFooter>
                <Button asChild>
                  <Link to={`/join-pool?code=${pool.join_code}`}>Entrar no Bolão</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">Nenhum bolão público encontrado no momento.</p>
      )}
    </div>
  );
}