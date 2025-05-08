
import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AuthContextType = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  adminLogin: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  user: UserType | null;
};

type UserType = {
  id: string;
  name: string;
  username: string;
  isAdmin: boolean;
};

// Default context values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isAdmin: false,
  login: async () => false,
  adminLogin: async () => false,
  logout: () => {},
  user: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [user, setUser] = useState<UserType | null>(null);
  
  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      // Verificar o armazenamento local como primeiro método
      const storedUser = localStorage.getItem("bolao_user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          console.log("Usuário restaurado do localStorage");
        } catch (e) {
          localStorage.removeItem("bolao_user");
          console.error("Erro ao restaurar usuário do localStorage:", e);
        }
      }
    };
    
    checkSession();
  }, []);

  // Regular user login using username/password
  const login = async (username: string, password: string) => {
    try {
      if (!username || !password) {
        toast({
          title: "Dados incompletos",
          description: "Por favor, preencha o nome de usuário e a senha",
          variant: "destructive",
        });
        return false;
      }
      
      // Consultar tabela personalizada de usuários
      const { data, error } = await supabase
        .from('users_custom')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !data) {
        console.error("Erro ao fazer login:", error);
        toast({
          title: "Erro ao fazer login",
          description: "Nome de usuário ou senha incorretos",
          variant: "destructive",
        });
        return false;
      }
      
      // Criar objeto de usuário
      const userProfile = {
        id: data.id,
        name: data.name,
        username: data.username,
        isAdmin: data.is_admin || false
      };
      
      // Salvar usuário na sessão
      setUser(userProfile);
      localStorage.setItem("bolao_user", JSON.stringify(userProfile));
      
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${userProfile.name}!`,
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: "Ocorreu um erro durante o login. Tente novamente.",
        variant: "destructive",
      });
      console.error("Erro de login:", error);
      return false;
    }
  };

  // Admin-specific login
  const adminLogin = async (username: string, password: string) => {
    try {
      // Verificar se o administrador existe no banco de dados do Supabase
      const { data, error } = await supabase
        .from('administrators')
        .select('*')
        .eq('email', username)
        .eq('password', password)
        .single();
      
      if (error || !data) {
        toast({
          title: "Acesso negado",
          description: "Credenciais de administrador inválidas.",
          variant: "destructive",
        });
        return false;
      }
      
      const adminUser = {
        id: data.id,
        name: data.name,
        username: data.email,
        isAdmin: true,
      };
      
      setUser(adminUser);
      localStorage.setItem("bolao_user", JSON.stringify(adminUser));
      
      toast({
        title: "Login de administrador concluído",
        description: "Você agora tem acesso à área de administração.",
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: "Ocorreu um erro durante o login. Tente novamente.",
        variant: "destructive",
      });
      console.error("Erro de login de administrador:", error);
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    // Limpar os dados locais
    setUser(null);
    localStorage.removeItem("bolao_user");
    
    toast({
      title: "Logout realizado",
      description: "Você foi desconectado com sucesso.",
    });
  };

  const contextValue = {
    isAuthenticated: !!user,
    isAdmin: !!user?.isAdmin,
    login,
    adminLogin,
    logout,
    user,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
