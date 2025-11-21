import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, PlusCircle, Trophy, Users, LogIn, Newspaper } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const { user, userParticipations, switchPool } = useAuth();
  const navigate = useNavigate();

  const handlePoolSelect = (poolId: string) => {
      switchPool(poolId);
      navigate(`/pool/${poolId}`); 
  };

  const firstName = user?.name?.split(' ')[0] || 'Apostador';

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      
      {/* Cabeçalho de Boas-Vindas */}
      <div className="bg-fifa-blue text-white py-12 px-4 mb-8 shadow-lg">
        <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-fifa-gold mb-2">
                        Olá, {firstName}! 👋
                    </h1>
                    <p className="text-blue-100 text-lg">
                        Pronto para mais uma rodada de palpites?
                    </p>
                </div>
                <div className="flex flex-wrap gap-3 justify-center md:justify-end">
                     <Link to="/join-pool">
                        <Button variant="secondary" className="gap-2 text-fifa-blue font-semibold hover:bg-blue-50">
                            <LogIn className="h-4 w-4" /> Entrar em um Bolão
                        </Button>
                    </Link>
                    <Link to="/create-pool">
                        <Button className="gap-2 bg-fifa-gold text-fifa-blue hover:bg-yellow-500 font-bold border border-yellow-600 shadow-md">
                            <PlusCircle className="h-4 w-4" /> Criar Novo Bolão
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl space-y-10">
        
        {/* Seção de Bolões */}
        <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Trophy className="h-6 w-6 text-fifa-blue" /> Meus Bolões Ativos
            </h2>
            
            {userParticipations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userParticipations.map(({ pool, points }) => (
                        <Card key={pool.id} className="flex flex-col hover:shadow-xl transition-all duration-300 border-t-4 border-t-fifa-blue group bg-white">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl text-fifa-blue group-hover:text-blue-700 transition-colors line-clamp-1" title={pool.name}>
                                            {pool.name}
                                        </CardTitle>
                                        <div className="flex items-center text-xs text-muted-foreground">
                                            <span className="font-medium mr-1">Código:</span> 
                                            <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0 h-5">{pool.invite_code}</Badge>
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 p-2 rounded-full flex-shrink-0">
                                        <Trophy className="h-5 w-5 text-fifa-gold" />
                                    </div>
                                </div>
                            </CardHeader>
                            
                            <CardContent className="flex-grow py-4">
                                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <span className="text-sm text-gray-600 font-medium">Sua Pontuação</span>
                                    <span className="text-2xl font-bold text-fifa-blue">{points} <span className="text-xs font-normal text-gray-500">pts</span></span>
                                </div>
                            </CardContent>
                            
                            <CardFooter className="pt-2">
                                <Button className="w-full bg-fifa-blue hover:bg-blue-900 group-hover:shadow-md transition-all" onClick={() => handlePoolSelect(pool.id)}>
                                    Acessar Painel <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
                    <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-fifa-blue/50" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Você ainda não participa de nenhum bolão</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                        Comece agora mesmo! Você pode criar seu próprio campeonato ou entrar em um existente com um código de convite.
                    </p>
                </div>
            )}
        </section>

        {/* NOVA SEÇÃO: CONTEÚDO EXTRA (NOTÍCIAS) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card de Notícias do Esporte */}
            <Card className="md:col-span-2 bg-gradient-to-br from-white to-blue-50 border-l-4 border-l-green-500 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg">
                            <Newspaper className="h-6 w-6 text-green-700" />
                        </div>
                        <div>
                            <CardTitle className="text-xl text-gray-800">Notícias do Esporte</CardTitle>
                            <CardDescription>Fique por dentro das últimas novidades do mundo da bola.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600 mb-4 text-sm">
                        Acompanhe as transferências, resultados de rodadas anteriores, lesões e análises que podem ajudar você a fazer o palpite certeiro no seu próximo jogo.
                    </p>
                    <Button variant="outline" className="w-full sm:w-auto border-green-600 text-green-700 hover:bg-green-50 hover:text-green-800" onClick={() => navigate('/noticias')}>
                        Ler Notícias <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardContent>
            </Card>

            {/* Card Informativo / Dicas (Opcional, para preencher o grid) */}
            <Card className="bg-white border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                    <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                        <Users className="h-5 w-5 text-amber-500" /> Convide Amigos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600 text-sm mb-4">
                        Quanto mais gente, mais emocionante fica a disputa! Compartilhe o código do seu bolão.
                    </p>
                    <Button variant="ghost" className="w-full text-amber-600 hover:text-amber-700 hover:bg-amber-50" size="sm" onClick={() => {
                        // Lógica simples para copiar o link do site (pode ser melhorada depois)
                        navigator.clipboard.writeText(window.location.origin);
                        // Aqui idealmente usaria um toast, mas como não temos hook aqui fácil, deixamos a ação
                    }}>
                        Copiar Link do App
                    </Button>
                </CardContent>
            </Card>
        </section>

      </div>
    </div>
  );
};

export default Dashboard;