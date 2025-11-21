// src/pages/Dashboard.tsx

import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, PlusCircle, Trophy, Users, LogIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const { user, userParticipations, switchPool } = useAuth();
  const navigate = useNavigate();

  const handlePoolSelect = (poolId: string) => {
      switchPool(poolId);
      navigate(`/pool/${poolId}`); 
  };

  // Obtém o primeiro nome do usuário para uma saudação pessoal
  const firstName = user?.name?.split(' ')[0] || 'Apostador';

  return (
    <div className="min-h-screen bg-gray-50/50">
      
      {/* Cabeçalho de Boas-Vindas */}
      <div className="bg-fifa-blue text-white py-12 px-4 mb-8 shadow-lg">
        <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-fifa-gold mb-2">
                        Olá, {firstName}! 👋
                    </h1>
                    <p className="text-blue-100 text-lg">
                        Pronto para mais uma rodada de palpites?
                    </p>
                </div>
                <div className="flex gap-3">
                     <Link to="/join-pool">
                        <Button variant="secondary" className="gap-2 text-fifa-blue font-semibold">
                            <LogIn className="h-4 w-4" /> Entrar em um Bolão
                        </Button>
                    </Link>
                    <Link to="/create-pool">
                        <Button className="gap-2 bg-fifa-gold text-fifa-blue hover:bg-yellow-500 font-bold border border-yellow-600">
                            <PlusCircle className="h-4 w-4" /> Criar Novo Bolão
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl pb-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Trophy className="h-6 w-6 text-fifa-blue" /> Meus Bolões Ativos
        </h2>
        
        {userParticipations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userParticipations.map(({ pool, points }) => (
                    <Card key={pool.id} className="flex flex-col hover:shadow-xl transition-all duration-300 border-t-4 border-t-fifa-blue group">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl text-fifa-blue group-hover:text-blue-700 transition-colors">
                                        {pool.name}
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        Código: <Badge variant="outline" className="font-mono ml-1">{pool.invite_code}</Badge>
                                    </CardDescription>
                                </div>
                                <div className="bg-blue-50 p-2 rounded-full">
                                    <Trophy className="h-5 w-5 text-fifa-gold" />
                                </div>
                            </div>
                        </CardHeader>
                        
                        <CardContent className="flex-grow py-4">
                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
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
            <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-fifa-blue/50" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Você ainda não participa de nenhum bolão</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    Comece agora mesmo! Você pode criar seu próprio campeonato ou entrar em um existente com um código de convite.
                </p>
                <div className="flex justify-center gap-4">
                    <Link to="/join-pool">
                        <Button variant="outline">Entrar com Código</Button>
                    </Link>
                    <Link to="/create-pool">
                        <Button>Criar Primeiro Bolão</Button>
                    </Link>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;