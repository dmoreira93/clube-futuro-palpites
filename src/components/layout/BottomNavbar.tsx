// src/components/layout/BottomNavbar.tsx

import { NavLink } from "react-router-dom";
import { Home, Trophy, ListChecks, BarChart2, Calculator, Medal } from "lucide-react"; // <-- Adicionado o ícone Calculator
import { useAuth } from "@/contexts/AuthContext";

const BottomNavbar = () => {
  const { user } = useAuth();

  if (!user) {
    return null; // Não mostra o menu se o usuário não estiver logado
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 md:hidden z-50 shadow-t-lg">
      <NavLink 
        to="/" 
        className={({ isActive }) => `flex flex-col items-center text-xs ${isActive ? 'text-fifa-blue' : 'text-gray-500'}`}
      >
        <Home className="h-6 w-6" />
        <span>Início</span>
      </NavLink>
      <NavLink 
        to="/palpites" 
        className={({ isActive }) => `flex flex-col items-center text-xs ${isActive ? 'text-fifa-blue' : 'text-gray-500'}`}
      >
        <ListChecks className="h-6 w-6" />
        <span>Palpites</span>
      </NavLink>
      
      {/* NOVO LINK PARA O SIMULADOR */}
      <NavLink 
        to="/simulador" 
        className={({ isActive }) => `flex flex-col items-center text-xs ${isActive ? 'text-fifa-blue' : 'text-gray-500'}`}
      >
        <Calculator className="h-6 w-6" />
        <span>Simulador</span>
      </NavLink>

      <NavLink 
        to="/ranking" 
        className={({ isActive }) => `flex flex-col items-center text-xs ${isActive ? 'text-fifa-blue' : 'text-gray-500'}`}
      >
        <Trophy className="h-6 w-6" />
        <span>Ranking</span>
      </NavLink>
      <NavLink 
        to="/resultados" 
        className={({ isActive }) => `flex flex-col items-center text-xs ${isActive ? 'text-fifa-blue' : 'text-gray-500'}`}
      >
        <Medal className="h-6 w-6" />
        <span>Resultados</span>
      </NavLink>
    </nav>
  );
};

export default BottomNavbar;