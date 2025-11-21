import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Star, AlertCircle, ArrowLeft, Users, Goal } from "lucide-react"; // Ícones do Lucide
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Criterios = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Cabeçalho Padrão (Estilo Novo) */}
      <div className="bg-fifa-blue text-white py-10 px-4 text-center shadow-md">
        <div className="container mx-auto relative max-w-4xl">
            {/* Botão Voltar */}
            <Button 
                variant="ghost" 
                className="absolute left-0 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 hidden md:flex"
                onClick={() => navigate('/')} // Volta para Home se não logado, ou dashboard
            >
                <ArrowLeft className="h-5 w-5 mr-2" /> Voltar
            </Button>
            
            <div className="flex justify-center mb-4">
                <div className="bg-white/10 p-3 rounded-full">
                    <Trophy className="h-8 w-8 text-fifa-gold" />
                </div>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-fifa-gold">Critérios de Pontuação</h1>
            <p className="text-gray-300 mt-2">
                Entenda como funciona o sistema de pontos do nosso bolão.
                <br className="hidden md:block" />
                <strong>Para cada categoria, os pontos são aplicados de forma independente.</strong>
            </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl flex-grow space-y-10">
        
        {/* SEÇÃO 1: PONTUAÇÃO POR PARTIDA */}
        <section>
            <h2 className="text-2xl font-bold text-fifa-blue mb-6 flex items-center">
                <Goal className="mr-2 h-6 w-6 text-fifa-gold"/> Pontuação por Partida
            </h2>
            <div className="grid gap-6">
                {/* Placar Exato */}
                <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <div className="bg-green-100 p-3 rounded-full">
                            <span className="text-xl font-bold text-green-700">10</span>
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-gray-800">Placar Exato</CardTitle>
                            <CardDescription>Acertou o placar exato da partida.</CardDescription>
                        </div>
                    </CardHeader>
                </Card>

                {/* Acertar Empate */}
                <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <div className="bg-purple-100 p-3 rounded-full">
                            <span className="text-xl font-bold text-purple-700">7</span>
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-gray-800">Empate (sem placar exato)</CardTitle>
                            <CardDescription>Acertou que daria empate, mas errou o placar (ex: apostou 1x1, foi 2x2).</CardDescription>
                        </div>
                    </CardHeader>
                </Card>

                {/* Acertar Vencedor */}
                <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <div className="bg-blue-100 p-3 rounded-full">
                            <span className="text-xl font-bold text-blue-700">5</span>
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-gray-800">Vencedor (sem placar exato)</CardTitle>
                            <CardDescription>Acertou quem ganhou, mas errou o placar.</CardDescription>
                        </div>
                    </CardHeader>
                </Card>

                {/* Acerto Parcial */}
                <Card className="border-l-4 border-l-yellow-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <div className="bg-yellow-100 p-3 rounded-full">
                            <span className="text-xl font-bold text-yellow-700">3</span>
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-gray-800">Acerto Parcial de Gols</CardTitle>
                            <CardDescription>Acertou o número de gols de apenas um dos times.</CardDescription>
                        </div>
                    </CardHeader>
                </Card>
            </div>
        </section>

        {/* SEÇÃO 2: CLASSIFICAÇÃO FASE DE GRUPOS */}
        <section>
            <h2 className="text-2xl font-bold text-fifa-blue mb-6 flex items-center">
                <Users className="mr-2 h-6 w-6 text-fifa-gold"/> Classificação da Fase de Grupos
            </h2>
            <div className="grid gap-6">
                <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <div className="bg-green-100 p-3 rounded-full">
                            <span className="text-xl font-bold text-green-700">10</span>
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-gray-800">Classificação Exata</CardTitle>
                            <CardDescription>Acertou o 1º e o 2º colocado na ordem exata.</CardDescription>
                        </div>
                    </CardHeader>
                </Card>

                <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <div className="bg-blue-100 p-3 rounded-full">
                            <span className="text-xl font-bold text-blue-700">5</span>
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-gray-800">Apenas Um Classificado</CardTitle>
                            <CardDescription>Acertou apenas o 1º ou apenas o 2º colocado na posição correta.</CardDescription>
                        </div>
                    </CardHeader>
                </Card>

                <Card className="border-l-4 border-l-yellow-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center gap-4 pb-2">
                        <div className="bg-yellow-100 p-3 rounded-full">
                            <span className="text-xl font-bold text-yellow-700">4</span>
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold text-gray-800">Classificados Invertidos</CardTitle>
                            <CardDescription>Acertou os dois times que passaram, mas na ordem errada.</CardDescription>
                        </div>
                    </CardHeader>
                </Card>
            </div>
        </section>

        {/* SEÇÃO 3: CLASSIFICAÇÃO FINAL */}
        <section>
            <h2 className="text-2xl font-bold text-fifa-blue mb-6 flex items-center">
                <Trophy className="mr-2 h-6 w-6 text-fifa-gold"/> Classificação Final do Torneio
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Campeão */}
                <Card className="border-l-4 border-l-amber-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="bg-amber-100 p-3 rounded-full font-bold text-amber-700 text-xl">50</div>
                        <div><CardTitle className="text-base">Campeão</CardTitle></div>
                    </CardHeader>
                </Card>
                {/* Vice */}
                <Card className="border-l-4 border-l-gray-400 shadow-sm">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="bg-gray-100 p-3 rounded-full font-bold text-gray-700 text-xl">25</div>
                        <div><CardTitle className="text-base">Vice-Campeão</CardTitle></div>
                    </CardHeader>
                </Card>
                {/* 3º Lugar */}
                <Card className="border-l-4 border-l-orange-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="bg-orange-100 p-3 rounded-full font-bold text-orange-700 text-xl">15</div>
                        <div><CardTitle className="text-base">3º Lugar</CardTitle></div>
                    </CardHeader>
                </Card>
                {/* 4º Lugar */}
                <Card className="border-l-4 border-l-red-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="bg-red-100 p-3 rounded-full font-bold text-red-700 text-xl">10</div>
                        <div><CardTitle className="text-base">4º Lugar</CardTitle></div>
                    </CardHeader>
                </Card>
                {/* Placar Final */}
                <Card className="border-l-4 border-l-blue-600 shadow-sm md:col-span-2">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="bg-blue-100 p-3 rounded-full font-bold text-blue-700 text-xl">20</div>
                        <div>
                            <CardTitle className="text-base">Placar da Final</CardTitle>
                            <CardDescription>Acertar o placar exato do jogo final.</CardDescription>
                        </div>
                    </CardHeader>
                </Card>
                {/* Bônus */}
                <Card className="border-l-4 border-l-yellow-600 shadow-sm md:col-span-2 bg-yellow-50/50">
                    <CardHeader className="flex flex-row items-center gap-4">
                        <div className="bg-yellow-100 p-3 rounded-full font-bold text-yellow-700 text-xl">+35</div>
                        <div>
                            <CardTitle className="text-base">Bônus: Top 4 Exato</CardTitle>
                            <CardDescription>Acertar Campeão, Vice, 3º e 4º na ordem exata.</CardDescription>
                        </div>
                    </CardHeader>
                </Card>
            </div>
        </section>

        <div className="text-center mt-8">
            <Button variant="outline" onClick={() => navigate(-1)} className="md:hidden w-full">
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
            </Button>
        </div>

      </div>
    </div>
  );
};

export default Criterios;