// src/components/layout/BottomNavbar.tsx
import { Home, Trophy, ListChecks } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/palpites', label: 'Palpites', icon: ListChecks },
  { href: '/ranking', label: 'Ranking', icon: Trophy },
];

export const BottomNavbar = () => {
  return (
    // Esconde em telas médias ou maiores (md:hidden)
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex justify-around h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end // 'end' garante que a rota "/" não fique ativa para outras rotas
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full text-xs transition-colors duration-200 ${
                isActive
                  ? 'text-fifa-blue' // Cor para o item ativo
                  : 'text-gray-500 hover:text-fifa-blue' // Cor para itens inativos
              }`
            }
          >
            <item.icon className="h-6 w-6 mb-1" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};