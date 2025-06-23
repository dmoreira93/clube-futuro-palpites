// src/components/layout/BottomNavbar.tsx (VERSÃO ATUALIZADA)

import { NavLink } from 'react-router-dom';
import { Home, Trophy, Medal, Newspaper } from "lucide-react"; 
import { useAuth } from '@/contexts/AuthContext';

const BottomNavbar = () => {
  const { user } = useAuth();

  if (!user) {
    return null; 
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) => 
    `flex flex-col items-center justify-center text-xs gap-1 transition-colors ${isActive ? 'text-fifa-blue' : 'text-gray-500 hover:text-fifa-blue'}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-4 items-center border-t bg-white/95 py-2 shadow-t-lg backdrop-blur-sm md:hidden">
      <NavLink to="/dashboard" end className={navLinkClass}>
        <Home className="h-5 w-5" />
        <span>Início</span>
      </NavLink>
      <NavLink to="/ranking" className={navLinkClass}>
        <Trophy className="h-5 w-5" />
        <span>Ranking</span>
      </NavLink>
      <NavLink to="/resultados" className={navLinkClass}>
        <Medal className="h-5 w-5" />
        <span>Resultados</span>
      </NavLink>
      <NavLink to="/noticias" className={navLinkClass}>
        <Newspaper className="h-5 w-5" />
        <span>Notícias</span>
      </NavLink>
    </nav>
  );
};

export default BottomNavbar;