// src/components/layout/BottomNavbar.tsx

import { NavLink } from 'react-router-dom';
// 1. IMPORTE O NOVO ÍCONE
import { Home, ListChecks, Calculator, Trophy, Medal, Newspaper, FileText } from "lucide-react"; 
import { useAuth } from '@/contexts/AuthContext';

const BottomNavbar = () => {
  const { user } = useAuth();

  if (!user) {
    return null; 
  }

  return (
    // 2. AJUSTE O GRID PARA 7 COLUNAS (ou o número que fizer sentido)
    <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-7 items-center border-t bg-white py-2 shadow-t-lg md:hidden">
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
      {/* 3. ADICIONE O NOVO LINK AQUI */}
      <NavLink to="/auditoria" className={({ isActive }) => `flex flex-col items-center text-xs ${isActive ? 'text-fifa-blue' : 'text-gray-500'}`}>
        <FileText className="h-5 w-5" />
        <span className="mt-1">Auditoria</span>
      </NavLink>
    </nav>
  );
};

export default BottomNavbar;