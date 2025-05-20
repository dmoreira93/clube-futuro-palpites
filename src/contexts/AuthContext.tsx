import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner"; // Mantido como você forneceu

type AuthContextType = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  user: UserType | null;
  isLoadingAuth: boolean; // Adicionado para indicar o carregamento inicial da autenticação
};

type UserType = {
  id: string;
  email: string;
  name: string;
  nickname: string;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined); // Mudado para 'undefined' como valor inicial

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Novo estado de carregamento

  useEffect(() => {
    const checkSession = async () => {
      setIsLoadingAuth(true); // Inicia o carregamento
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const userMetadata = data.session.user.user_metadata;
        const userData: UserType = { // Adicionado tipo explícito
          id: data.session.user.id,
          email: data.session.user.email || '', // Garante que não seja null
          name: userMetadata?.name || "",
          nickname: userMetadata?.nickname || "",
          isAdmin: userMetadata?.isAdmin || false,
        };
        setUser(userData);
        // Não é necessário await aqui, pode rodar em segundo plano
        void syncWithUsersCustom(userData); // Usado 'void' para indicar que a promise não é esperada
      }
      setIsLoadingAuth(false); // Termina o carregamento
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        const userMetadata = session.user.user_metadata;
        const userData: UserType = { // Adicionado tipo explícito
          id: session.user.id,
          email: session.user.email || '', // Garante que não seja null
          name: userMetadata?.name || "",
          nickname: userMetadata?.nickname || "",
          isAdmin: userMetadata?.isAdmin || false,
        };
        setUser(userData);
        void syncWithUsersCustom(userData); // Usado 'void' para indicar que a promise não é esperada
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
      // setIsLoadingAuth(false); // Não precisa aqui, pois checkSession já lidou com o estado inicial
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // Dependência vazia para rodar apenas uma vez na montagem

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data.session) {
        toast.error(error?.message || "Erro ao fazer login. Verifique suas credenciais.");
        return false;
      }

      const userMetadata = data.session.user.user_metadata;
      const userData: UserType = { // Adicionado tipo explícito
        id: data.session.user.id,
        email: data.session.user.email || '', // Garante que não seja null
        name: userMetadata?.name || "",
        nickname: userMetadata?.nickname || "",
        isAdmin: userMetadata?.isAdmin || false,
      };
      setUser(userData);
      void syncWithUsersCustom(userData);

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
    toast.success("Logout realizado com sucesso.");
  };

  const syncWithUsersCustom = async (user: UserType) => {
    // Adicione um log para depuração
    console.log("Sincronizando user_custom para:", user.id);

    const { data, error: selectError } = await supabase
      .from("users_custom")
      .select("id")
      .eq("id", user.id)
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 é 'no rows found'
        console.error("Erro ao buscar usuário em users_custom:", selectError);
        return;
    }

    if (!data) { // Se não encontrou o usuário
      const { error: insertError } = await supabase.from("users_custom").insert([
        {
          id: user.id,
          name: user.name,
          username: user.nickname,
          // A senha NUNCA deve ser armazenada aqui. Supabase lida com isso.
          // Se 'password' é uma coluna na sua tabela 'users_custom', reconsidere.
          // Geralmente, você não armazena senhas em uma tabela de perfil.
          // Se for um placeholder, tudo bem, mas certifique-se de que não é um campo de senha real.
          password: "", // Removível ou repensável
          is_admin: user.isAdmin || false,
          avatar_url: "",
          first_login: true,
        },
      ]);

      if (insertError) {
        console.error("Erro ao criar usuário em users_custom:", insertError);
      } else {
        console.log("Usuário criado em users_custom:", user.id);
      }
    } else {
        console.log("Usuário já existe em users_custom:", user.id);
    }
  };

  const contextValue = {
    isAuthenticated: !!user,
    isAdmin: !!user?.isAdmin,
    login,
    logout,
    user,
    isLoadingAuth, // Inclui o estado de carregamento
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {/* Renderiza os filhos apenas quando o carregamento inicial da autenticação estiver completo */}
      {!isLoadingAuth && children}
      {/* Opcional: Mostrar um spinner ou placeholder enquanto carrega a autenticação */}
      {isLoadingAuth && (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin h-8 w-8 border-4 border-fifa-blue border-t-transparent rounded-full"></div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

// Hook useAuth
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Isso é crucial. Se o contexto não for fornecido, significa que useAuth foi chamado
    // fora do AuthProvider. O erro será jogado e a página ficará em branco.
    // Verifique o seu _app.tsx para garantir que AuthProvider está envolvendo tudo.
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};