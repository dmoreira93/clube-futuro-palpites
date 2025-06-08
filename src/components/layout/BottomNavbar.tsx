import { Home, Trophy, ListChecks, LogIn, Pencil } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const BottomNavbar = () => {
  const { isAuthenticated } = useAuth();

  // Itens do menu para visitantes NÃO LOGADOS
  const navItemsPublic = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/login', label: 'Login', icon: LogIn },
    { href: '/ranking', label: 'Ranking', icon: Trophy },
    { href: '/resultados', label: 'Resultados', icon: ListChecks },
  ];

  // Itens do menu para usuários LOGADOS
  const navItemsAuthenticated = [
    { href: '/', label: 'Início', icon: Home },
    { href: '/palpites', label: 'Palpites', icon: Pencil },
    { href: '/resultados', label: 'Resultados', icon: ListChecks },
  ];

  const items = isAuthenticated ? navItemsAuthenticated : navItemsPublic;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex justify-around h-16">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full text-xs transition-colors duration-200 ${
                isActive ? 'text-fifa-blue' : 'text-gray-500 hover:text-fifa-blue'
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