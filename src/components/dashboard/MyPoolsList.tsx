// src/components/dashboard/MyPoolsList.tsx 
import { Link } from 'react-router-dom';
import { useMyPools } from '@/hooks/useMyPools'; // Caminho corrigido para usar o alias
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export function MyPoolsList() {
  const { pools, loading, error } = useMyPools();

  if (loading) {
     return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
     )
  }

  if (error) {
    return <p className="text-red-500">Erro ao carregar seus bolões.</p>;
  }

  return (
    <div className="space-y-4">
        <div className="flex justify-between items-center">
             <h2 className="text-2xl font-bold tracking-tight">Meus Bolões</h2>
             <div className="space-x-2">
                 <Button asChild variant="outline">
                    <Link to="/join-pool">Entrar com Código</Link>
                 </Button>
                 <Button asChild>
                    <Link to="/create-pool">Criar Novo Bolão</Link>
                 </Button>
             </div>
        </div>
      {pools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pools.map(pool => (
            <Link to={`/pool/${pool.id}`} key={pool.id} className="block hover:scale-105 transition-transform">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle>{pool.name}</CardTitle>
                  <CardDescription>Acesse para ver os detalhes</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">Você ainda não participa de nenhum bolão.</p>
            <p className="text-sm text-muted-foreground mb-4">Crie um novo ou entre em um bolão existente.</p>
        </div>
      )}
    </div>
  );
}