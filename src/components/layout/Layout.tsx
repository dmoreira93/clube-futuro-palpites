// src/components/layout/Layout.tsx
import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { Toaster } from "@/components/ui/toaster"
import { BottomNavbar } from './BottomNavbar'; // <-- Importe o novo componente

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      {/* Adiciona padding-bottom para o conteúdo não ficar atrás da navbar no mobile */}
      <main className="flex-grow container mx-auto p-4 pb-20 md:pb-4">
        {children}
      </main>
      <Toaster />
      <Footer />
      <BottomNavbar /> {/* <-- Adicione o componente aqui */}
    </div>
  );
};

export default Layout;