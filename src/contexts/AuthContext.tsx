
import { useState } from "react";
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
import { LogInIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      
      if (success) {
        toast.success("Login realizado com sucesso!");
        navigate("/palpites");
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      toast.error("Ocorreu um erro no login. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  {isSubmitting ? "Entrando..." : "Entrar"}
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