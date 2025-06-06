// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

// Estendendo o tipo de usuário para incluir nossos campos customizados
export type AppUser = User & {
  username?: string;
  name?: string;
  is_admin?: boolean;
  first_login?: boolean;
  total_points?: number;
};

// Tipo para o valor do contexto
interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isFirstLogin: boolean;
  updateUserProfile: (updates: Partial<AppUser>) => Promise<void>;
  signOut: () => Promise<void>; // <-- NOVA FUNÇÃO EXPORTADA
}

// Criação do contexto com um valor padrão
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook customizado para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const navigate = useNavigate();

  // Função para buscar e sincronizar o perfil customizado
  const fetchAndSyncProfile = async (sessionUser: User) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('users_custom')
        .select('*')
        .eq('id', sessionUser.id)
        .single();
        
      let combinedUser: AppUser;
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
            first_login: false,
          },
        ]);

        if (insertError) {
          console.error("Erro ao inserir novo perfil:", insertError);
          throw insertError;
        }

        combinedUser = {
          ...sessionUser,
          name: sessionUser.user_metadata?.name || "",
          username: sessionUser.user_metadata?.nickname || "",
          is_admin: false,
          first_login: false,
          total_points: 0,
        };
        currentIsFirstLogin = true;

      } else if (profileError) {
        console.error("Erro ao buscar perfil:", profileError);
        throw profileError;
      } else {
        combinedUser = {
          ...sessionUser,
          ...profile,
        };
        currentIsFirstLogin = !profile.first_login;
      }

      setUser(combinedUser);
      setIsFirstLogin(currentIsFirstLogin);

    } catch (error) {
      console.error("Erro no fetchAndSyncProfile:", error);
      // Se ocorrer um erro aqui, pode ser um problema de RLS, deslogar é uma boa medida
      await signOut();
    }
  };

  // <-- NOVA FUNÇÃO DE LOGOUT
  const signOut = async () => {
    console.log("Sessão inválida ou logout solicitado. Deslogando...");
    await supabase.auth.signOut();
    setUser(null);
    setIsFirstLogin(false);
    navigate('/login', { replace: true }); // Redireciona para o login
  };


  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetchAndSyncProfile(session.user);
      }
      setLoading(false);
    };

    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`Auth event: ${event}`);
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsFirstLogin(false);
        } else if (session) {
          await fetchAndSyncProfile(session.user);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const updateUserProfile = async (updates: Partial<AppUser>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('users_custom')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUser(prevUser => prevUser ? { ...prevUser, ...data } : null);
      if(updates.first_login === true) {
        setIsFirstLogin(false);
      }
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
    }
  };

  const value = {
    user,
    loading,
    isFirstLogin,
    updateUserProfile,
    signOut // <-- EXPORTA A FUNÇÃO
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};