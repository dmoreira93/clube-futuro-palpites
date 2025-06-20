// src/components/layout/Navbar.tsx (VERSÃO FINAL E SIMPLIFICADA)

import { Link, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  // O estado isMenuOpen e a lógica do menu mobile foram removidos.
  const { isAuthenticated, isAdmin, user, signOut, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  // Esta função agora renderiza as ações do usuário em TODAS as telas (mobile e desktop)
  const renderUserActions = () => {
    // Mostra o loader apenas enquanto o estado de autenticação carrega
    if (loading && !user) {
      return <Loader2 className="h-6 w-6 animate-spin text-white" />;
    }

    // Se não estiver autenticado, mostra os botões de Login/Cadastro
    if (!isAuthenticated) {
      return (
        <div className="flex items-center space-x-2">
          <Link to="/cadastro">
            <Button
              variant="outline"
              size="sm"
              className="border-fifa-gold text-fifa-gold hover:bg-fifa-gold hover:text-white"
            >
              Cadastrar
            </Button>
          </Link>
          <Link to="/login">
            <Button size="sm" className="bg-fifa-gold text-fifa-blue hover:bg-opacity-90">
              Entrar
            </Button>
          </Link>
        </div>
      );
    }

    // Se estiver autenticado, mostra o DropdownMenu com o avatar do usuário
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
          <DropdownMenuItem onSelect={() => navigate('/profile')}>
            <User className="mr-2 h-4 w-4" />
            <span>Meu Perfil</span>
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem onSelect={() => navigate('/admin')}>
                <ShieldIcon className="mr-2 h-4 w-4" />
                <span>Painel Admin</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
     <nav className="bg-fifa-blue text-white shadow-lg sticky top-0 z-40">
      <div className="container mx-auto px-4">
        {/* Layout principal da Navbar com justify-between */}
        <div className="flex justify-between items-center py-2">
          
          {/* 1. Logo (sempre visível à esquerda) */}
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-2">
            <SoccerBallIcon className="w-8 h-8 text-fifa-gold" />
            <span className="font-bold text-lg hidden sm:inline text-fifa-gold">
              Futuro Palpites
            </span>
          </Link>
          
          {/* 2. Links de Navegação centrais (visíveis apenas no desktop) */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && <Link to="/ranking" className="hover:text-fifa-gold transition-colors">Ranking</Link>}
            {isAuthenticated && <Link to="/palpites-do-dia" className="hover:text-fifa-gold transition-colors">Palpites da Galera</Link>}
            {isAuthenticated && <Link to="/palpites" className="hover:text-fifa-gold transition-colors">Meus Palpites</Link>}
            {isAuthenticated && <Link to="/simulador" className="hover:text-fifa-gold transition-colors">Simulador</Link>}
          </div>

          {/* 3. Ações do Usuário (sempre visível à direita) */}
          <div className="flex items-center">
            {renderUserActions()}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;