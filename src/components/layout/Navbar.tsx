import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  LogOut, User, Loader2, ListChecks, Shield, Trophy, Calculator, BarChart3, ChevronDown
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyPools } from "@/hooks/useMyPools";
import { Skeleton } from "../ui/skeleton";
import { BotaoComprovante } from "./BotaoComprovante";

const Navbar = () => {
  const { isAuthenticated, isAdmin, user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { poolId } = useParams<{ poolId: string }>(); 
  const { pools, loading: poolsLoading } = useMyPools();

  const currentPool = pools.find(p => p.id === poolId);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const renderUserActions = () => {
    if (loading) return <Loader2 className="h-6 w-6 animate-spin text-white" />;

    if (!isAuthenticated || !user) {
       const noAuthButtonPages = ['/login', '/admin-login', '/cadastro'];
       const shouldHideButtons = noAuthButtonPages.some(path => location.pathname.startsWith(path));

       if (shouldHideButtons) return null;

       return (
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/cadastro")} className="border-fifa-gold text-fifa-gold hover:bg-fifa-gold hover:text-white">Cadastrar</Button>
          <Button size="sm" onClick={() => navigate("/login")} className="bg-fifa-gold text-fifa-blue hover:bg-opacity-90">Entrar</Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3">
        {/* Injeção automatizada do botão de comprovante na barra superior */}
        <BotaoComprovante />

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
            <DropdownMenuItem onSelect={() => navigate('/profile')}><User className="mr-2 h-4 w-4" /><span>Meu Perfil</span></DropdownMenuItem>
            {isAdmin && (<DropdownMenuItem onSelect={() => navigate('/admin')}><Shield className="mr-2 h-4 w-4" /><span>Painel Admin</span></DropdownMenuItem>)}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout}><LogOut className="mr-2 h-4 w-4" /><span>Sair</span></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <div className="flex flex-col sticky top-0 z-40 shadow-lg">
        {/* BARRA AZUL */}
        <nav className="bg-fifa-blue text-white">
        <div className="container mx-auto px-4">
            <div className="flex justify-between items-center py-2 h-16">
            <div className="flex items-center space-x-4">
                <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center space-x-2">
                <BarChart3 className="w-8 h-8 text-fifa-gold" />
                <span className="font-bold text-lg hidden sm:inline text-fifa-gold">Futuro Palpites</span>
                </Link>

                {/* SELETOR DE BOLÃO */}
                {isAuthenticated && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 bg-transparent border-fifa-gold text-fifa-gold hover:bg-fifa-gold hover:text-fifa-blue h-9">
                        {poolsLoading ? (
                        <Skeleton className="h-5 w-24 bg-white/20" />
                        ) : (
                        <span className="truncate max-w-[150px]">{currentPool ? currentPool.name : 'Meus Bolões'}</span>
                        )}
                        <ChevronDown className="h-4 w-4" />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Selecione um Bolão</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {pools.map(pool => (
                        <DropdownMenuItem key={pool.id} asChild>
                        <Link to={`/pool/${pool.id}`} className="cursor-pointer w-full block">
                            {pool.name}
                        </Link>
                        </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link to="/dashboard" className="cursor-pointer">Ver todos / Início</Link>
                    </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                )}
            </div>

            <div className="flex items-center">{renderUserActions()}</div>
            </div>
        </div>
        </nav>

        {/* SUBMENU DO BOLÃO */}
        {isAuthenticated && currentPool && (
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="container mx-auto px-4 overflow-x-auto">
                    <div className="flex space-x-1 h-10 items-center">
                        <Link 
                            to={`/pool/${currentPool.id}`} 
                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${location.pathname === `/pool/${currentPool.id}` ? 'bg-gray-100 text-fifa-blue' : 'text-gray-600 hover:text-fifa-blue hover:bg-gray-50'}`}
                        >
                            Visão Geral
                        </Link>
                        <Link 
                            to={`/pool/${currentPool.id}/palpites`} 
                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${location.pathname.includes('/palpites') ? 'bg-gray-100 text-fifa-blue' : 'text-gray-600 hover:text-fifa-blue hover:bg-gray-50'}`}
                        >
                            <ListChecks className="inline-block w-4 h-4 mr-1 mb-0.5"/>
                            Meus Palpites
                        </Link>
                        <Link 
                            to={`/pool/${currentPool.id}/ranking`} 
                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${location.pathname.includes('/ranking') ? 'bg-gray-100 text-fifa-blue' : 'text-gray-600 hover:text-fifa-blue hover:bg-gray-50'}`}
                        >
                             <Trophy className="inline-block w-4 h-4 mr-1 mb-0.5"/>
                            Ranking
                        </Link>
                        <Link 
                            to={`/pool/${currentPool.id}/resultados`} 
                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${location.pathname.includes('/resultados') ? 'bg-gray-100 text-fifa-blue' : 'text-gray-600 hover:text-fifa-blue hover:bg-gray-50'}`}
                        >
                            Resultados
                        </Link>
                         <Link 
                            to={`/pool/${currentPool.id}/simulador`} 
                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${location.pathname.includes('/simulador') ? 'bg-gray-100 text-fifa-blue' : 'text-gray-600 hover:text-fifa-blue hover:bg-gray-50'}`}
                        >
                            <Calculator className="inline-block w-4 h-4 mr-1 mb-0.5"/>
                            Simulador
                        </Link>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default Navbar;