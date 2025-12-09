import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LoginGoogle } from "@/components/auth/LoginGoogle"; 
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
import { Loader2, BarChart3, ShieldCheck } from "lucide-react";

const HERO_BG_IMAGE = "/hero-bg.png";

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading, user, fetchAndSyncProfile } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- LÓGICA DE REDIRECIONAMENTO INTELIGENTE ---
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      // 1. Prioridade: Se não tem apelido (username), vai completar perfil
      if (!user.username) {
        navigate("/complete-profile");
        return;
      }

      // 2. Se for primeiro login
      if (user.first_login) {
        // Verifica se é login social (Google/Apple)
        const isSocial = user.app_metadata?.provider !== 'email';
        
        // Se for Social, pula a troca de senha e vai pro Dashboard
        if (isSocial) {
            navigate("/dashboard");
        } else {
            // Se for Email/Senha, obriga a trocar a senha provisória
            navigate("/change-password");
        }
      } else {
        // 3. Usuário normal, vai pro Dashboard
        navigate("/dashboard");
      }
    }
  }, [isAuthenticated, loading, user, navigate]);

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
    try {
      const { success, error } = await login(formData.email, formData.password);
      
      if (!success) {
        throw error || new Error("Ocorreu um erro desconhecido durante o login.");
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
          const profile = await fetchAndSyncProfile(session.user);
          
          // Aplica a mesma lógica de redirecionamento aqui para garantir rapidez
          if (profile) {
             if (!profile.username) {
                 navigate("/complete-profile");
             } else if (profile.first_login) {
                 navigate("/change-password"); // Login por senha sempre cai aqui se for first_login
             } else {
                 navigate("/dashboard");
             }
             return;
          }
      }
      
    } catch (error: any) {
      console.error("Erro no login:", error);
      toast({
        title: "Erro no Login",
        description: error.message || "Email ou senha inválidos.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-fifa-blue text-white gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-fifa-gold" />
        <p className="text-lg animate-pulse">A carregar o estádio...</p>
      </div>
    );
  }

  return (
    <div 
        className="min-h-screen flex items-center justify-center bg-cover bg-center py-12 px-4 sm:px-6 lg:px-8 relative"
        style={{ 
            backgroundImage: `url('${HERO_BG_IMAGE}')`,
            backgroundPosition: 'center top'
        }}
    >
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
            Entre para acessar seus palpites e ver sua pontuação
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* LOGIN SOCIAL */}
            <LoginGoogle />

            <div className="relative my-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-300" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500 font-medium">Ou com e-mail</span></div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="seu@email.com" 
                value={formData.email} 
                onChange={handleChange} 
                required 
                className="border-gray-300 focus:border-fifa-blue focus:ring-fifa-blue"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
              </div>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                placeholder="******" 
                value={formData.password} 
                onChange={handleChange} 
                required 
                className="border-gray-300 focus:border-fifa-blue focus:ring-fifa-blue"
              />
            </div>
            <Button 
                type="submit" 
                className="w-full bg-fifa-blue hover:bg-blue-900 font-bold py-2 transition-all duration-200 shadow-md" 
                disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> A entrar...</>
              ) : ( "Entrar" )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 items-center">
          <div className="text-center text-sm text-gray-600">
            Ainda não tem conta?{" "}
            <Link to="/cadastro" className="text-fifa-blue font-bold hover:underline">
              Cadastre-se grátis
            </Link>
          </div>
          
          <Link to="/admin-login" className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors mt-2">
            <ShieldCheck className="h-3 w-3" /> Acesso Administrativo
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;