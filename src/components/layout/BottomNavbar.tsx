// src/components/layout/BottomNavbar.tsx

import { NavLink } from 'react-router-dom';
import { Home, ListChecks, Calculator, Trophy, Medal, Newspaper } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

const BottomNavbar = () => {
  const { user } = useAuth();

  // O menu só aparece para usuários logados
  if (!user) {
    return null; 
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-6 items-center border-t bg-white py-2 shadow-t-lg md:hidden">
      <NavLink to="/dashboard" end className={({ isActive }) => `flex flex-col items-center text-xs ${isActive ? 'text-fifa-blue' : 'text-gray-500'}`}>
        <Home className="h-5 w-5" />
        <span className="mt-1">Início</span>
      </NavLink>
      <NavLink to="/palpites" className={({ isActive }) => `flex flex-col items-center text-xs ${isActive ? 'text-fifa-blue' : 'text-gray-500'}`}>
        <ListChecks className="h-5 w-5" />
        <span className="mt-1">Palpites</span>
      </NavLink>
      <NavLink to="/noticias" className={({ isActive }) => `flex flex-col items-center text-xs ${isActive ? 'text-fifa-blue' : 'text-gray-500'}`}>
        <Newspaper className="h-5 w-5" />
        <span className="mt-1">Notícias</span>
      </NavLink>
      <NavLink to="/simulador" className={({ isActive }) => `flex flex-col items-center text-xs ${isActive ? 'text-fifa-blue' : 'text-gray-500'}`}>
        <Calculator className="h-5 w-5" />
        <span className="mt-1">Simulador</span>
      </NavLink>
      <NavLink to="/ranking" className={({ isActive }) => `flex flex-col items-center text-xs ${isActive ? 'text-fifa-blue' : 'text-gray-500'}`}>
        <Trophy className="h-5 w-5" />
        <span className="mt-1">Ranking</span>
      </NavLink>
      <NavLink to="/resultados" className={({ isActive }) => `flex flex-col items-center text-xs ${isActive ? 'text-fifa-blue' : 'text-gray-500'}`}>
        <Medal className="h-5 w-5" />
        <span className="mt-1">Resultados</span>
      </NavLink>
    </nav>
  );
};

export default BottomNavbar;