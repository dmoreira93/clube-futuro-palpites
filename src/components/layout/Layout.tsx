// src/components/layout/Layout.tsx
import React from 'react';
// import Navbar from './Navbar'; // A importação pode ser comentada também
import Footer from './Footer';
import { Toaster } from "@/components/ui/toaster"
import { BottomNavbar } from './BottomNavbar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* <Navbar /> */} {/* <-- Navbar PRINCIPAL COMENTADA */}

      <main className="flex-grow container mx-auto p-4 pb-20 md:pb-4">
        {children}
      </main>
      <Toaster />
      <Footer />
      <BottomNavbar />
    </div>
  );
};

export default Layout;