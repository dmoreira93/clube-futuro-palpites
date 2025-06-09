// src/App.tsx

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

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
import RankingPage from "@/pages/Ranking";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <Toaster />
          <Sonner />
          
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/criterios" element={<Criterios />} />
            <Route path="/resultados" element={<Resultados />} />
            <Route path="/ranking" element={<RankingPage />} />
            <Route path="/palpites" element={<Palpites />} />
            <Route path="/palpites-usuarios" element={<UserPredictions />} />
            <Route path="/palpites-do-dia" element={<DailyMatchesAndPredictions />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;