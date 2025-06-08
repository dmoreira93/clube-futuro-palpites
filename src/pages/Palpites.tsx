import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const PalpitesPaginaDeTeste = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Se o AuthProvider terminar de carregar e não encontrar um usuário,
    // redireciona de volta para o login.
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // Mostra um loader enquanto o AuthContext verifica a sessão.
  if (loading || !user) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[calc(100vh-150px)]">
          <Loader2 className="h-10 w-10 animate-spin text-fifa-blue" />
        </div>
      </Layout>
    );
  }

  // Se chegou até aqui, significa que o usuário está logado e verificado.
  return (
    <Layout>
      <div style={{
        padding: '40px',
        margin: '20px',
        textAlign: 'center',
        backgroundColor: '#e0ffe0',
        border: '2px solid green',
        borderRadius: '8px'
      }}>
        <h1 style={{ fontSize: '2em', color: 'green', fontWeight: 'bold' }}>
          Teste Bem-Sucedido!
        </h1>
        <p style={{ marginTop: '10px' }}>
          A página de Palpites foi carregada corretamente.
        </p>
        <p style={{ marginTop: '5px' }}>
          O login e o redirecionamento estão funcionando.
        </p>
        <p style={{ marginTop: '20px', fontSize: '1.1em' }}>
          Usuário Logado: <strong>{user.email}</strong>
        </p>
      </div>
    </Layout>
  );
};

export default PalpitesPaginaDeTeste;