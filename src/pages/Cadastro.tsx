import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
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
import { useToast } from "@/components/ui/use-toast"; 
import { Label } from "@/components/ui/label";
import { UserIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const HERO_BG_IMAGE = "/hero-bg.png";

const Cadastro = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { inviteCode } = useParams();

  const [formData, setFormData] = useState({
    name: "",
    username: "", // Usaremos username como identificador de login
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
    
    if (!formData.name || !formData.username || !formData.password) {
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

        // TRUQUE DO DOMÍNIO FANTASMA: Cria um email falso baseado no username
        const formatUsername = formData.username.trim().toLowerCase();
        const emailForSupabase = `${formatUsername}@app.com`;

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email: emailForSupabase,
            password: formData.password,
            options: {
              data: {
                name: formData.name,
                username: formatUsername,
                pool_id: poolId 
              },
            },
        });

        if (signUpError) {
            // Se o erro for de email já cadastrado, traduzimos para usuário já cadastrado
            if (signUpError.message.includes("User already registered")) {
                throw new Error("Este usuário já está em uso. Tente outro.");
            }
            throw signUpError;
        }

        if (!authData.user) {
            throw new Error("Não foi possível criar o usuário. Tente novamente.");
        }

        toast({
            title: "Cadastro realizado com sucesso!",
            description: "Você já pode fazer o login com seu usuário.",
        });

        navigate('/login'); 

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
                <UserIcon className="h-8 w-8 text-fifa-gold" />
             </div>
          </div>
          <CardTitle className="text-2xl font-bold text-fifa-blue">Crie sua conta</CardTitle>
          <CardDescription>
             {inviteCode ? "Complete seu cadastro para participar do bolão." : "Junte-se ao Futuro Palpites e comece a jogar."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ex: Diogo Moreira"
                value={formData.name}
                onChange={handleChange}
                required
                className="border-gray-300 focus:border-fifa-blue focus:ring-fifa-blue"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Usuário (Usado para acessar)</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Ex: dmoreira"
                value={formData.username}
                onChange={handleChange}
                required
                className="border-gray-300 focus:border-fifa-blue focus:ring-fifa-blue lowercase"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
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
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="******"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="border-gray-300 focus:border-fifa-blue focus:ring-fifa-blue"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-fifa-blue text-white hover:bg-blue-900 font-bold py-2 transition-all duration-200 shadow-md hover:shadow-lg" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cadastrando...
                </>
              ) : (
                "Cadastrar"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-gray-600">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-fifa-blue font-bold hover:underline">
              Faça login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Cadastro;