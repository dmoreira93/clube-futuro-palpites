import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
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

  // --- 1. CLEANUP (SignOut) ---
  const signOut = useCallback(async () => {
    console.log("🛑 Logout forçado/solicitado. Limpando sessão...");
    
    setUser(null);
    userRef.current = null;
    setActivePool(null);
    setUserParticipations([]);
    
    localStorage.removeItem('activePoolId');
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-')) localStorage.removeItem(key);
    });
    sessionStorage.clear();
    setLoading(false);

    try {
        await supabase.auth.signOut();
    } catch (e) {
        console.warn("Erro ao notificar Supabase do logout (ignorado):", e);
    }
  }, []);

  // --- 2. SYNC PROFILE ---
  const fetchAndSyncProfile = useCallback(async (sessionUser: User): Promise<AppUser | null> => {
    if (userRef.current?.id === sessionUser.id) {
        return userRef.current;
    }

    try {
      console.log("🔄 Sincronizando perfil:", sessionUser.email);
      
      let { data: profile, error } = await supabase
        .from('users_custom')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle();

      if (!profile && !error) {
         console.warn("⚠️ Perfil não encontrado. Tentando criar fallback...");
         
         const { error: insertError } = await supabase.from("users_custom").insert({
            id: sessionUser.id,
            email: sessionUser.email,
            name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0],
            avatar_url: sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture,
         });

         if (!insertError) {
             const res = await supabase.from('users_custom').select('*').eq('id', sessionUser.id).single();
             profile = res.data;
         } else {
             console.error("Erro ao criar perfil fallback:", insertError);
         }
      }
      
      const combinedUser: AppUser = { 
        ...sessionUser, 
        username: profile?.username,
        name: profile?.name,
        is_admin: profile?.is_admin,
        first_login: profile?.first_login,
        avatar_url: profile?.avatar_url
      };
      
      setUser(combinedUser);
      userRef.current = combinedUser;
      
      // Busca Participações
      const { data: participationsData } = await supabase
        .from('participations')
        .select(`*, pools(*)`) 
        .eq('user_id', sessionUser.id);
        
      const participations: Participation[] = (participationsData || []).map((p: any) => {
        const poolData = p.pools || p.pool;
        return { ...p, pool: poolData };
      }).filter(p => p.pool);

      setUserParticipations(participations);
      
      // Define Bolão Ativo
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
      console.error("❌ Erro no fetchAndSyncProfile:", error);
      const fallbackUser: AppUser = { ...sessionUser };
      setUser(fallbackUser);
      userRef.current = fallbackUser;
      return fallbackUser;
    }
  }, []); 
  
  // --- 3. CORE LOGIC ---
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          await fetchAndSyncProfile(session.user);
        }
      } catch (err) {
        console.error("Erro na carga inicial da sessão:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;

        console.log(`🔔 Auth Event: ${event}`);
        
        if (event === 'SIGNED_OUT') {
            setUser(null);
            userRef.current = null;
            setActivePool(null);
            setUserParticipations([]);
            setLoading(false);
        } 
        else if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
            await fetchAndSyncProfile(session.user);
            // CORREÇÃO 1: Desbloqueia a tela caso o login venha de um provedor como o Google
            if (mounted) setLoading(false); 
        } 
    });

    return () => { 
        mounted = false;
        subscription.unsubscribe(); 
    };
  }, [fetchAndSyncProfile]);

  // --- 4. ACTIONS ---
  // Troque a palavra "email" por "identifier" (que pode ser o usuário ou e-mail real)
  const login = async (identifier: string, password: string) => {
    setLoading(true);
    try {
        // O TRUQUE: Se não tiver '@', o sistema adiciona o domínio fantasma automaticamente.
        const formatIdentifier = identifier.trim().toLowerCase();
        const emailToLogin = formatIdentifier.includes('@') 
            ? formatIdentifier 
            : `${formatIdentifier}@app.com`; // Você pode mudar "@app.com" para o que quiser

        // Usa a nova variável formatada para logar
        const { data, error } = await supabase.auth.signInWithPassword({ 
            email: emailToLogin, 
            password 
        });
        
        if (error) {
            setLoading(false);
            return { success: false, error };
        }

        if (data.session?.user) {
            const profile = await fetchAndSyncProfile(data.session.user);
            if (!profile) {
                setLoading(false);
                return { success: false, error: new Error("Falha ao carregar perfil.") };
            }
        }
        
        setLoading(false); 
        return { success: true, error: null };
    } catch (err) {
        setLoading(false);
        return { success: false, error: err };
    }
  };

  const updateUserProfile = async (updates: Partial<Pick<AppUser, 'first_login'>>) => {
    if (!user) return;
    const { error } = await supabase.from('users_custom').update(updates).eq('id', user.id);
    if (error) { toast.error("Erro ao atualizar perfil."); throw error; };
    await fetchAndSyncProfile(user);
  };

  const switchPool = (poolId: string) => {
      const participation = userParticipations.find(p => p.pool.id === poolId);
      if (participation) {
          setActivePool(participation.pool);
          localStorage.setItem('activePoolId', poolId);
          toast.success(`Bolão: ${participation.pool.name}`);
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