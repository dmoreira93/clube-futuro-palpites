import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
// import { useNavigate } from 'react-router-dom'; // <--- REMOVIDO

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
  updateUserProfile: (updates: Partial<AppUser>) => Promise<void>;
  signOut: () => Promise<void>;
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
  // const navigate = useNavigate(); // <--- REMOVIDO

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // O listener onAuthStateChange irá lidar com a atualização do estado para null
  }, []);
  
  const fetchAndSyncProfile = useCallback(async (sessionUser: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('users_custom')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      if (error || !profile) {
        // Se houver um erro ou o perfil não existir, deslogamos o usuário
        // para evitar um estado inconsistente.
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
    // Busca a sessão inicial uma vez para definir o estado de loading
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchAndSyncProfile(session.user);
      }
      setLoading(false);
    });

    // Escuta por futuras mudanças de autenticação
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          await fetchAndSyncProfile(session.user);
        } else {
          setUser(null);
          setIsFirstLogin(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchAndSyncProfile]); // fetchAndSyncProfile é agora uma dependência estável


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

      setUser(prevUser => (prevUser ? { ...prevUser, ...data } : null));
      if (updates.first_login === true) {
        setIsFirstLogin(false);
      }
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
    }
  };

  const value = { user, loading, isFirstLogin, updateUserProfile, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};