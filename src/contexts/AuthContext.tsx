// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from '@supabase/supabase-js';

export type UserType = User & {
  name?: string;
  nickname?: string;
  isAdmin?: boolean;
  first_login?: boolean;
};

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  user: UserType | null;
  isLoadingAuth: boolean;
  isFirstLogin: boolean;
  updateUserProfile: (updates: Partial<UserType>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  const fetchAndSyncProfile = async (sessionUser: User) => {
    const { data: profile, error: profileError } = await supabase
      .from('users_custom')
      .select('name, username, is_admin, first_login')
      .eq('id', sessionUser.id)
      .single();

    let combinedUser: UserType;
    let currentIsFirstLogin = false;

    if (profileError && profileError.code === 'PGRST116') {
      console.log("Perfil não encontrado em users_custom. Criando novo perfil...");
      const { error: insertError } = await supabase.from("users_custom").insert([
        {
          id: sessionUser.id,
          name: sessionUser.user_metadata?.name || "",
          username: sessionUser.user_metadata?.nickname || "",
          is_admin: sessionUser.user_metadata?.is_admin || false,
          avatar_url: "",
          first_login: false, // <-- IMPORTANTE: NOVO USUÁRIO SEMPRE COM first_login: FALSE
        },
      ]);

      if (insertError) {
        console.error("Erro ao criar perfil em users_custom:", insertError);
      } else {
        console.log("Perfil criado com sucesso em users_custom.");
        combinedUser = {
            ...sessionUser,
            name: sessionUser.user_metadata?.name || "",
            nickname: sessionUser.user_metadata?.nickname || "",
            isAdmin: sessionUser.user_metadata?.is_admin || false,
            first_login: false,
        };
        currentIsFirstLogin = true;
      }
    } else if (profileError) {
      console.error("Erro ao buscar perfil:", profileError);
      combinedUser = { ...sessionUser };
      currentIsFirstLogin = false;
    } else {
      combinedUser = {
        ...sessionUser,
        name: profile.name,
        nickname: profile.username,
        isAdmin: profile.is_admin,
        first_login: profile.first_login,
      };
      currentIsFirstLogin = !profile.first_login;
    }

    setUser(combinedUser);
    setIsFirstLogin(currentIsFirstLogin);
    setIsLoadingAuth(false);
  };

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      setIsLoadingAuth(true); // Garante que começa carregando
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await fetchAndSyncProfile(data.session.user);
      } else {
        setUser(null);
        setIsFirstLogin(false);
        setIsLoadingAuth(false); // Sempre definir para false no final, mesmo sem sessão
      }
    };

    checkAuthAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoadingAuth(true);
      if (event === "SIGNED_IN" && session) {
        await fetchAndSyncProfile(session.user);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setIsFirstLogin(false);
        setIsLoadingAuth(false); // Sempre definir para false no final
      }
      // Para outros eventos que não alteram a sessão de forma significativa, também parar o loading
      // (ex: UserUpdated, PasswordRecovery)
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT") {
         setIsLoadingAuth(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoadingAuth(true);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data.session) {
        toast.error(error?.message || "Erro ao fazer login. Verifique suas credenciais.");
        setIsLoadingAuth(false);
        return false;
      }

      await fetchAndSyncProfile(data.session.user);
      toast.success("Login realizado com sucesso!");
      return true;
    } catch (error) {
      toast.error("Ocorreu um erro no login. Tente novamente.");
      console.error("Erro ao fazer login:", error);
      setIsLoadingAuth(false);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsFirstLogin(false);
    toast.success("Logout realizado com sucesso.");
  };

  const updateUserProfile = async (updates: Partial<UserType>) => {
    if (!user || !user.id) {
      console.error("Não há usuário logado para atualizar o perfil.");
      toast.error("Erro: Nenhum usuário logado para atualizar.");
      return;
    }

    const dbUpdates: { [key: string]: any } = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.nickname !== undefined) dbUpdates.username = updates.nickname;
    if (updates.isAdmin !== undefined) dbUpdates.is_admin = updates.isAdmin;
    if (updates.first_login !== undefined) dbUpdates.first_login = updates.first_login;

    const { error } = await supabase
      .from('users_custom')
      .update(dbUpdates)
      .eq('id', user.id);

    if (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error(`Falha ao atualizar perfil: ${error.message}`);
      throw error;
    }

    setUser(prevUser => {
      if (!prevUser) return null;
      const updatedUser = {
        ...prevUser,
        ...updates,
      } as UserType;

      if (updates.first_login === true) {
        setIsFirstLogin(false);
      }
      return updatedUser;
    });

    toast.success("Perfil atualizado com sucesso!");
  };

  const contextValue = {
    isAuthenticated: !!user,
    isAdmin: !!user?.isAdmin,
    login,
    logout,
    user,
    isLoadingAuth,
    isFirstLogin,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children} {/* <--- RENDERIZA OS FILHOS SEMPRE */}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};