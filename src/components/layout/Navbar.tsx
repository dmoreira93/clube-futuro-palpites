// src/components/layout/Navbar.tsx (VERSÃO FINAL CORRIGIDA)

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
  LogOut, User, Loader2, Newspaper, FileText,
  ListChecks, Shield, Trophy, Medal, Calculator, BarChart3
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Componente auxiliar para os links de navegação com estilo
const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Button variant="ghost" asChild className="text-sm font-semibold text-white hover:bg-white/10 hover:text-white">
    <Link to={to}>{children}</Link>
  </Button>
);

const Navbar = () => {
  const { isAuthenticated, isAdmin, user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Verifica se a rota atual é a página inicial
  const isHomePage = location.pathname === '/';

  const renderUserActions = () => {
    // Exibe um loader enquanto a autenticação está carregando
    if (loading && !user) return <Loader2 className="h-6 w-6 animate-spin text-white" />;

    // Lógica para usuário DESLOGADO
    if (!isAuthenticated) {
      // Se estiver na página inicial, não mostra os botões de Entrar/Cadastrar
      if (isHomePage) {
        return null;
      }
      // Em outras páginas, mostra os botões
      return (
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/cadastro")} className="border-fifa-gold text-fifa-gold hover:bg-fifa-gold hover:text-white">Cadastrar</Button>
          <Button size="sm" onClick={() => navigate("/login")} className="bg-fifa-gold text-fifa-blue hover:bg-opacity-90">Entrar</Button>
        </div>
      );
    }
    
    // Lógica para usuário LOGADO (Menu do Perfil)
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10 border-2 border-fifa-gold"><AvatarImage src={user.avatar_url || undefined} alt={user.name || 'Avatar'} /><AvatarFallback className="bg-fifa-blue text-fifa-gold">{user.name ? user.name.substring(0, 2).toUpperCase() : <User />}</AvatarFallback></Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1"><p className="text-sm font-medium leading-none">{user.name}</p><p className="text-xs leading-none text-muted-foreground">{user.email}</p></div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => navigate('/profile')}><User className="mr-2 h-4 w-4" /><span>Meu Perfil</span></DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate('/palpites')}><ListChecks className="mr-2 h-4 w-4" /><span>Palpites</span></DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate('/simulador')}><Calculator className="mr-2 h-4 w-4" /><span>Simulador</span></DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate('/auditoria')}><FileText className="mr-2 h-4 w-4" /><span>Auditoria de Pontos</span></DropdownMenuItem>
          {isAdmin && (<DropdownMenuItem onSelect={() => navigate('/admin')}><Shield className="mr-2 h-4 w-4" /><span>Painel Admin</span></DropdownMenuItem>)}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleLogout}><LogOut className="mr-2 h-4 w-4" /><span>Sair</span></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <nav className="bg-fifa-blue text-white shadow-lg sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-2 h-16">
          <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-2">
            <BarChart3 className="w-8 h-8 text-fifa-gold" />
            <span className="font-bold text-lg hidden sm:inline text-fifa-gold">Futuro Palpites</span>
          </Link>
          
          {/* Links de navegação principais */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink to="/criterios">Critérios</NavLink>
            {isAuthenticated && (
              <>
                <NavLink to="/ranking">Ranking</NavLink>
                <NavLink to="/resultados">Resultados</NavLink>
                <NavLink to="/noticias">Notícias</NavLink>
              </>
            )}
          </div>

          <div className="flex items-center">{renderUserActions()}</div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;