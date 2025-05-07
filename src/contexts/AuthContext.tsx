
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
    const checkSession = async () => {
      // Verificar se há uma sessão ativa no Supabase
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        const { user: authUser } = data.session;
        
        // Buscar informações adicionais do usuário se necessário
        if (authUser) {
          // Verificar se é admin
          const { data: adminData } = await supabase
            .from('administrators')
            .select('*')
            .eq('email', authUser.email)
            .single();
          
          const userProfile = {
            id: authUser.id,
            name: authUser.user_metadata.name || authUser.email?.split('@')[0] || 'Usuário',
            email: authUser.email || '',
            isAdmin: !!adminData
          };
          
          setUser(userProfile);
          localStorage.setItem("bolao_user", JSON.stringify(userProfile));
        }
      } else {
        // Verificar o armazenamento local como fallback
        const storedUser = localStorage.getItem("bolao_user");
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            localStorage.removeItem("bolao_user");
          }
        }
      }
    };
    
    checkSession();
  }, []);

  // Regular user login
  const login = async (email: string, password: string) => {
    try {
      // Tentar login via Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Se estamos em desenvolvimento ou testando, permitir um login mock
        if (import.meta.env.DEV) {
          console.warn("Login via Supabase falhou, usando mock para desenvolvimento:", error.message);
          const mockUser = {
            id: "user1",
            name: "Usuário Teste",
            email,
            isAdmin: false,
          };
          
          setUser(mockUser);
          localStorage.setItem("bolao_user", JSON.stringify(mockUser));
          
          toast({
            title: "Login de desenvolvimento",
            description: `Bem-vindo, ${mockUser.name}! (Modo de desenvolvimento)`,
          });
          
          return true;
        }
        
        toast({
          title: "Erro ao fazer login",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }
      
      if (data.user) {
        const userProfile = {
          id: data.user.id,
          name: data.user.user_metadata.name || data.user.email?.split('@')[0] || 'Usuário',
          email: data.user.email || '',
          isAdmin: false // Assumimos que não é admin por padrão
        };
        
        setUser(userProfile);
        localStorage.setItem("bolao_user", JSON.stringify(userProfile));
        
        toast({
          title: "Login realizado com sucesso",
          description: `Bem-vindo, ${userProfile.name}!`,
        });
        
        return true;
      }
      
      return false;
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
    // Fazer logout no Supabase
    await supabase.auth.signOut();
    
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
