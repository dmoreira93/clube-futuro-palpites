import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Star, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Criterios = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Cabeçalho Simples da Página */}
      <div className="bg-fifa-blue text-white py-8 px-4 text-center shadow-md">
        <div className="container mx-auto relative">
            {/* Botão Voltar */}
            <Button 
                variant="ghost" 
                className="absolute left-0 top-1/2 -translate-y-1/2 text-white hover:bg-white/10"
                onClick={() => navigate(-1)}
            >
                <ArrowLeft className="h-5 w-5 mr-2" /> Voltar
            </Button>
            <h1 className="text-3xl font-bold text-fifa-gold">Critérios de Pontuação</h1>
            <p className="text-gray-300 mt-2">Entenda como seus pontos são calculados.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl flex-grow">
        
        <div className="grid gap-6">
            {/* CARD 1: PLACAR EXATO */}
            <Card className="border-l-4 border-l-fifa-gold shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className="bg-yellow-100 p-3 rounded-full">
                        <Trophy className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                        <CardTitle className="text-xl text-fifa-blue">Placar Exato (Cravada)</CardTitle>
                        <CardDescription>Acertou o vencedor e o número exato de gols de ambos.</CardDescription>
                    </div>
                    <div className="ml-auto text-2xl font-bold text-fifa-blue">25 pts</div>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600 text-sm">Exemplo: Você apostou 2x1 e o jogo foi 2x1.</p>
                </CardContent>
            </Card>

            {/* CARD 2: RESULTADO E GOLS DE UM TIME */}
            <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className="bg-blue-100 p-3 rounded-full">
                        <Star className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <CardTitle className="text-xl text-fifa-blue">Resultado + Gols de um Time</CardTitle>
                        <CardDescription>Acertou quem ganhou (ou empate) e os gols de uma das equipes.</CardDescription>
                    </div>
                    <div className="ml-auto text-2xl font-bold text-fifa-blue">18 pts</div>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600 text-sm">Exemplo: Apostou 2x1 (Vitória Casa). O jogo foi 2x0. Acertou vitória e gols do mandante.</p>
                </CardContent>
            </Card>

            {/* CARD 3: SALDO DE GOLS */}
            <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className="bg-green-100 p-3 rounded-full">
                        <Star className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <CardTitle className="text-xl text-fifa-blue">Saldo de Gols</CardTitle>
                        <CardDescription>Acertou o vencedor e a diferença de gols.</CardDescription>
                    </div>
                    <div className="ml-auto text-2xl font-bold text-fifa-blue">15 pts</div>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600 text-sm">Exemplo: Apostou 3x1 (Diferença 2). O jogo foi 2x0 (Diferença 2). </p>
                </CardContent>
            </Card>

             {/* CARD 4: APENAS RESULTADO */}
             <Card className="border-l-4 border-l-gray-400 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className="bg-gray-100 p-3 rounded-full">
                        <Star className="h-6 w-6 text-gray-600" />
                    </div>
                    <div>
                        <CardTitle className="text-xl text-fifa-blue">Apenas Resultado</CardTitle>
                        <CardDescription>Acertou apenas quem ganhou ou se deu empate.</CardDescription>
                    </div>
                    <div className="ml-auto text-2xl font-bold text-fifa-blue">10 pts</div>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600 text-sm">Exemplo: Apostou 1x0. O jogo foi 4x2. O vencedor é o mesmo.</p>
                </CardContent>
            </Card>

             {/* CARD 5: GOL DE UM TIME (Consolo) */}
             <Card className="border-l-4 border-l-orange-400 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className="bg-orange-100 p-3 rounded-full">
                        <AlertCircle className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                        <CardTitle className="text-xl text-fifa-blue">Apenas Gols de um Time</CardTitle>
                        <CardDescription>Errou o resultado, mas acertou a quantidade de gols de uma equipe.</CardDescription>
                    </div>
                    <div className="ml-auto text-2xl font-bold text-fifa-blue">2 pts</div>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600 text-sm">Exemplo: Apostou 1x1. O jogo foi 1x2. Acertou o gol do mandante.</p>
                </CardContent>
            </Card>

        </div>
      </div>
    </div>
  );
};

export default Criterios;