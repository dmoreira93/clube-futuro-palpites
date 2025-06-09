// src/components/layout/Navbar.tsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Volleyball as SoccerBallIcon,
  Trophy as TrophyIcon,
  User as UserIcon,
  Shield as ShieldIcon,
  LogOut,
  Loader2 // <-- Opcional, para um feedback visual de carregamento
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // ADAPTAÇÃO 1: Obter o estado 'loading' do contexto.
  const { isAuthenticated, isAdmin, user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  // Função para renderizar o conteúdo da navbar para evitar repetição de código
  const renderNavContent = () => {
    // ADAPTAÇÃO 2: Trava de segurança. Se o contexto ainda está carregando,
    // não renderizamos nada (ou um spinner) para evitar erros.
    if (loading) {
      return <Loader2 className="h-5 w-5 animate-spin" />;
    }

    if (!isAuthenticated) {
      return (
        <>
          <Link to="/cadastro">
            <Button variant="outline" className="border-fifa-gold text-fifa-gold hover:bg-fifa-gold hover:text-white">
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
        {/* Acesso seguro com 'user?.name' é mantido como boa prática */}
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
            <span className="font-bold text-lg text-fifa-gold">Clube Futuro Palpites</span>
          </Link>

          {/* Botão do menu mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Navegação Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/criterios" className="hover:text-fifa-gold transition-colors">Critérios</Link>
            <Link to="/resultados" className="hover:text-fifa-gold transition-colors">Resultados</Link>
            <Link to="/palpites" className="hover:text-fifa-gold transition-colors">Meus Palpites</Link>
            
            {isAdmin && (
              <Link to="/admin" className="hover:text-fifa-gold transition-colors flex items-center">
                <ShieldIcon className="w-4 h-4 mr-1" />
                Admin
              </Link>
            )}
            
            {/* O conteúdo dinâmico do desktop agora usa a função renderNavContent */}
            <div className="flex items-center space-x-2">{renderNavContent()}</div>
          </div>
        </div>

        {/* Navegação Mobile */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-3">
              {/* ... links do menu mobile ... */}
              <Link to="/criterios" className="block py-2 px-4 hover:bg-fifa-green rounded transition-colors" onClick={() => setIsMenuOpen(false)}>Critérios</Link>
              <Link to="/resultados" className="block py-2 px-4 hover:bg-fifa-green rounded transition-colors" onClick={() => setIsMenuOpen(false)}>Resultados</Link>
              <Link to="/palpites" className="block py-2 px-4 hover:bg-fifa-green rounded transition-colors" onClick={() => setIsMenuOpen(false)}>Meus Palpites</Link>
              
              {isAdmin && (
                <Link to="/admin" className="block py-2 px-4 hover:bg-fifa-green rounded transition-colors flex items-center" onClick={() => setIsMenuOpen(false)}>
                  <ShieldIcon className="w-4 h-4 mr-1" />
                  Admin
                </Link>
              )}
              
              {/* O conteúdo dinâmico do mobile é renderizado de forma semelhante */}
              <div className="border-t border-white/20 mt-4 pt-4">
                {/* Lógica para mobile um pouco diferente para se adequar ao layout */}
                {loading && <div className="flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>}
                {!loading && !isAuthenticated && (
                  <>
                    <Link to="/cadastro" className="block text-center py-2 px-4 bg-white/10 hover:bg-white/20 rounded font-medium transition-colors" onClick={() => setIsMenuOpen(false)}>Cadastrar</Link>
                    <Link to="/login" className="block text-center mt-2 py-2 px-4 bg-fifa-gold text-fifa-blue rounded font-medium transition-colors" onClick={() => setIsMenuOpen(false)}>Entrar</Link>
                  </>
                )}
                {!loading && isAuthenticated && (
                  <div className="flex items-center justify-between px-4">
                    <span className="text-sm">Olá, {user?.name || user?.email}</span>
                    <button className="flex items-center py-2 px-3 bg-white/10 hover:bg-white/20 rounded transition-colors" onClick={() => { handleLogout(); setIsMenuOpen(false); }}>
                      <LogOut className="w-4 h-4 mr-1" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;