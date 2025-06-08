import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export type AppUser = User & {
  username?: string;
  name?: string;
  is_admin?: boolean;
  first_login?: boolean;
};

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isFirstLogin: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error: any | null }>;
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
  const [isAdmin, setIsAdmin] = useState(false);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

    const fetchAndSyncProfile = useCallback(async (sessionUser: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('users_custom')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      // Erro na consulta (que não seja "perfil não encontrado")
      if (error && error.code !== 'PGRST116') {
        console.error("Erro ao buscar perfil do usuário:", error);
        // Mantém o usuário logado com dados básicos e sinaliza um erro
        setUser(sessionUser);
        setIsAdmin(false);
        // Idealmente, você adicionaria um estado de erro para notificar o usuário
        return;
      }
      
      // Perfil não encontrado (um caso válido para um novo usuário, por exemplo)
      if (!profile) {
        console.warn(`Perfil para o usuário ${sessionUser.id} não encontrado na tabela 'users_custom'.`);
        // Trata como um primeiro login, permitindo que o usuário continue
        setUser(sessionUser);
        setIsAdmin(false);
        setIsFirstLogin(true); // Força a rota de mudança de senha ou completar perfil
        return;
      }

      // Caso de sucesso: perfil encontrado
      const combinedUser: AppUser = { ...sessionUser, ...profile };
      setUser(combinedUser);
      setIsFirstLogin(profile.first_login === false ? false : true); // Trata null/undefined
      setIsAdmin(profile.is_admin === true);

    } catch (e: any) {
      console.error("Erro crítico ao sincronizar perfil:", e);
      setUser(sessionUser); // Evita deslogar em caso de erro inesperado
    }
  }, [signOut]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          await fetchAndSyncProfile(session.user);
        } else {
          setUser(null);
          setIsFirstLogin(false);
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchAndSyncProfile]);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { success: !error, error };
  };

  const updateUserProfile = async (updates: Partial<Pick<AppUser, 'first_login'>>) => {
    // ... (lógica mantida)
  };

  const value = { user, loading, isFirstLogin, isAdmin, login, signOut, updateUserProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};