// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AuthContextType = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  user: UserType | null;
  isLoadingAuth: boolean;
};

type UserType = {
  id: string;
  email: string;
  name: string;
  nickname: string;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      setIsLoadingAuth(true);
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const userMetadata = data.session.user.user_metadata;
        const userData: UserType = {
          id: data.session.user.id,
          email: data.session.user.email || "",
          name: userMetadata?.name || "",
          nickname: userMetadata?.nickname || "",
          isAdmin: userMetadata?.isAdmin || false,
        };
        setUser(userData);
        void syncWithUsersCustom(userData);
      }
      setIsLoadingAuth(false);
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        const userMetadata = session.user.user_metadata;
        const userData: UserType = {
          id: session.user.id,
          email: session.user.email || "",
          name: userMetadata?.name || "",
          nickname: userMetadata?.nickname || "",
          isAdmin: userMetadata?.isAdmin || false,
        };
        setUser(userData);
        void syncWithUsersCustom(userData);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data.session) {
        toast.error(error?.message || "Erro ao fazer login. Verifique suas credenciais.");
        return false;
      }

      const userMetadata = data.session.user.user_metadata;
      const userData: UserType = {
        id: data.session.user.id,
        email: data.session.user.email || "",
        name: userMetadata?.name || "",
        nickname: userMetadata?.nickname || "",
        isAdmin: userMetadata?.isAdmin || false,
      };
      setUser(userData);
      void syncWithUsersCustom(userData);

      toast.success("Login realizado com sucesso!");
      return true;
    } catch (error) {
      toast.error("Ocorreu um erro no login. Tente novamente.");
      console.error("Erro ao fazer login:", error);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.success("Logout realizado com sucesso.");
  };

  const syncWithUsersCustom = async (user: UserType) => {
    console.log("Sincronizando user_custom para:", user.id);

    const { data, error: selectError } = await supabase
      .from("users_custom")
      .select("id")
      .eq("id", user.id)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      console.error("Erro ao buscar usuário em users_custom:", selectError);
      return;
    }

    if (!data) {
      const { error: insertError } = await supabase.from("users_custom").insert([
        {
          id: user.id,
          name: user.name,
          username: user.nickname,
          password: "", // campo opcional ou placeholder
          is_admin: user.isAdmin || false,
          avatar_url: "",
          first_login: true,
        },
      ]);

      if (insertError) {
        console.error("Erro ao criar usuário em users_custom:", insertError);
      } else {
        console.log("Usuário criado em users_custom:", user.id);
      }
    } else {
      console.log("Usuário já existe em users_custom:", user.id);
    }
  };

  const contextValue = {
    isAuthenticated: !!user,
    isAdmin: !!user?.isAdmin,
    login,
    logout,
    user,
    isLoadingAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {!isLoadingAuth && children}
      {isLoadingAuth && (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin h-8 w-8 border-4 border-fifa-blue border-t-transparent rounded-full"></div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
