// src/pages/Login.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast"; // <-- 1. Importação CORRETA
import { Loader2 } from "lucide-react";

const Login = () => {
  const { toast } = useToast(); // <-- 2. Usando o hook do shadcn/ui
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading, isFirstLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (user && isFirstLogin) {
        navigate("/change-password", { replace: true });
      } else if (user) {
        navigate("/", { replace: true });
      }
    }
  }, [user, authLoading, isFirstLogin, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        throw signInError;
      }
      
      // A navegação agora é tratada pelo useEffect acima, que reage à mudança do estado de 'user'.
      
    } catch (error: any) {
      console.error("Erro ao fazer login no componente:", error);
      const errorMessage = "Email ou senha inválidos. Verifique suas credenciais e tente novamente.";
      setError(errorMessage);
      // 3. Chamando a notificação CORRETA
      toast({
        title: "Erro no Login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Entre com seu email e senha para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="m@example.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Senha</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                />
              </div>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Não tem uma conta?{" "}
            <Link to="/cadastro" className="underline">
              Cadastre-se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;