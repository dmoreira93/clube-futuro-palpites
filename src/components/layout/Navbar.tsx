// src/components/layout/Navbar.tsx

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Volleyball as SoccerBallIcon,
  Shield as ShieldIcon,
  LogOut,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, isAdmin, user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const renderNavContent = () => {
    // **CORREÇÃO AQUI**
    // Mostra o loading apenas se o usuário ESTIVER autenticado mas os dados ainda não carregaram.
    // Isso evita o spinner infinito para usuários deslogados.
    if (loading && isAuthenticated) {
      return <Loader2 className="h-5 w-5 animate-spin" />;
    }

    if (!isAuthenticated) {
      if (isHomePage) {
        return null; 
      }
      return (
        <>
          <Link to="/cadastro">
            <Button
              variant="outline"
              className="border-fifa-gold text-fifa-gold hover:bg-fifa-gold hover:text-white"
            >
              Cadastrar
            </Button>
          </Link>
          <Link to="/login">
            <Button className="bg-fifa-gold text-fifa-blue hover:bg-opacity-90">
              Entrar
            </Button>
          </Link>
        </>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm">Olá, {user?.name || user?.email}</span>
        <Button
          variant="outline"
          size="sm"
          className="border-fifa-gold text-fifa-gold hover:bg-fifa-gold hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-1" />
          Sair
        </Button>
      </div>
    );
  };
  
  return (
    <nav className="bg-fifa-blue text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-3">
          <Link to="/" className="flex items-center space-x-2">
            <SoccerBallIcon className="w-6 h-6 text-fifa-gold" />
            <span className="font-bold text-lg text-fifa-gold">
              Clube Futuro Palpites
            </span>
          </Link>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white focus:outline-none"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/criterios"
              className="hover:text-fifa-gold transition-colors"
            >
              Critérios
            </Link>
            {isAuthenticated && (
              <Link
                to="/resultados"
                className="hover:text-fifa-gold transition-colors"
              >
                Resultados
              </Link>
            )}
            
            {isAuthenticated && (
              <>
                <Link
                  to="/palpites"
                  className="hover:text-fifa-gold transition-colors"
                >
                  Meus Palpites
                </Link>
                <Link
                  to="/simulador"
                  className="hover:text-fifa-gold transition-colors"
                >
                  Simulador
                </Link>
              </>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className="hover:text-fifa-gold transition-colors flex items-center"
              >
                <ShieldIcon className="w-4 h-4 mr-1" />
                Admin
              </Link>
            )}

            <div className="flex items-center space-x-2">
              {renderNavContent()}
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-3">
              <Link
                to="/criterios"
                className="block py-2 px-4 hover:bg-fifa-green rounded transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Critérios
              </Link>
              {isAuthenticated && (
                <Link
                  to="/resultados"
                  className="block py-2 px-4 hover:bg-fifa-green rounded transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Resultados
                </Link>
              )}

              {isAuthenticated && (
                <>
                  <Link
                    to="/palpites"
                    className="block py-2 px-4 hover:bg-fifa-green rounded transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Meus Palpites
                  </Link>
                  <Link
                    to="/simulador"
                    className="block py-2 px-4 hover:bg-fifa-green rounded transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Simulador
                  </Link>
                </>
              )}

              {isAdmin && (
                <Link
                  to="/admin"
                  className="block py-2 px-4 hover:bg-fifa-green rounded transition-colors flex items-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ShieldIcon className="w-4 h-4 mr-1" />
                  Admin
                </Link>
              )}

              <div className="border-t border-white/20 mt-4 pt-4">
                <div className="flex flex-col items-start space-y-2">
                  {renderNavContent()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;