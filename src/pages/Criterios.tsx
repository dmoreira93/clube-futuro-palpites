
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy as TrophyIcon, Users as UsersIcon, Football as SoccerBallIcon } from "lucide-react";

const Criterios = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-fifa-blue">Critérios de Pontuação</h1>
          <p className="text-gray-600 mt-2">
            Entenda como funciona o sistema de pontos do nosso bolão
          </p>
        </div>

        <div className="space-y-8">
          <Card className="shadow-lg">
            <CardHeader className="bg-fifa-blue text-white">
              <CardTitle className="flex items-center gap-2">
                <SoccerBallIcon className="h-5 w-5 text-fifa-gold" />
                Pontuação por Partida
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">
                    10
                  </div>
                  <div>
                    <h3 className="font-semibold">Acerto vencedor e placar</h3>
                    <p className="text-sm text-gray-600">
                      Pontuação máxima por acertar o vencedor e o placar exato da partida
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">
                    7
                  </div>
                  <div>
                    <h3 className="font-semibold">Acerto vencedor</h3>
                    <p className="text-sm text-gray-600">
                      Pontuação por acertar apenas o vencedor, sem o placar exato
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <div className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold">Acerto parcial</h3>
                    <p className="text-sm text-gray-600">
                      Pontuação por acertar o placar de apenas um dos times (placar time 1 ou 2)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="bg-fifa-blue text-white">
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5 text-fifa-gold" />
                Classificação na Fase de Grupos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">
                    5
                  </div>
                  <div>
                    <h3 className="font-semibold">1º lugar do grupo</h3>
                    <p className="text-sm text-gray-600">
                      Pontuação por acertar o time que ficará em 1º no grupo
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">
                    5
                  </div>
                  <div>
                    <h3 className="font-semibold">2º lugar do grupo</h3>
                    <p className="text-sm text-gray-600">
                      Pontuação por acertar o time que ficará em 2º no grupo
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-indigo-50 rounded-lg border-l-4 border-indigo-500">
                  <div className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">
                    7
                  </div>
                  <div>
                    <h3 className="font-semibold">Classificação completa</h3>
                    <p className="text-sm text-gray-600">
                      Acertar os dois classificados na ordem certa (1º e 2º lugares)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="bg-fifa-blue text-white">
              <CardTitle className="flex items-center gap-2">
                <TrophyIcon className="h-5 w-5 text-fifa-gold" />
                Classificação Final
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                  <div className="bg-amber-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">
                    50
                  </div>
                  <div>
                    <h3 className="font-semibold">Campeão</h3>
                    <p className="text-sm text-gray-600">
                      Pontuação por acertar o time que será campeão
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-gray-50 rounded-lg border-l-4 border-gray-400">
                  <div className="bg-gray-400 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">
                    25
                  </div>
                  <div>
                    <h3 className="font-semibold">Vice-campeão</h3>
                    <p className="text-sm text-gray-600">
                      Pontuação por acertar o time que será vice-campeão
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-amber-50 rounded-lg border-l-4 border-amber-700">
                  <div className="bg-amber-700 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">
                    15
                  </div>
                  <div>
                    <h3 className="font-semibold">Terceiro lugar</h3>
                    <p className="text-sm text-gray-600">
                      Pontuação por acertar o time que ficará em terceiro lugar
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-gray-50 rounded-lg border-l-4 border-gray-600">
                  <div className="bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">
                    10
                  </div>
                  <div>
                    <h3 className="font-semibold">Quarto lugar</h3>
                    <p className="text-sm text-gray-600">
                      Pontuação por acertar o time que ficará em quarto lugar
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Criterios;
