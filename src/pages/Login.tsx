import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

// Reutilizando a imagem da Home
const HERO_BG_IMAGE = "/hero-bg.png";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos.');
      return;
    }

    setIsLoading(true);
    try {
      const { success, error } = await login(email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        // O erro já é tratado no contexto, mas podemos reforçar aqui se necessário
        console.error("Login falhou:", error);
      }
    } catch (error) {
      console.error('Erro inesperado no login:', error);
      toast.error('Ocorreu um erro ao tentar fazer login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
        className="min-h-screen flex items-center justify-center bg-cover bg-center py-12 px-4 sm:px-6 lg:px-8 relative"
        style={{ 
            backgroundImage: `url('${HERO_BG_IMAGE}')`,
            backgroundPosition: 'center top'
        }}
    >
      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-gradient-to-b from-fifa-blue/80 via-fifa-blue/70 to-fifa-blue/90"></div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl bg-white/95 backdrop-blur-sm border-none">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
             <div className="bg-fifa-blue p-3 rounded-full">
                <BarChart3 className="h-8 w-8 text-fifa-gold" />
             </div>
          </div>
          <CardTitle className="text-2xl font-bold text-fifa-blue">Bem-vindo de volta!</CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar seus bolões.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-gray-300 focus:border-fifa-blue focus:ring-fifa-blue"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link 
                    to="/esqueci-senha" 
                    className="text-sm text-fifa-blue hover:text-blue-700 font-medium"
                >
                    Esqueceu a senha?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="******" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-gray-300 focus:border-fifa-blue focus:ring-fifa-blue"
              />
            </div>
            <Button 
                type="submit" 
                className="w-full bg-fifa-blue text-white hover:bg-blue-900 font-bold py-2 transition-all duration-200 shadow-md hover:shadow-lg" 
                disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            Ainda não tem conta?{' '}
            <Link to="/cadastro" className="text-fifa-blue font-bold hover:underline">
              Cadastre-se grátis
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;