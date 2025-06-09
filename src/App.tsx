// Arquivo App.tsx - Teste do Passo 3
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext"; // Importamos o hook também

// Um componente de teste que usa o contexto
const PaginaDeTesteAuth = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div>Carregando Autenticação...</div>;
  }

  return (
    <div style={{ padding: '2rem', fontSize: '1.2rem', color: 'black', backgroundColor: 'white', whiteSpace: 'pre-wrap' }}>
      <h1>Teste do AuthProvider</h1>
      <p>Autenticação Carregada: {loading ? 'Não' : 'Sim'}</p>
      <p>Usuário Autenticado: {isAuthenticated ? 'Sim' : 'Não'}</p>
      <p>Email do Usuário: {user?.email || 'Nenhum usuário logado'}</p>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<PaginaDeTesteAuth />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;