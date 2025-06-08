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
import { useToast } from "@/components/ui/use-toast"; // <-- 1. MUDANÇA: Importação correta

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast(); // <-- 2. MUDANÇA: Usando o hook do shadcn/ui
  const { login, isAuthenticated, isLoadingAuth, isFirstLogin } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    if (isLoadingAuth) {
      return;
    }
    if (isAuthenticated) {
      if (isFirstLogin) {
        navigate('/change-password');
      } else {
        navigate('/');
      }
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
    setLoginError("");

    if (!formData.email || !formData.password) {
      setLoginError("Por favor, preencha todos os campos");
      // Opcional: Adicionar um toast aqui também, se desejar.
      return;
    }

    setIsSubmitting(true);
    try {
      // No seu AuthContext, a função 'login' já tem o signInWithPassword
      const success = await login(formData.email, formData.password);
      if (!success) {
        // O erro já deve ser tratado dentro da função login, mas como fallback
        throw new Error("Email ou senha inválidos.");
      }
      // O redirecionamento é tratado no useEffect
    } catch (error: any) {
      console.error("Erro ao fazer login no componente:", error);
      const errorMessage = error.message || "Ocorreu um erro inesperado no login. Tente novamente.";
      setLoginError(errorMessage);
       // 3. MUDANÇA: Chamada da função toast com a sintaxe correta
      toast({
        title: "Erro ao fazer login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAuth || (isAuthenticated && !isFirstLogin)) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-fifa-blue" />
          <p className="ml-2 text-fifa-blue">Carregando...</p>
        </div>
      </Layout>
    );
  }

  if (isAuthenticated && isFirstLogin) {
    return null;
  }
  
  // Mantido o seu JSX original para o layout
  return (
    <Layout>
      <div className="max-w-md mx-auto">
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
            <Alert className="mb-4 bg-yellow-50 border-yellow-300">
              <InfoIcon className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Usuários predefinidos:</strong>
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Digite seu email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <Link to="/esqueci-senha" className="text-sm text-fifa-blue hover:underline">
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Digite sua senha"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>
                 {loginError && <p className="text-sm font-medium text-destructive mt-2">{loginError}</p>}
                <Button
                  type="submit"
                  className="w-full bg-fifa-blue hover:bg-opacity-90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
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