// Arquivo App.tsx - Teste do Passo 4
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; // Importado
import { TooltipProvider } from "@/components/ui/tooltip"; // Importado

// O QueryClient é criado aqui
const queryClient = new QueryClient();

// O componente de teste continua o mesmo
const PaginaDeTesteAuth = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <div>Carregando Autenticação...</div>;
  }

  return (
    <div style={{ padding: '2rem', fontSize: '1.2rem', color: 'black', backgroundColor: 'white', whiteSpace: 'pre-wrap' }}>
      <h1>Teste do AuthProvider com outros Providers</h1>
      <p>Autenticação Carregada: {loading ? 'Não' : 'Sim'}</p>
      <p>Usuário Autenticado: {isAuthenticated ? 'Sim' : 'Sim'}</p>
      <p>Email do Usuário: {user?.email || 'Nenhum usuário logado'}</p>
    </div>
  );
};

const App = () => {
  return (
    // Adicionamos os providers de volta
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<PaginaDeTesteAuth />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;