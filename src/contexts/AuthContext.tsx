// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from '@supabase/supabase-js';

// --- DEFINIÇÃO DO TIPO DE USUÁRIO COM first_login EisAdmin ---
export type UserType = User & {
  name?: string;
  nickname?: string;
  isAdmin?: boolean; // Para refletir o campo 'is_admin' da sua tabela 'users_custom'
  first_login?: boolean; // Para refletir o campo 'first_login' da sua tabela 'users_custom'
};

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  user: UserType | null;
  isLoadingAuth: boolean;
  isFirstLogin: boolean; // <-- NOVO: Estado para controlar o primeiro login
  updateUserProfile: (updates: Partial<UserType>) => Promise<void>; // <-- NOVO: Função para atualizar o perfil
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false); // <-- NOVO ESTADO

  // Função para buscar e sincronizar o perfil do usuário
  const fetchAndSyncProfile = async (sessionUser: User) => {
    // Buscar informações do perfil do usuário na sua tabela 'users_custom'
    const { data: profile, error: profileError } = await supabase
      .from('users_custom')
      .select('name, username, is_admin, first_login') // Incluir 'username', 'is_admin' E 'first_login'
      .eq('id', sessionUser.id)
      .single();

    let combinedUser: UserType;
    let currentIsFirstLogin = false; // Valor padrão otimista

    if (profileError && profileError.code === 'PGRST116') { // PGRST116 = no rows found
      // Perfil não encontrado: é um novo usuário, precisa criar o perfil
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
        // Se a criação falhar, o comportamento pode ser indefinido.
        // Talvez seja melhor lançar um erro ou redirecionar para um erro genérico.
      } else {
        console.log("Perfil criado com sucesso em users_custom.");
        combinedUser = {
            ...sessionUser,
            name: sessionUser.user_metadata?.name || "",
            nickname: sessionUser.user_metadata?.nickname || "",
            isAdmin: sessionUser.user_metadata?.is_admin || false,
            first_login: false, // Perfil recém-criado, então é o primeiro login
        };
        currentIsFirstLogin = true; // É o primeiro login para este usuário
      }

    } else if (profileError) {
      // Outro erro ao buscar o perfil (não "no rows found")
      console.error("Erro ao buscar perfil:", profileError);
      // Fallback: usar apenas os dados do Supabase Auth
      combinedUser = { ...sessionUser };
      currentIsFirstLogin = false; // Não podemos determinar, assume false
    } else {
      // Perfil encontrado com sucesso
      combinedUser = {
        ...sessionUser,
        name: profile.name,
        nickname: profile.username, // Mapear 'username' do DB para 'nickname' no seu UserType
        isAdmin: profile.is_admin, // Mapear 'is_admin' do DB para 'isAdmin' no seu UserType
        first_login: profile.first_login,
      };
      // A lógica para 'isFirstLogin': será true SE first_login no DB for FALSE.
      currentIsFirstLogin = !profile.first_login;
    }

    setUser(combinedUser);
    setIsFirstLogin(currentIsFirstLogin);
    setIsLoadingAuth(false); // Sinaliza que o carregamento terminou
  };

  useEffect(() => {
    const checkAuthAndProfile = async () => {
      setIsLoadingAuth(true);
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await fetchAndSyncProfile(data.session.user);
      } else {
        setUser(null);
        setIsFirstLogin(false);
        setIsLoadingAuth(false);
      }
    };

    checkAuthAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoadingAuth(true); // Manter carregamento durante a mudança de estado
      if (event === "SIGNED_IN" && session) {
        await fetchAndSyncProfile(session.user);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setIsFirstLogin(false);
        setIsLoadingAuth(false);
      }
      // O 'SIGNED_OUT' e outros eventos também devem finalizar o carregamento.
      // fetchAndSyncProfile já seta isLoadingAuth para false.
      // Se não for SIGND_IN nem SIGNED_OUT, devemos ter um fallback para false.
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoadingAuth(true); // Garante que o loading está ativo durante o login
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data.session) {
        toast.error(error?.message || "Erro ao fazer login. Verifique suas credenciais.");
        setIsLoadingAuth(false); // Parar loading em caso de erro
        return false;
      }

      await fetchAndSyncProfile(data.session.user); // Irá definir user, isFirstLogin e isLoadingAuth
      toast.success("Login realizado com sucesso!");
      return true;
    } catch (error) {
      toast.error("Ocorreu um erro no login. Tente novamente.");
      console.error("Erro ao fazer login:", error);
      setIsLoadingAuth(false); // Parar loading em caso de erro
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsFirstLogin(false); // Resetar isFirstLogin ao deslogar
    toast.success("Logout realizado com sucesso.");
  };

  // Nova função para atualizar o perfil do usuário na tabela `users_custom`
  const updateUserProfile = async (updates: Partial<UserType>) => {
    if (!user || !user.id) {
      console.error("Não há usuário logado para atualizar o perfil.");
      toast.error("Erro: Nenhum usuário logado para atualizar.");
      return;
    }

    // Mapear propriedades do UserType para nomes de coluna do DB se necessário
    const dbUpdates: { [key: string]: any } = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.nickname !== undefined) dbUpdates.username = updates.nickname; // 'nickname' -> 'username'
    if (updates.isAdmin !== undefined) dbUpdates.is_admin = updates.isAdmin; // 'isAdmin' -> 'is_admin'
    if (updates.first_login !== undefined) dbUpdates.first_login = updates.first_login; // 'first_login' -> 'first_login'

    const { error } = await supabase
      .from('users_custom') // Sua tabela de perfis
      .update(dbUpdates) // Usar o objeto mapeado
      .eq('id', user.id);

    if (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error(`Falha ao atualizar perfil: ${error.message}`);
      throw error; // Lançar o erro para quem chamar a função poder tratar
    }

    // Atualiza o estado local do usuário e isFirstLogin
    setUser(prevUser => {
      if (!prevUser) return null;
      // Assegure que as propriedades são atualizadas no objeto local
      const updatedUser = {
        ...prevUser,
        ...updates,
      } as UserType; // Type assertion para garantir o tipo

      // Se first_login foi atualizado para true, atualize o estado isFirstLogin para false
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
      {children}
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