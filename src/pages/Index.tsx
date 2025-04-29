
import Layout from "@/components/layout/Layout";
import RankingTable from "@/components/home/RankingTable";
import NextMatches from "@/components/home/NextMatches";
import StatsCard from "@/components/home/StatsCard";
import { Trophy as TrophyIcon, User as UserIcon, Soccer as SoccerBallIcon, Flag as FlagIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <Layout>
      <div className="mb-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-fifa-blue mb-2">
            Copa Mundial de Clubes FIFA 2025
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Participe do nosso bolão e teste seus conhecimentos sobre futebol mundial!
          </p>
        </div>

        <div className="bg-gradient-to-r from-fifa-blue to-fifa-green rounded-lg shadow-xl p-6 mb-8 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-3/5 mb-6 md:mb-0">
              <h2 className="text-2xl font-bold mb-2">Mostre que você entende de futebol!</h2>
              <p className="mb-4">Faça seus palpites para todos os jogos da Copa Mundial de Clubes e concorra a prêmios incríveis!</p>
              <div className="flex flex-wrap gap-3">
                <Link to="/cadastro">
                  <Button className="bg-fifa-gold hover:bg-opacity-90 text-fifa-blue font-semibold">
                    Participar Agora
                  </Button>
                </Link>
                <Link to="/criterios">
                  <Button variant="outline" className="border-white text-white hover:bg-white hover:bg-opacity-20">
                    Ver Critérios
                  </Button>
                </Link>
              </div>
            </div>
            <div className="md:w-2/5 flex justify-center">
              <TrophyIcon size={120} className="text-fifa-gold" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatsCard 
            title="Total de Participantes" 
            value="127" 
            icon={<UserIcon className="h-4 w-4" />}
            description="Jogadores registrados" 
          />
          <StatsCard 
            title="Jogos Realizados" 
            value="12/32" 
            icon={<SoccerBallIcon className="h-4 w-4" />}
            description="37% concluído" 
          />
          <StatsCard 
            title="Maior Pontuação" 
            value="145" 
            icon={<TrophyIcon className="h-4 w-4" />}
            description="Carlos Silva" 
          />
          <StatsCard 
            title="Próximo Jogo" 
            value="15/06" 
            icon={<FlagIcon className="h-4 w-4" />}
            description="Real Madrid vs Man. City" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <RankingTable />
          </div>
          <div>
            <div className="space-y-6">
              <NextMatches />
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4 text-fifa-blue">Regras Rápidas</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="bg-fifa-gold text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">10</span>
                      <span>Acerto do vencedor e placar</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-fifa-blue text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">7</span>
                      <span>Acerto apenas do vencedor</span>
                    </li>
                    <li className="flex items-start">
                      <span className="bg-fifa-green text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
                      <span>Acerto parcial (placar de um time)</span>
                    </li>
                  </ul>
                  <div className="mt-4">
                    <Link to="/criterios">
                      <Button variant="link" className="p-0 text-fifa-blue">
                        Ver todas as regras →
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
