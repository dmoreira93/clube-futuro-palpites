import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const JoinPoolPage = () => {
  const { user, fetchAndSyncProfile } = useAuth();
  const [poolCode, setPoolCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleJoinPool = async () => {
    if (!poolCode.trim()) {
      toast({ title: 'Erro', description: 'Por favor, insira um código de convite.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data: pool, error: poolError } = await supabase
        .from('pools')
        .select('id')
        .eq('invite_code', poolCode.trim().toUpperCase())
        .single();

      if (poolError || !pool) {
        throw new Error('Código do bolão não encontrado ou inválido.');
      }

      const { error: userUpdateError } = await supabase
        .from('users_custom')
        .update({ pool_id: pool.id })
        .eq('id', user.id);

      if (userUpdateError) {
        throw userUpdateError;
      }
      
      await fetchAndSyncProfile(user); // Atualiza o perfil no AuthContext

      toast({ title: 'Sucesso!', description: `Você entrou no bolão!` });
      navigate('/'); // Redireciona para a página inicial

    } catch (error: any) {
      toast({ title: 'Erro ao entrar no bolão', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  
  // Adicione a função para navegar para a página de criação
  const navigateToCreatePool = () => {
    navigate('/create-pool');
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Entrar ou Criar um Bolão</CardTitle>
          <CardDescription>
            Insira um código de convite para entrar em um bolão existente, ou crie um novo para seus amigos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pool-code">Código do Bolão</Label>
            <Input 
              id="pool-code" 
              placeholder="CÓDIGO123" 
              value={poolCode}
              onChange={(e) => setPoolCode(e.target.value)}
            />
          </div>
          <Button onClick={handleJoinPool} disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : 'Entrar no Bolão'}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou
              </span>
            </div>
          </div>
          <Button onClick={navigateToCreatePool} variant="secondary" className="w-full">
            Criar um Novo Bolão
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinPoolPage;