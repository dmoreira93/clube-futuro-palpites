// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from '@supabase/supabase-js'; // Importar o tipo User do supabase-js

// --- DEFINIÇÃO DO TIPO DE USUÁRIO COM first_login ---
// Este tipo combina o tipo User do Supabase com as propriedades do seu perfil customizado.
export type UserType = User & { // Estende o tipo User do Supabase
  name?: string;
  nickname?: string;
  isAdmin?: boolean; // Use isAdmin como opcional, pois nem sempre estará presente no objeto User
  first_login?: boolean; // <-- NOVA PROPRIEDADE PARA O PRIMEIRO LOGIN
};

type AuthContextType = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  user: UserType | null;
  isLoadingAuth: boolean;
  isFirstLogin: boolean; // <-- NOVO ESTADO EXPOSTO PELO CONTEXTO
  updateUserProfile: (updates: Partial<UserType>) => Promise<void>; // <-- NOVA FUNÇÃO
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => { // Alterado React.ReactNode para ReactNode
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false); // <-- NOVO ESTADO

  // Função para buscar e sincronizar o perfil do usuário
  const fetchAndSyncProfile = async (sessionUser: User) => {
    // Buscar informações do perfil do usuário na sua tabela 'users_custom'
    const { data: profile, error: profileError } = await supabase
      .from('users_custom')
      .select('name, username, is_admin, first_login') // Incluir 'username' e 'is_admin' que você já usa, e 'first_login'
      .eq('id', sessionUser.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = no rows found (ok se for um novo usuário sem perfil ainda)
      console.error("Erro ao buscar perfil:", profileError);
      // Aqui você pode decidir se quer lançar um erro ou apenas logar
    }

    let combinedUser: UserType;
    let currentIsFirstLogin = true; // Assume true por padrão para novos usuários ou perfis sem first_login

    if (profile) {
        combinedUser = {
            ...sessionUser,
            name: profile.name,
            nickname: profile.username, // Mapear 'username' do DB para 'nickname' no seu UserType
            isAdmin: profile.is_admin, // Mapear 'is_admin' do DB para 'isAdmin' no seu UserType
            first_login: profile.first_login,
        };
        currentIsFirstLogin = !profile.first_login; // Se profile.first_login for false, então é o primeiro login
    } else {
        // Se não encontrou perfil, cria um novo (ou garante que existe com first_login: false)
        // Isso é crucial para que novos usuários sejam marcados corretamente.
        await syncWithUsersCustom({
            id: sessionUser.id,
            email: sessionUser.email || "",
            name: sessionUser.user_metadata?.name || "",
            nickname: sessionUser.user_metadata?.nickname || "",
            isAdmin: sessionUser.user_metadata?.is_admin || false,
            first_login: false, // Novo usuário, então o primeiro login ainda não foi feito
        });
        combinedUser = {
            ...sessionUser,
            name: sessionUser.user_metadata?.name || "",
            nickname: sessionUser.user_metadata?.nickname || "",
            isAdmin: sessionUser.user_metadata?.is_admin || false,
            first_login: false, // Confirmar que o primeiro login é false
        };
        currentIsFirstLogin = true; // É o primeiro login para este usuário recém-sincronizado/criado
    }
    
    setUser(combinedUser);
    setIsFirstLogin(currentIsFirstLogin);
  };


  useEffect(() => {
    const checkSession = async () => {
      setIsLoadingAuth(true);
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await fetchAndSyncProfile(data.session.user);
      } else {
        setUser(null);
        setIsFirstLogin(false);
      }
      setIsLoadingAuth(false);
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoadingAuth(true); // Manter carregamento durante a mudança de estado
      if (event === "SIGNED_IN" && session) {
        await fetchAndSyncProfile(session.user);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setIsFirstLogin(false);
      }
      setIsLoadingAuth(false);
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

      // Após login, buscar e sincronizar o perfil, o que atualizará isFirstLogin
      await fetchAndSyncProfile(data.session.user);
      
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
    setIsFirstLogin(false); // Resetar isFirstLogin ao deslogar
    toast.success("Logout realizado com sucesso.");
  };

  // Função para sincronizar/criar perfil em users_custom
  const syncWithUsersCustom = async (userData: UserType) => {
    console.log("Sincronizando user_custom para:", userData.id);

    const { data, error: selectError } = await supabase
      .from("users_custom")
      .select("id, first_login") // Incluir first_login na busca
      .eq("id", userData.id)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      console.error("Erro ao buscar usuário em users_custom:", selectError);
      return;
    }

    if (!data) { // Se o perfil não existe, cria um novo com first_login: false
      const { error: insertError } = await supabase.from("users_custom").insert([
        {
          id: userData.id,
          name: userData.name,
          username: userData.nickname,
          // 'password' não deve ser sincronizado aqui, pois é tratado pelo Supabase Auth.
          // Remova o campo 'password' do insert, a menos que ele seja para um propósito diferente.
          is_admin: userData.isAdmin || false,
          avatar_url: "", // Assume vazio ou defina um default
          first_login: false, // NOVO USUÁRIO: É O PRIMEIRO LOGIN
        },
      ]);

      if (insertError) {
        console.error("Erro ao criar usuário em users_custom:", insertError);
      } else {
        console.log("Usuário criado em users_custom:", userData.id);
        setIsFirstLogin(true); // Define como primeiro login se acabou de criar
      }
    } else {
      // Se o perfil já existe, atualiza o estado local isFirstLogin com base no valor do DB
      setIsFirstLogin(!data.first_login);
      console.log("Usuário já existe em users_custom:", userData.id);
    }
  };

  // Nova função para atualizar o perfil do usuário na tabela `users_custom`
  const updateUserProfile = async (updates: Partial<UserType>) => {
    if (!user || !user.id) {
      console.error("Não há usuário logado para atualizar o perfil.");
      toast.error("Erro: Nenhum usuário logado para atualizar.");
      return;
    }

    const { error } = await supabase
      .from('users_custom') // Sua tabela de perfis
      .update(updates)
      .eq('id', user.id);

    if (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error(`Falha ao atualizar perfil: ${error.message}`);
      throw error; // Lançar o erro para quem chamar a função poder tratar
    }

    // Atualiza o estado local do usuário e isFirstLogin
    setUser(prevUser => {
      if (!prevUser) return null;
      return {
        ...prevUser,
        ...updates,
      } as UserType;
    });

    // Se first_login foi atualizado para true, atualize o estado isFirstLogin para false
    if (updates.first_login === true) {
      setIsFirstLogin(false);
    }
    toast.success("Perfil atualizado com sucesso!");
  };

  const contextValue = {
    isAuthenticated: !!user,
    isAdmin: !!user?.isAdmin,
    login,
    logout,
    user,
    isLoadingAuth,
    isFirstLogin, // Expondo o novo estado
    updateUserProfile, // Expondo a nova função
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {/* O loader pode ser movido para o componente de rota que o usa, para melhor controle */}
      {children}
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