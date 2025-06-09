import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export type AppUser = User & {
  username?: string;
  name?: string;
  is_admin?: boolean;
  first_login?: boolean;
};

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  isAuthenticated: boolean;
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
  console.log("1. AuthProvider MONTADO"); // <-- LOG 1
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const isAuthenticated = !!user;

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

      if (error && error.code !== 'PGRST116') throw error;
      
      const combinedUser: AppUser = { ...sessionUser, ...profile };
      setUser(combinedUser);
      setIsAdmin(!!profile?.is_admin);
      setIsFirstLogin(profile?.first_login !== true);

    } catch (e: any) {
      toast.error(`Erro ao buscar perfil: ${e.message}`);
      await signOut();
    }
  }, [signOut]);

  useEffect(() => {
    console.log("2. useEffect EXECUTADO"); // <-- LOG 2
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("3. onAuthStateChange DISPARADO", { _event, session }); // <-- LOG 3
        try {
          if (session?.user) {
            await fetchAndSyncProfile(session.user);
          } else {
            setUser(null);
            setIsAdmin(false);
            setIsFirstLogin(false);
          }
        } finally {
          console.log("4. Bloco finally EXECUTADO - Setando loading para false"); // <-- LOG 4
          setLoading(false);
        }
      }
    );
    return () => {
      console.log("5. AuthProvider DESMONTADO - Limpando listener"); // <-- LOG 5
      authListener.subscription.unsubscribe(); 
    };
  }, [fetchAndSyncProfile]);
  
  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message || "Email ou senha inválidos.");
    return { success: !error, error };
  };

  const updateUserProfile = async (updates: Partial<Pick<AppUser, 'first_login'>>) => {
    if (!user) throw new Error("Usuário não autenticado para atualizar o perfil.");
    try {
      const { error } = await supabase.from('users_custom').update(updates).eq('id', user.id);
      if (error) throw error;
      if (updates.first_login === true) {
        setIsFirstLogin(false); // Atualiza o estado local para evitar o loop
      }
    } catch (error) {
      console.error("Erro em updateUserProfile:", error);
      throw error;
    }
  };

  const value = { user, loading, isAuthenticated, isFirstLogin, isAdmin, login, signOut, updateUserProfile };

  console.log("6. AuthProvider RENDERIZANDO. Loading:", loading); // <-- LOG 6
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};