import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

export type AppUser = User & {
  username?: string;
  name?: string;
  is_admin?: boolean;
  first_login?: boolean;
  total_points?: number;
};

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isFirstLogin: boolean;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<Pick<AppUser, 'first_login'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // O listener onAuthStateChange irá lidar com a atualização do estado para null.
  }, []);
  
  const fetchAndSyncProfile = useCallback(async (sessionUser: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('users_custom')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      // Se o perfil não for encontrado ou der erro (ex: RLS), desloga o usuário para evitar estado quebrado.
      if (error || !profile) {
        console.error("Perfil não encontrado ou erro de RLS. Deslogando.", error);
        await supabase.auth.signOut();
        return;
      }
      
      const combinedUser: AppUser = { ...sessionUser, ...profile };
      setUser(combinedUser);
      setIsFirstLogin(!profile.first_login);

    } catch (e) {
      console.error("Erro crítico ao buscar perfil. Deslogando.", e);
      await supabase.auth.signOut();
    }
  }, []);

  useEffect(() => {
    // 1. Verifica a sessão inicial para remover a tela de loading rapidamente
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLoading(false);
      }
      // Se houver sessão, o onAuthStateChange abaixo vai cuidar de buscar o perfil.
    });

    // 2. Escuta por todas as mudanças de autenticação (login, logout, refresh de token)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          await fetchAndSyncProfile(session.user);
        } else {
          setUser(null);
          setIsFirstLogin(false);
        }
        // Apenas para o carregamento inicial, depois as transições são mais rápidas
        if (loading) setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loading, fetchAndSyncProfile]);

  const updateUserProfile = async (updates: Partial<Pick<AppUser, 'first_login'>>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('users_custom')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUser(prevUser => (prevUser ? { ...prevUser, ...data } : null));
      if (updates.first_login === true) {
        setIsFirstLogin(false);
      }
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
    }
  };

  const value = { user, loading, isFirstLogin, signOut, updateUserProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};