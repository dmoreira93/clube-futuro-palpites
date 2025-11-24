// src/contexts/AuthContext.tsx (VERSÃO ESTÁVEL - SEM PISCAR)

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
  
  // Ref para evitar loops de dependência no useEffect
  const userRef = useRef<AppUser | null>(null);

  const isAuthenticated = !!user;
  const isAdmin = user?.is_admin ?? false;
  const isOwner = !!user && !!activePool && user.id === activePool.owner_id;

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    userRef.current = null;
    setActivePool(null);
    setUserParticipations([]);
    localStorage.removeItem('activePoolId');
  }, []);

  const fetchAndSyncProfile = useCallback(async (sessionUser: User): Promise<AppUser | null> => {
    try {
      // Se já temos os dados carregados e é o mesmo usuário, evita refetch desnecessário
      // Mas permite forçar update se chamado manualmente
      
      const { data: profile, error } = await supabase
        .from('users_custom')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      // Se não tiver perfil (caso de erro na migração), cria um objeto básico
      if (error && error.code !== 'PGRST116') {
         console.error("Erro ao buscar perfil:", error);
      }
      
      const combinedUser: AppUser = { 
        ...sessionUser, 
        username: profile?.username,
        name: profile?.name,
        is_admin: profile?.is_admin,
        first_login: profile?.first_login,
        avatar_url: profile?.avatar_url
      };
      
      // Atualiza estado e ref
      setUser(combinedUser);
      userRef.current = combinedUser;
      
      // Busca participações
      const { data: participationsData, error: participationsError } = await supabase
        .from('participations')
        .select(`*, pool:pools(*)`)
        .eq('user_id', sessionUser.id);
        
      if (participationsError) throw participationsError;
      
      const participations: Participation[] = (participationsData || []).map((p: any) => ({
        ...p,
        pool: p.pool
      }));

      setUserParticipations(participations);
      
      // Lógica de Bolão Ativo
      if (participations.length > 0) {
        const lastActivePoolId = localStorage.getItem('activePoolId');
        // Verifica se o bolão salvo ainda existe nas participações do usuário
        const lastActiveParticipation = participations.find(p => p.pool_id === lastActivePoolId);
        
        if (lastActiveParticipation) {
            setActivePool(lastActiveParticipation.pool);
        } else {
            // Se não, pega o primeiro disponível
            setActivePool(participations[0].pool);
            localStorage.setItem('activePoolId', participations[0].pool.id);
        }
      } else {
        setActivePool(null);
      }
      
      return combinedUser;
    } catch (error: any) {
      console.error("Erro crítico no fetch profile:", error);
      return null;
    }
  }, []);
  
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
            if (mounted) await fetchAndSyncProfile(session.user);
        }
      } catch (error) {
        console.error("Erro na inicialização da sessão:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        const sessionUser = session?.user;
        
        if (sessionUser) {
            // SÓ atualiza se o usuário mudou (comparando ID) para evitar loop
            if (!userRef.current || userRef.current.id !== sessionUser.id) {
                 await fetchAndSyncProfile(sessionUser);
            }
        } else if (event === 'SIGNED_OUT') {
            setUser(null);
            userRef.current = null;
            setActivePool(null);
            setUserParticipations([]);
            setLoading(false);
        }
    });

    return () => { 
      mounted = false;
      authListener.subscription.unsubscribe(); 
    };
    // REMOVIDA A DEPENDÊNCIA 'user' AQUI PARA PARAR O LOOP
  }, [fetchAndSyncProfile]); 
  
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message || "Email ou senha inválidos.");
    return { success: !error, error };
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