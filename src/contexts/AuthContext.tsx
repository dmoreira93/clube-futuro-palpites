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
  const navigate = useNavigate();

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // A mudança de estado será capturada pelo onAuthStateChange
  }, []);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setLoading(true);
        if (!session) {
          setUser(null);
          setIsFirstLogin(false);
          navigate('/login');
          setLoading(false);
          return;
        }

        try {
          const { data: profile, error } = await supabase
            .from('users_custom')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (error) {
            console.error("Erro ao buscar perfil RLS, deslogando:", error);
            await signOut();
            return;
          }

          if (profile) {
            const combinedUser: AppUser = { ...session.user, ...profile };
            setUser(combinedUser);
            setIsFirstLogin(!profile.first_login);
          } else {
            console.warn("Usuário autenticado sem perfil em users_custom. Tentando criar...");
            // Lógica para criar perfil se não existir
            const { error: insertError } = await supabase.from("users_custom").insert([
              {
                id: session.user.id,
                name: session.user.user_metadata?.name || "",
                username: session.user.user_metadata?.nickname || "",
                is_admin: false,
                first_login: false,
              },
            ]);

            if (insertError) {
              console.error("Falha ao criar perfil que faltava, deslogando:", insertError);
              await signOut();
            } else {
              // Tenta buscar o perfil novamente após a criação bem-sucedida
              const { data: newProfile, error: newProfileError } = await supabase
                .from('users_custom')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if(newProfile && !newProfileError) {
                const combinedUser: AppUser = { ...session.user, ...newProfile };
                setUser(combinedUser);
                setIsFirstLogin(!newProfile.first_login);
              } else {
                await signOut();
              }
            }
          }
        } catch (e) {
          console.error("Erro crítico no onAuthStateChange, deslogando:", e);
          await signOut();
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, signOut]);

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