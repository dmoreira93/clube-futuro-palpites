// src/contexts/AuthContext.tsx

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type Pool = Database['public']['Tables']['pools']['Row'];
type ParticipationRow = Database['public']['Tables']['participations']['Row'];

export type AppUser = User & {
  username?: string | null;
  name?: string | null;
  is_admin?: boolean;
  first_login?: boolean;
  avatar_url?: string | null;
};

export interface Participation extends ParticipationRow {
  pool: Pool;
}

interface AuthContextType {
  user: AppUser | null;
  activePool: Pool | null; 
  userParticipations: Participation[]; 
  loading: boolean;
  isAuthenticated: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  switchPool: (poolId: string) => void; 
  login: (email: string, password: string) => Promise<{ success: boolean; error: any | null }>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<Pick<AppUser, 'first_login'>>) => Promise<void>;
  fetchAndSyncProfile: (sessionUser: User) => Promise<AppUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [activePool, setActivePool] = useState<Pool | null>(null);
  const [userParticipations, setUserParticipations] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(true);
  
  const userRef = useRef<AppUser | null>(null);

  const isAuthenticated = !!user;
  const isAdmin = user?.is_admin ?? false;
  const isOwner = !!user && !!activePool && user.id === activePool.owner_id;

  const signOut = useCallback(async () => {
    setUser(null);
    userRef.current = null;
    setActivePool(null);
    setUserParticipations([]);
    localStorage.removeItem('activePoolId');
    localStorage.removeItem('sb-wdbaoomwhuiztjoazagd-auth-token');
    await supabase.auth.signOut();
  }, []);

  const fetchAndSyncProfile = useCallback(async (sessionUser: User): Promise<AppUser | null> => {
    try {
      // 1. Busca Perfil
      const { data: profile, error } = await supabase
        .from('users_custom')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      // AUTO-LIMPEZA: Se o perfil não existe, força logout para limpar o cache do navegador
      if (error || !profile) {
         console.error("Perfil não encontrado. Logout de segurança.", error);
         await signOut();
         return null;
      }
      
      const combinedUser: AppUser = { 
        ...sessionUser, 
        username: profile.username,
        name: profile.name,
        is_admin: profile.is_admin,
        first_login: profile.first_login,
        avatar_url: profile.avatar_url
      };
      
      setUser(combinedUser);
      userRef.current = combinedUser;
      
      // 2. Busca Participações (Sem apelido/alias para evitar confusão no Supabase)
      const { data: participationsData, error: participationsError } = await supabase
        .from('participations')
        .select(`*, pools(*)`) 
        .eq('user_id', sessionUser.id);
        
      if (participationsError) throw participationsError;
      
      // 3. Mapeamento Robusto (A CORREÇÃO QUE VOCÊ PEDIU)
      // O Supabase pode devolver 'pools' (plural) ou 'pool' (singular). Aceitamos os dois.
      const participations: Participation[] = (participationsData || []).map((p: any) => {
        const poolData = p.pools || p.pool; // <--- AQUI ESTÁ A LÓGICA BLINDADA
        
        return {
          ...p,
          pool: poolData 
        };
      }).filter(p => p.pool); // Remove participações quebradas/sem bolão

      setUserParticipations(participations);
      
      // 4. Define Bolão Ativo
      if (participations.length > 0) {
        const lastActivePoolId = localStorage.getItem('activePoolId');
        const lastActiveParticipation = participations.find(p => p.pool.id === lastActivePoolId);
        
        if (lastActiveParticipation) {
            setActivePool(lastActiveParticipation.pool);
        } else {
            setActivePool(participations[0].pool);
            localStorage.setItem('activePoolId', participations[0].pool.id);
        }
      } else {
        setActivePool(null);
      }
      
      return combinedUser;

    } catch (error: any) {
      console.error("Erro crítico no AuthContext:", error);
      return null;
    }
  }, [signOut]);
  
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
            await signOut();
        } else if (session?.user) {
            if (mounted) await fetchAndSyncProfile(session.user);
        }
      } catch (error) {
        console.error("Erro na inicialização:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
            setUser(null);
            userRef.current = null;
            setActivePool(null);
            setUserParticipations([]);
            setLoading(false);
        } else if (session?.user) {
            // Só recarrega se o usuário mudou de verdade (Evita loop infinito)
            const currentUser = userRef.current;
            if (!currentUser || currentUser.id !== session.user.id) {
                 await fetchAndSyncProfile(session.user);
            }
        }
    });

    return () => { 
      mounted = false;
      authListener.subscription.unsubscribe(); 
    };
  }, [fetchAndSyncProfile, signOut]);
  
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        toast.error(error.message || "Email ou senha inválidos.");
        return { success: false, error };
    }
    return { success: true, error: null };
  };

  const updateUserProfile = async (updates: Partial<Pick<AppUser, 'first_login'>>) => {
    if (!user) throw new Error("Usuário não autenticado.");
    const { error } = await supabase.from('users_custom').update(updates).eq('id', user.id);
    if (error) { toast.error("Erro ao atualizar perfil."); throw error; };
    await fetchAndSyncProfile(user);
  };

  const switchPool = (poolId: string) => {
      const participation = userParticipations.find(p => p.pool.id === poolId);
      if (participation) {
          setActivePool(participation.pool);
          localStorage.setItem('activePoolId', poolId);
          toast.success(`Bolão alterado para: ${participation.pool.name}`);
      }
  };
  
  const value = { 
    user, 
    activePool, 
    userParticipations, 
    loading, 
    isAuthenticated, 
    isOwner, 
    isAdmin, 
    login, 
    signOut, 
    updateUserProfile, 
    fetchAndSyncProfile, 
    switchPool 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};