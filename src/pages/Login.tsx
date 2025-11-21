import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Loader2, BarChart3, ShieldCheck } from "lucide-react";

const HERO_BG_IMAGE = "/hero-bg.png";

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoadingAuth, isFirstLogin } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated) {
      navigate(isFirstLogin ? "/change-password" : "/dashboard");
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
    try {
      const { success, error } = await login(formData.email, formData.password);
      if (!success) {
        throw error || new Error("Ocorreu um erro desconhecido durante o login.");
      }
      setLoginSuccess(true);
    } catch (error: any) {
      toast({
        title: "Erro no Login",
        description: error.message || "Email ou senha inválidos. Tente novamente.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  if (isLoadingAuth || loginSuccess) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-fifa-blue text-white gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-fifa-gold" />
        <p className="text-lg animate-pulse">Entrando no campo...</p>
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
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...</>
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
          
          {/* Link para Admin Login (Discreto) */}
          <Link to="/admin-login" className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors mt-2">
            <ShieldCheck className="h-3 w-3" /> Acesso Administrativo
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;