import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogInIcon, Loader2, InfoIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import Layout from "@/components/layout/Layout"; // Garantindo que a importação do Layout está aqui

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isAuthenticated, isLoadingAuth, isFirstLogin } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // O useEffect agora lida com o redirecionamento de forma mais limpa
  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      // Se não está carregando e está autenticado, decide para onde ir
      const destination = isFirstLogin ? "/change-password" : "/";
      navigate(destination, { replace: true });
    }
  }, [isAuthenticated, isLoadingAuth, isFirstLogin, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast({
        title: "Erro de Validação",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await login(formData.email, formData.password);
      // O redirecionamento é tratado pelo useEffect acima
    } catch (error: any) {
      console.error("Erro ao fazer login no componente:", error);
      toast({
        title: "Erro ao Fazer Login",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Se o estado de autenticação ainda estiver sendo verificado, mostramos um loader de página inteira.
  if (isLoadingAuth) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-fifa-blue" />
        </div>
      </Layout>
    );
  }
  
  // Se o usuário já estiver autenticado, o useEffect irá redirecioná-lo.
  // Renderizar null evita um "flash" do formulário de login antes do redirecionamento.
  if (isAuthenticated) {
    return null;
  }

  // Se não está carregando e não está autenticado, mostra o formulário de login.
  return (
    <Layout>
      <div className="max-w-md mx-auto py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-fifa-blue">Login</h1>
          <p className="text-gray-600 mt-2">
            Entre para acessar seus palpites e ver sua pontuação
          </p>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex justify-center mb-2">
              <div className="bg-fifa-blue rounded-full p-3">
                <LogInIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-center">Entrar</CardTitle>
            <CardDescription className="text-center">
              Acesse sua conta do bolão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" placeholder="Digite seu email" value={formData.email} onChange={handleChange} required autoComplete="email" />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                  </div>
                  <Input id="password" name="password" type="password" placeholder="Digite sua senha" value={formData.password} onChange={handleChange} required autoComplete="current-password" />
                </div>
                <Button type="submit" className="w-full bg-fifa-blue hover:bg-opacity-90" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...</>
                  ) : ( "Entrar" )}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <div className="text-center w-full">
              <div className="text-xs text-gray-500 mt-2">
                Se você é administrador,{" "}
                <Link to="/admin-login" className="text-fifa-blue hover:underline">
                  acesse a área administrativa
                </Link>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default Login;