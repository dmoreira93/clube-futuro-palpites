// src/pages/Login.tsx
import Layout from "@/components/layout/Layout"; // <-- ADICIONE ESTA LINHA FALTANTE
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

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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
        toast({
            title: "Erro de Validação",
            description: "Por favor, preencha todos os campos.",
            variant: "destructive"
        });
        return;
    }
    
    setIsSubmitting(true);
    try {
      const success = await login(formData.email, formData.password);
      if (!success) {
        throw new Error("Email ou senha inválidos.");
      }
    } catch (error: any) {
      console.error("Erro ao fazer login no componente:", error);
      const errorMessage = error.message || "Ocorreu um erro inesperado no login. Tente novamente.";
      setLoginError(errorMessage);
      toast({
        title: "Erro ao Fazer Login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoadingAuth) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Apenas uma verificação de segurança extra para não renderizar se o useEffect for redirecionar
  if (isAuthenticated) {
      return null;
  }

  return (
    <Layout>
        {/* Todo o seu JSX de layout original vai aqui... */}
    </Layout>
  );
};

export default Login;