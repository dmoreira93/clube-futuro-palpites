
import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

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

  // Regular user login
  const login = async (email: string, password: string) => {
    // In a real app, this would authenticate against a backend
    // For this demo, we'll use a simple simulation
    
    try {
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

  // Admin-specific login
  const adminLogin = async (username: string, password: string) => {
    // Hard-coded admin credentials - in a real app these would be stored securely
    // and verified on a backend server
    const ADMIN_USERNAME = "admin";
    const ADMIN_PASSWORD = "copa2025";
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const adminUser = {
          id: "admin1",
          name: "Administrador",
          email: "admin@example.com",
          isAdmin: true,
        };
        
        setUser(adminUser);
        localStorage.setItem("bolao_user", JSON.stringify(adminUser));
        
        toast({
          title: "Login de administrador concluído",
          description: "Você agora tem acesso à área de administração.",
        });
        
        return true;
      } else {
        toast({
          title: "Acesso negado",
          description: "Credenciais de administrador inválidas.",
          variant: "destructive",
        });
        return false;
      }
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
