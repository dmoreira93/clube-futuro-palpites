import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
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

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoadingAuth, isFirstLogin } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      console.log("LOG: Redirecionando usuário. É o primeiro login?", isFirstLogin);
      navigate(isFirstLogin ? "/change-password" : "/palpites");
    }
  }, [isAuthenticated, isLoadingAuth, isFirstLogin, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
    console.log(`LOG 1: Tentando login com o email: ${formData.email}`);
    try {
      const { success, error } = await login(formData.email, formData.password);
      
      console.log(`LOG 2: A função de login retornou. Sucesso: ${success}, Erro:`, error);

      if (!success) {
        throw error || new Error("Ocorreu um erro desconhecido durante o login.");
      }

      console.log("LOG 3: Login bem-sucedido. Aguardando redirecionamento do useEffect.");
      // O useEffect cuidará do redirecionamento

    } catch (error: any) {
      console.error("LOG 4: Erro capturado no handleSubmit:", error);
      toast({
        title: "Erro no Login",
        description: error.message || "Email ou senha inválidos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-fifa-blue" />
        </div>
      </Layout>
    );
  }

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
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className="bg-fifa-blue rounded-full p-3">
                <LogInIcon className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Acesse sua conta do bolão</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 bg-yellow-50 border-yellow-300">
              <InfoIcon className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Usuários predefinidos:</strong>
              </AlertDescription>
            </Alert>
            <form onSubmit={handleSubmit} className="grid gap-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="Digite seu email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                </div>
                <Input id="password" name="password" type="password" placeholder="Digite sua senha" value={formData.password} onChange={handleChange} required />
              </div>
              <Button type="submit" className="w-full bg-fifa-blue hover:bg-opacity-90" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...</>
                ) : ( "Entrar" )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col items-center gap-2">
            <div className="text-center text-sm">
              Não tem uma conta?{" "}
              <Link to="/cadastro" className="underline font-semibold">
                Cadastre-se
              </Link>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Se você é administrador,{" "}
              <Link to="/admin-login" className="text-fifa-blue hover:underline">
                acesse a área administrativa
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default Login;