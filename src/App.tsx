// src/App.tsx

import { Toaster } from "@/components/ui/toaster"; // Do Shadcn UI, para toasts imperativos
import { Toaster as Sonner } from "@/components/ui/sonner"; // Do Sonner, para toasts declarativos
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Usando o alias '@/' para o caminho do AuthProvider para consistência
import { AuthProvider } from "@/contexts/AuthContext";

// Importe suas páginas
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Criterios from "@/pages/Criterios";
import Resultados from "@/pages/Resultados";
import Palpites from "@/pages/Palpites";
import Cadastro from "@/pages/Cadastro";
import Login from "@/pages/Login";
import Admin from "@/pages/Admin";
import AdminLogin from "@/pages/AdminLogin";
import UserPredictions from "@/pages/UserPredictions";
import DailyMatchesAndPredictions from "@/pages/DailyMatchesAndPredictions";
import ChangePassword from "@/pages/ChangePassword";

// Importe o NOVO componente de Ranking
import RankingPage from "@/pages/Ranking"; // <-- NOVO: Importe o componente da página de Ranking

// Crie uma instância do QueryClient fora do componente para evitar recriações
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      {/* AuthProvider deve envolver as rotas e todos os componentes que usam useAuth */}
      <AuthProvider>
        {/* Os Toasters podem estar aqui ou mais abaixo, dependendo de onde você os chama */}
        <Toaster /> {/* Toaster do Shadcn UI */}
        <Sonner /> {/* Toaster do Sonner */}
        
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/criterios" element={<Criterios />} />
            <Route path="/resultados" element={<Resultados />} />
            <Route path="/ranking" element={<RankingPage />} /> {/* <-- NOVA ROTA ADICIONADA AQUI */}
            <Route path="/palpites" element={<Palpites />} />
            <Route path="/palpites-usuarios" element={<UserPredictions />} />
            <Route path="/palpites-do-dia" element={<DailyMatchesAndPredictions />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/change-password" element={<ChangePassword />} />
            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;