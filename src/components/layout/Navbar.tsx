// src/components/layout/Navbar.tsx (EDITADO COM SELETOR DE BOLÕES)

import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
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
  ListChecks, Shield, Trophy, Medal, Calculator, BarChart3, ChevronDown
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyPools } from "@/hooks/useMyPools";
import { Skeleton } from "../ui/skeleton";

const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Button variant="ghost" asChild className="text-sm font-semibold text-white hover:bg-white/10 hover:text-white">
    <Link to={to}>{children}</Link>
  </Button>
);

const Navbar = () => {
  const { isAuthenticated, isAdmin, user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // --- LÓGICA PARA O SELETOR DE BOLÃO ---
  const { poolId } = useParams<{ poolId: string }>();
  const { pools, loading: poolsLoading } = useMyPools();
  const currentPool = pools.find(p => p.id === poolId);
  // --- FIM DA LÓGICA ---


  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const renderUserActions = () => {
    if (loading && !user) return <Loader2 className="h-6 w-6 animate-spin text-white" />;

    if (!isAuthenticated) {
      const noAuthButtonPages = ['/login', '/admin-login', '/criterios'];
      const shouldHideButtons = noAuthButtonPages.includes(location.pathname) || location.pathname.startsWith('/cadastro') || location.pathname === '/';

      if (shouldHideButtons) {
        return null;
      }

      return (
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/cadastro")} className="border-fifa-gold text-fifa-gold hover:bg-fifa-gold hover:text-white">Cadastrar</Button>
          <Button size="sm" onClick={() => navigate("/login")} className="bg-fifa-gold text-fifa-blue hover:bg-opacity-90">Entrar</Button>
        </div>
      );
    }

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
          <DropdownMenuItem onSelect={() => navigate('/criterios')}><Trophy className="mr-2 h-4 w-4" /><span>Critérios</span></DropdownMenuItem>
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
          <div className="flex items-center space-x-4">
            <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-2">
              <BarChart3 className="w-8 h-8 text-fifa-gold" />
              <span className="font-bold text-lg hidden sm:inline text-fifa-gold">Futuro Palpites</span>
            </Link>

            {/* --- SELETOR DE BOLÕES ADICIONADO AQUI --- */}
            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 bg-transparent border-fifa-gold text-fifa-gold hover:bg-fifa-gold hover:text-fifa-blue">
                    {poolsLoading ? (
                      <Skeleton className="h-5 w-24 bg-white/20" />
                    ) : (
                      <span className="truncate max-w-[150px]">{currentPool?.name || 'Meus Bolões'}</span>
                    )}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Trocar de Bolão</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {pools.map(pool => (
                    <DropdownMenuItem key={pool.id} asChild>
                      <Link to={`/pools/${pool.id}`}>{pool.name}</Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">Ver todos</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {/* --- FIM DO SELETOR --- */}
          </div>

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