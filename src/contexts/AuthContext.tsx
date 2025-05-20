
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AuthContextType = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  user: UserType | null;
};

type UserType = {
  id: string;
  email: string;
  isAdmin: boolean;
};

// Default context values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isAdmin: false,
  login: async () => false,
  logout: () => {},
  user: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  
  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const userMetadata = data.session.user.user_metadata;
        setUser({
          id: data.session.user.id,
          email: data.session.user.email,
          isAdmin: userMetadata.isAdmin || false,
        });
      }
    };
    
    checkSession();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        const userMetadata = session.user.user_metadata;
        setUser({
          id: session.user.id,
          email: session.user.email,
          isAdmin: userMetadata.isAdmin || false,
        });
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Regular user login using email/password
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data.session) {
        toast.error(error?.message || "Erro ao fazer login. Verifique suas credenciais.");
        return false;
      }

      const userMetadata = data.session.user.user_metadata;
      setUser({
        id: data.session.user.id,
        email: data.session.user.email,
        isAdmin: userMetadata.isAdmin || false,
      });

      toast.success("Login realizado com sucesso!");
      return true;
    } catch (error) {
      toast.error("Ocorreu um erro no login. Tente novamente.");
      console.error("Erro ao fazer login:", error);
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.success("Logout realizado com sucesso.");
  };

  const contextValue = {
    isAuthenticated: !!user,
    isAdmin: !!user?.isAdmin,
    login,
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
