import { Link } from 'react-router-dom';
import { useMyPools } from '@/hooks/useMyPools';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Trophy, PlusCircle, LogIn } from 'lucide-react'; // Ícones adicionados

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
    return (
        <div className="p-4 text-center border border-red-200 bg-red-50 rounded-lg text-red-600">
            Erro ao carregar seus bolões. Tente recarregar a página.
        </div>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
             <h2 className="text-2xl font-bold tracking-tight text-fifa-blue">Meus Bolões</h2>
             <div className="flex w-full sm:w-auto gap-2">
                 <Button asChild variant="outline" className="flex-1 sm:flex-none">
                    <Link to="/join-pool">
                        <LogIn className="mr-2 h-4 w-4" /> Entrar
                    </Link>
                 </Button>
                 <Button asChild className="flex-1 sm:flex-none bg-fifa-blue hover:bg-blue-900">
                    <Link to="/create-pool">
                        <PlusCircle className="mr-2 h-4 w-4" /> Criar Novo
                    </Link>
                 </Button>
             </div>
        </div>

      {pools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pools.map(pool => (
            <Link to={`/pool/${pool.id}`} key={pool.id} className="block group hover:no-underline">
              <Card className="h-full hover:shadow-md transition-all duration-200 border-l-4 border-l-fifa-blue group-hover:border-l-fifa-gold">
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-fifa-blue transition-colors">{pool.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {pool.description || 'Acesse para ver o ranking e palpites.'}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-center animate-in fade-in zoom-in duration-500">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <Trophy className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Você ainda está no banco de reservas!
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
                O jogo já começou. Crie seu próprio campeonato para comandar a turma ou entre em campo com um código de convite.
            </p>
            <div className="flex gap-3">
                <Button asChild variant="outline">
                    <Link to="/join-pool">Tenho um código</Link>
                </Button>
                <Button asChild className="bg-fifa-blue text-white hover:bg-blue-900">
                    <Link to="/create-pool">Criar meu bolão</Link>
                </Button>
            </div>
        </div>
      )}
    </div>
  );
}