// src/components/layout/Navbar.tsx (VERSÃO COMPLETA E ATUALIZADA)

import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Volleyball as SoccerBallIcon,
  Shield as ShieldIcon,
  LogOut,
  User,
  Loader2,
  Menu,
  X,
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

  // Função para renderizar o conteúdo do usuário na versão DESKTOP
  const renderDesktopNav = () => {
    // Mostra o loader apenas se o contexto de autenticação estiver carregando
    if (loading && !user) {
      return <Loader2 className="h-5 w-5 animate-spin" />;
    }

    // Se não estiver autenticado (e não for a homepage), mostra botões de Login/Cadastro
    if (!isAuthenticated) {
      if (isHomePage) return null;
      return (
        <div className="flex items-center space-x-2">
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
        </div>
      );
    }

    // Se estiver autenticado, mostra o DropdownMenu com todas as opções do usuário
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10 border-2 border-fifa-gold">
              <AvatarImage src={user.avatar_url || undefined} alt={user.name || 'Avatar'} />
              <AvatarFallback className="bg-fifa-blue text-fifa-gold">
                {user.name ? user.name.substring(0, 2).toUpperCase() : <User />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {/* Link para o novo Perfil */}
          <DropdownMenuItem onSelect={() => navigate('/profile')}>
            <User className="mr-2 h-4 w-4" />
            <span>Meu Perfil</span>
          </DropdownMenuItem>
          {/* Link de Admin, que só aparece se o usuário for admin */}
          {isAdmin && (
            <DropdownMenuItem onSelect={() => navigate('/admin')}>
                <ShieldIcon className="mr-2 h-4 w-4" />
                <span>Painel Admin</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {/* Botão de Sair */}
          <DropdownMenuItem onSelect={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Função para renderizar o conteúdo do usuário na versão MOBILE (dentro do menu sanduíche)
  const renderMobileNav = () => {
     if (loading && !user) { return <div className="p-4"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>; }
     if (!isAuthenticated) {
        return (
            <div className="flex flex-col gap-2 p-4">
                 <Button asChild variant="outline" onClick={() => setIsMenuOpen(false)}><Link to="/cadastro">Cadastrar</Link></Button>
                 <Button asChild onClick={() => setIsMenuOpen(false)}><Link to="/login">Entrar</Link></Button>
            </div>
        )
     }
     return (
        <div className="flex flex-col gap-2 p-4">
            <span className="text-center font-semibold">{user.name}</span>
            <Button variant="outline" onClick={() => { navigate('/profile'); setIsMenuOpen(false); }}>Meu Perfil</Button>
            {isAdmin && <Button variant="secondary" onClick={() => { navigate('/admin'); setIsMenuOpen(false); }}>Admin</Button>}
            <Button variant="destructive" onClick={() => { handleLogout(); setIsMenuOpen(false); }}><LogOut className="mr-2 h-4 w-4"/> Sair</Button>
        </div>
     )
  }

  // JSX Principal do Componente
  return (
     <nav className="bg-fifa-blue text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Container principal da Navbar */}
        <div className="flex justify-between items-center py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <SoccerBallIcon className="w-6 h-6 text-fifa-gold" />
            <span className="font-bold text-lg text-fifa-gold">Clube Futuro Palpites</span>
          </Link>
          
          {/* Botão do Menu Mobile (hambúrguer) */}
          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white focus:outline-none">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
          
          {/* Links para Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Estes são os links de navegação que aparecem para todos ou para usuários logados */}
            <Link to="/criterios" className="hover:text-fifa-gold transition-colors">Critérios</Link>
            {isAuthenticated && <Link to="/ranking" className="hover:text-fifa-gold transition-colors">Ranking</Link>}
            {isAuthenticated && <Link to="/resultados" className="hover:text-fifa-gold transition-colors">Resultados</Link>}
            {isAuthenticated && <Link to="/palpites" className="hover:text-fifa-gold transition-colors">Meus Palpites</Link>}
            {isAuthenticated && <Link to="/simulador" className="hover:text-fifa-gold transition-colors">Simulador</Link>}
            {/* A função abaixo renderiza o menu de usuário ou os botões de login/cadastro */}
            {renderDesktopNav()}
          </div>
        </div>

        {/* Conteúdo do Menu Mobile (quando está aberto) */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-2">
                {/* Links de navegação replicados para o menu mobile */}
                <Link to="/criterios" className="block py-2 px-4 hover:bg-fifa-green rounded" onClick={() => setIsMenuOpen(false)}>Critérios</Link>
                {isAuthenticated && <Link to="/ranking" className="block py-2 px-4 hover:bg-fifa-green rounded" onClick={() => setIsMenuOpen(false)}>Ranking</Link>}
                {isAuthenticated && <Link to="/resultados" className="block py-2 px-4 hover:bg-fifa-green rounded" onClick={() => setIsMenuOpen(false)}>Resultados</Link>}
                {isAuthenticated && <Link to="/palpites" className="block py-2 px-4 hover:bg-fifa-green rounded" onClick={() => setIsMenuOpen(false)}>Meus Palpites</Link>}
                {isAuthenticated && <Link to="/simulador" className="block py-2 px-4 hover:bg-fifa-green rounded" onClick={() => setIsMenuOpen(false)}>Simulador</Link>}
                
                {/* A função abaixo renderiza as opções de perfil ou os botões de login/cadastro no mobile */}
                <div className="border-t border-white/20 mt-2 pt-2">
                    {renderMobileNav()}
                </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;