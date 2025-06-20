// src/components/layout/BottomNavbar.tsx (Apenas para referência)

import { NavLink } from 'react-router-dom';
import { Home, ListChecks, Calculator, Trophy, Medal } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

const BottomNavbar = () => {
  const { user } = useAuth();

  // O menu só aparece para usuários logados
  if (!user) {
    return null; 
  }

  // Links que foram removidos do menu hambúrguer agora vivem aqui no mobile
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around border-t bg-white py-2 shadow-t-lg md:hidden">
      <NavLink to="/dashboard" end className={({ isActive }) => `flex flex-col items-center text-xs ${isActive ? 'text-fifa-blue' : 'text-gray-500'}`}>
        <Home className="h-6 w-6" />
        <span>Início</span>
      </NavLink>
      <NavLink to="/palpites" className={({ isActive }) => `flex flex-col items-center text-xs ${isActive ? 'text-fifa-blue' : 'text-gray-500'}`}>
        <ListChecks className="h-6 w-6" />
        <span>Palpites</span>
      </NavLink>
      <NavLink to="/simulador" className={({ isActive }) => `flex flex-col items-center text-xs ${isActive ? 'text-fifa-blue' : 'text-gray-500'}`}>
        <Calculator className="h-6 w-6" />
        <span>Simulador</span>
      </NavLink>
      <NavLink to="/ranking" className={({ isActive }) => `flex flex-col items-center text-xs ${isActive ? 'text-fifa-blue' : 'text-gray-500'}`}>
        <Trophy className="h-6 w-6" />
        <span>Ranking</span>
      </NavLink>
      <NavLink to="/resultados" className={({ isActive }) => `flex flex-col items-center text-xs ${isActive ? 'text-fifa-blue' : 'text-gray-500'}`}>
        <Medal className="h-6 w-6" />
        <span>Resultados</span>
      </NavLink>
    </nav>
  );
};

export default BottomNavbar;