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

const CreatePoolPage = () => {
  const { user, fetchAndSyncProfile } = useAuth();
  const [poolName, setPoolName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCreatePool = async () => {
    if (!poolName.trim()) {
      toast({ title: 'Erro', description: 'Por favor, dê um nome ao seu bolão.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('create_pool', {
        pool_name: poolName.trim(),
        owner_id_param: user.id
      });
      
      if (error) {
        throw error;
      }
      
      await fetchAndSyncProfile(user);

      toast({ title: 'Bolão Criado!', description: 'Seu novo bolão foi criado com sucesso. Convide seus amigos!' });
      navigate('/'); // Redireciona para a página inicial

    } catch (error: any) {
      toast({ title: 'Erro ao criar o bolão', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Bolão</CardTitle>
          <CardDescription>
            Dê um nome ao seu bolão. Após a criação, você receberá um código de convite para compartilhar.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pool-name">Nome do Bolão</Label>
            <Input 
              id="pool-name" 
              placeholder="Ex: Bolão da Galera" 
              value={poolName}
              onChange={(e) => setPoolName(e.target.value)}
            />
          </div>
          <Button onClick={handleCreatePool} disabled={loading} className="w-full">
            {loading ? <Loader2 className="animate-spin" /> : 'Criar Bolão'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePoolPage;