// src/pages/Login.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LogInIcon, Loader2, InfoIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast"; // <-- 1. MUDANÇA: Importação correta
import { Alert, AlertDescription } from "@/components/ui/alert";

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoadingAuth, isFirstLogin } = useAuth();
  const { toast } = useToast(); // <-- 2. MUDANÇA: Usando o hook do shadcn/ui
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (!formData.email || !formData.password) {
      // 3. MUDANÇA: Chamada da função toast com a sintaxe correta
      toast({
        title: "Erro de Validação",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await login(formData.email, formData.password);
      // O redirecionamento é tratado no useEffect
    } catch (error: any) {
      console.error("Erro ao fazer login no componente:", error);
      // 3. MUDANÇA: Chamada da função toast com a sintaxe correta
      toast({
        title: "Erro ao Fazer Login",
        description: "Ocorreu um erro inesperado no login. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // O resto do seu JSX permanece o mesmo do seu arquivo original
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