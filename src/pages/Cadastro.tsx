// src/pages/Cadastro.tsx - VERSÃO ATUALIZADA

import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom"; // Importa useNavigate e useParams
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
import { useToast } from "@/hooks/use-toast"; // Verifique se o caminho está correto
import { Label } from "@/components/ui/label";
import { UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";


const Cadastro = () => {
  const { toast } = useToast();
  const navigate = useNavigate(); // Hook para navegação
  const { inviteCode } = useParams(); // Pega o código de convite da URL, se existir

  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (inviteCode) {
      toast({
        title: "Convite Aceito!",
        description: `Você está se cadastrando para entrar em um bolão. Complete seu cadastro.`,
      });
    }
  }, [inviteCode, toast]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.nickname || !formData.email || !formData.password) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "A senha e a confirmação de senha devem ser iguais.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
        let poolId = null;

        // Se um código de convite foi passado pela URL, verifica se ele é válido
        if (inviteCode) {
            const { data: pool, error: poolError } = await supabase
              .from('pools')
              .select('id')
              .eq('invite_code', inviteCode.trim().toUpperCase())
              .single();
            
            if (poolError || !pool) {
              throw new Error("Código de convite inválido ou não encontrado.");
            }
            poolId = pool.id;
        }

        // Tenta criar o usuário com a senha
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
              data: {
                name: formData.name,
                username: formData.nickname,
                // Associa o pool_id no momento do cadastro se houver um código
                pool_id: poolId 
              },
            },
        });

        if (signUpError) {
            throw signUpError;
        }

        if (!authData.user) {
            throw new Error("Não foi possível criar o usuário. Tente novamente.");
        }

        toast({
            title: "Cadastro realizado com sucesso!",
            description: "Enviamos um e-mail de confirmação. Por favor, verifique sua caixa de entrada.",
        });

        navigate('/login'); // Redireciona para o login após o sucesso

    } catch (error: any) {
        toast({
            title: "Erro ao cadastrar",
            description: error.message || "Ocorreu um erro desconhecido.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-fifa-blue">Cadastro de Participante</h1>
        <p className="text-gray-600 mt-2">
          Junte-se ao nosso bolão da Copa Mundial de Clubes FIFA 2025
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <div className="bg-fifa-blue rounded-full p-3">
              <UserIcon className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-center">Crie sua conta</CardTitle>
          <CardDescription className="text-center">
            Preencha seus dados para participar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Digite seu nome completo"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nickname">Apelido</Label>
                <Input
                  id="nickname"
                  name="nickname"
                  placeholder="Como você quer ser chamado no ranking"
                  value={formData.nickname}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Digite seu e-mail"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Crie uma senha"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirme sua senha"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-fifa-blue hover:bg-opacity-90"
                disabled={isSubmitting}
              >
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cadastrando...</> : "Cadastrar"}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <div className="text-center w-full text-sm">
            Já tem uma conta?{" "}
            <Link to="/login" className="text-fifa-blue hover:underline font-medium">
              Faça login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Cadastro;