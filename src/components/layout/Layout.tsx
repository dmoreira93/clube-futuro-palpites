// src/components/layout/Layout.tsx (VERSÃO CORRIGIDA PARA DUPLICAÇÃO DE HEADER)

import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
//import Footer from './Footer';
import { Toaster } from "@/components/ui/toaster";
import BottomNavbar from './BottomNavbar';
import { usePwaDisplayMode } from '@/hooks/usePwaDisplayMode';
import ReloadPrompt from '@/components/pwa/ReloadPrompt';
import { useAuth } from '@/contexts/AuthContext'; // <--- Importar useAuth

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isPwa } = usePwaDisplayMode();
  const location = useLocation();
  const { isAuthenticated } = useAuth(); // <--- Obter estado de autenticação

  // 1. A página inicial (/) renderiza o cabeçalho completo DELE (a landing page).
  // 2. Rotas internas (dashboard, palpites, admin) precisam do Navbar COMPLETO.
  // A regra: Esconder o Navbar do Layout se estiver na rota '/' E não estiver logado.

  const isLandingPage = location.pathname === '/';
  
  // Condição para mostrar o Navbar padrão:
  // Mostra se o usuário está logado OU se não estamos na página inicial.
  // Exceção: Se for PWA, a página inicial do PWA tem seu próprio header simples.
  const shouldShowDefaultNavbar = isAuthenticated || !isLandingPage;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Ajuste: Se estiver na página inicial (e não logado), o componente HomePage
        já renderiza o cabeçalho de marketing com Entrar/Cadastrar.
        Se estiver logado, ou em qualquer outra rota, mostra o Navbar de navegação.
      */}
      {shouldShowDefaultNavbar && <Navbar />}

      <main className="flex-grow">
        {children}
      </main>

      <Toaster />

      {/* O Footer da aplicação só aparece se NÃO estiver no modo PWA */}
      
      
      {/* BottomNavbar continua só para mobile e logado */}
      <BottomNavbar />

      <ReloadPrompt />
    </div>
  );
};

export default Layout;