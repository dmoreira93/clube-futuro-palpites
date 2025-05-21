// src/pages/Login.tsx

import { useState, useEffect } from "react"; // Adicionado useEffect
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { LogInIcon, Loader2 } from "lucide-react"; // Importe Loader2
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoadingAuth, isFirstLogin } = useAuth(); // Obtenha isAuthenticated, isLoadingAuth, isFirstLogin
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirecionamento após o login/verificação de autenticação
  useEffect(() => {
    // Se ainda está carregando a autenticação, não faça nada.
    if (isLoadingAuth) {
      return;
    }

    if (isAuthenticated) {
      if (isFirstLogin) {
        navigate('/change-password'); // Redireciona para a página de alteração de senha
      } else {
        navigate('/'); // Redireciona para a página principal (ou palpites, como você já tem)
      }
    }
  }, [isAuthenticated, isLoadingAuth, isFirstLogin, navigate]); // Adicionado isFirstLogin como dependência

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
      toast.error("Por favor, preencha todos os campos");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await login(formData.email, formData.password);

      // O redirecionamento agora é feito no useEffect, após o estado de autenticação ser atualizado
      // Não precisamos de um navigate aqui, pois o useEffect vai cuidar disso.
      // Se a função `login` retornar sucesso, o `useEffect` será acionado.
    } catch (error) {
      // O toast.error já é tratado dentro da função login, se for erro do Supabase
      console.error("Erro ao fazer login no componente:", error); // Para erros inesperados
      toast.error("Ocorreu um erro inesperado no login. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Se estiver carregando a autenticação ou já autenticado (e não é o primeiro login),
  // mostra um loader para evitar o "flash" do formulário de login antes do redirecionamento.
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

  // Se o usuário está autenticado E é o primeiro login, mas o useEffect ainda não redirecionou,
  // evita renderizar o formulário de login novamente.
  if (isAuthenticated && isFirstLogin) {
    return null;
  }

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