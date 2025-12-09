import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, LogIn, Users, ArrowRight } from 'lucide-react';
import { PublicPoolsList } from '@/components/pools/PublicPoolsList';
import { Separator } from '@/components/ui/separator';

const HERO_BG_IMAGE = "/hero-bg.png";

const JoinPoolPage = () => {
  const { user } = useAuth();
  const [poolCode, setPoolCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleVerifyCode = async () => {
    if (!poolCode.trim()) {
      toast({ title: 'Erro', description: 'Por favor, insira um código de convite.', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    try {
      // Verifica se o código existe antes de redirecionar
      const { data: pool, error } = await supabase
        .from('pools')
        .select('invite_code')
        .eq('invite_code', poolCode.trim().toUpperCase())
        .single();

      if (error || !pool) {
        throw new Error('Código inválido ou bolão não encontrado.');
      }

      // Redireciona para a página de Panorama/Confirmação
      navigate(`/cadastro/${pool.invite_code}`);

    } catch (error: any) {
      toast({ title: 'Código Inválido', description: "Verifique se digitou corretamente.", variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  
  const navigateToCreatePool = () => {
    navigate('/create-pool');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Cabeçalho */}
      <div className="bg-fifa-blue text-white py-10 px-4 text-center shadow-md relative overflow-hidden">
         <div className="absolute inset-0 opacity-10 bg-cover bg-center" style={{ backgroundImage: `url('${HERO_BG_IMAGE}')` }}></div>
        <div className="container mx-auto relative max-w-4xl z-10">
            <div className="flex justify-center mb-4">
                <div className="bg-white/10 p-3 rounded-full backdrop-blur-sm">
                    <LogIn className="h-8 w-8 text-fifa-gold" />
                </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-fifa-gold drop-shadow-sm">Entrar em um Bolão</h1>
            <p className="text-gray-200 mt-2 text-lg">Use um código de convite ou escolha um bolão público.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl flex-grow space-y-12">
        
        {/* Card de Entrada com Código */}
        <Card className="max-w-md mx-auto shadow-xl border-t-4 border-t-fifa-gold bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-fifa-blue">Código de Convite</CardTitle>
            <CardDescription>
              Recebeu um código de um amigo? Digite abaixo para ver os detalhes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <div className="space-y-2">
              <Label htmlFor="pool-code" className="text-gray-700 font-medium">Código</Label>
              <Input 
                id="pool-code" 
                placeholder="Ex: AB12CD" 
                value={poolCode}
                onChange={(e) => setPoolCode(e.target.value.toUpperCase())}
                className="uppercase font-mono text-lg tracking-widest text-center border-gray-300 focus:border-fifa-gold focus:ring-fifa-gold py-6"
                maxLength={6}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
              />
            </div>
            <Button 
                onClick={handleVerifyCode} 
                disabled={loading} 
                className="w-full bg-fifa-blue hover:bg-blue-900 font-bold py-6 shadow-md hover:shadow-lg transition-all"
            >
              {loading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : (
                  <>Verificar Código <ArrowRight className="ml-2 h-4 w-4"/></>
              )}
            </Button>
            
            <div className="relative py-3">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-muted-foreground font-medium">Ou</span></div>
            </div>
            
            <Button onClick={navigateToCreatePool} variant="outline" className="w-full border-fifa-blue text-fifa-blue hover:bg-blue-50 font-semibold py-5 transition-colors">
              Criar meu próprio Bolão
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center my-8">
            <Separator className="max-w-md bg-gray-200" />
        </div>

        {/* Seção de Bolões Públicos */}
        <div className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-100">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-full mb-4">
                <Users className="h-6 w-6 text-fifa-blue" />
            </div>
            <h2 className="text-2xl font-bold text-fifa-blue mb-2">Bolões Públicos</h2>
            <p className="text-muted-foreground">
                Não tem código? Sem problemas! Participe de bolões abertos para toda a comunidade.
            </p>
          </div>
          
          <PublicPoolsList />
        </div>

      </div>
    </div>
  );
};

export default JoinPoolPage;