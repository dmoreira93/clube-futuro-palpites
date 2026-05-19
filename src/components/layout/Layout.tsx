import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import { Toaster } from "@/components/ui/toaster";
import BottomNavbar from './BottomNavbar';
import { usePwaDisplayMode } from '@/hooks/usePwaDisplayMode';
import ReloadPrompt from '@/components/pwa/ReloadPrompt';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isPwa } = usePwaDisplayMode();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const isLandingPage = location.pathname === '/';
  const shouldShowDefaultNavbar = isAuthenticated || !isLandingPage;

  return (
    <div className="flex flex-col min-h-screen">
      {shouldShowDefaultNavbar && <Navbar />}

      <main className="flex-grow">
        {children}
      </main>

      <Toaster />
      <BottomNavbar />
      <ReloadPrompt />
    </div>
  );
};

export default Layout;