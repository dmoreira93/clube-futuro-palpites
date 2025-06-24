// src/components/layout/Layout.tsx (VERSÃO CORRIGIDA)

import React from 'react';
import { useLocation } from 'react-router-dom'; // 1. Importe o useLocation
import Navbar from './Navbar';
import Footer from './Footer';
import { Toaster } from "@/components/ui/toaster";
import BottomNavbar from './BottomNavbar';
import { usePwaDisplayMode } from '@/hooks/usePwaDisplayMode';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isPwa } = usePwaDisplayMode();
  const location = useLocation(); // 2. Obtenha a localização atual

  // 3. Crie uma variável para a condição especial: estar no PWA E na página inicial
  const isPwaOnHomePage = isPwa && location.pathname === '/';

  return (
    <div className="flex flex-col min-h-screen">
      {/* O Navbar principal SÓ aparece se NÃO for o PWA na página inicial */}
      {!isPwaOnHomePage && <Navbar />}

      {/* A classe 'container' foi removida para dar controle total às páginas */}
      <main className="flex-grow">
        {children}
      </main>

      <Toaster />

      {/* O Footer principal SÓ aparece se NÃO for o PWA (em nenhuma página) */}
      {!isPwa && <Footer />}
      
      {/* A BottomNavbar já se esconde em telas maiores, então pode continuar aqui */}
      <BottomNavbar />
    </div>
  );
};

export default Layout;