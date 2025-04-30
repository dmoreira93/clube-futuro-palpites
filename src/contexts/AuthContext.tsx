
import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AuthContextType = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  adminLogin: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  user: UserType | null;
};

type UserType = {
  id: string;
  name: string;
  email: string;
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
    const storedUser = localStorage.getItem("bolao_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("bolao_user");
      }
    }
  }, []);

  // Regular user login (modificado para usar Supabase)
  const login = async (email: string, password: string) => {
    try {
      // Em uma versão futura, vamos conectar com autenticação real do Supabase
      // Por agora, manteremos o mock para compatibilidade
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful login (would be replaced with actual backend auth)
      const mockUser = {
        id: "user1",
        name: "Usuário Teste",
        email,
        isAdmin: false,
      };
      
      setUser(mockUser);
      localStorage.setItem("bolao_user", JSON.stringify(mockUser));
      
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${mockUser.name}!`,
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Erro ao fazer login",
        description: "Ocorreu um erro durante o login. Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Admin-specific login (atualizado para usar o Supabase)
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
        email: data.email,
        isAdmin: true,
      };
      
      setUser(adminUser);
      localStorage.setItem("bolao_user", JSON.stringify(adminUser));
      
      toast({
        title: "Login de administrador concluído",
        description: "Você agora tem acesso à área de administração.",
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Erro ao fazer login",
        description: "Ocorreu um erro durante o login. Tente novamente.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Logout function
  const logout = () => {
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
