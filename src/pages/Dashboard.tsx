// src/pages/Dashboard.tsx

import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, PlusCircle } from "lucide-react";

const Dashboard = () => {
  const { userParticipations, switchPool } = useAuth();
  const navigate = useNavigate();

  const handlePoolSelect = (poolId: string) => {
      switchPool(poolId);
      // Redireciona para a nova rota de detalhes do bolão
      navigate(`/pool/${poolId}`); 
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-fifa-blue">Meus Bolões</h1>
        <p className="text-muted-foreground mt-2">Selecione um bolão para ver seus palpites e o ranking.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userParticipations.map(({ pool, points }) => (
            <Card key={pool.id} className="flex flex-col hover:shadow-xl transition-shadow">
                <CardHeader>
                    <CardTitle>{pool.name}</CardTitle>
                    <CardDescription>Sua pontuação: <span className="font-bold">{points}</span></CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground">Código de Convite: {pool.invite_code}</p>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={() => handlePoolSelect(pool.id)}>
                        Acessar Bolão <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>
        ))}

        <Card className="border-dashed border-2 flex flex-col items-center justify-center text-center p-6 hover:border-primary transition-colors">
            <PlusCircle className="h-10 w-10 text-muted-foreground mb-4"/>
            <CardTitle className="text-xl mb-2">Novo Bolão</CardTitle>
            <CardDescription className="mb-4">Entre em um bolão com um código de convite ou crie o seu!</CardDescription>
            <Link to="/join-pool">
                <Button>Entrar ou Criar</Button>
            </Link>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;