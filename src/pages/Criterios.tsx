import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy as TrophyIcon, Users as UsersIcon, Volleyball as SoccerBallIcon, Medal as MedalIcon } from "lucide-react";

const Criterios = () => {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-fifa-blue">Critérios de Pontuação</h1>
          <p className="text-gray-600 mt-2">
            Entenda como funciona o sistema de pontos do nosso bolão.
            **Para cada categoria (Partidas, Classificação de Grupos), você ganha a pontuação máxima aplicável.**
          </p>
        </div>

        <div className="space-y-8">
          {/* Pontuação por Partida */}
          <Card className="shadow-lg">
            <CardHeader className="bg-fifa-blue text-white">
              <CardTitle className="flex items-center gap-2">
                <SoccerBallIcon className="h-5 w-5 text-fifa-gold" />
                Pontuação por Partidas (Apenas 1 critério por partida)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">
                    10
                  </div>
                  <div>
                    <h3 className="font-semibold">Placar Exato</h3>
                    <p className="text-sm text-gray-600">
                      Você acerta o **PLACAR** exato da partida. **(Prioridade Máxima)**
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">
                    7
                  </div>
                  <div>
                    <h3 className="font-semibold">Acerto de Empate</h3>
                    <p className="text-sm text-gray-600">
                      Você prevê um empate **E** a partida termina empatada, mas com placar diferente.
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">
                    5
                  </div>
                  <div>
                    <h3 className="font-semibold">Vencedor Correto</h3>
                    <p className="text-sm text-gray-600">
                      Você acerta o time vencedor da partida (sem placar exato).
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <div className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold">Acerto Parcial de Gols</h3>
                    <p className="text-sm text-gray-600">
                      Você acerta o número de gols de **um dos times** (mas erra o vencedor e placar).
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Classificação na Fase de Grupos */}
          <Card className="shadow-lg">
            <CardHeader className="bg-fifa-blue text-white">
              <CardTitle className="flex items-center gap-2">
                <UsersIcon className="h-5 w-5 text-fifa-gold" />
                Classificação da Fase de Grupos (Apenas 1 critério por grupo)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">
                    10
                  </div>
                  <div>
                    <h3 className="font-semibold">Classificação Exata do Grupo</h3>
                    <p className="text-sm text-gray-600">
                      Você acerta os **dois times classificados** do grupo e a **ordem correta** (1º e 2º lugares). **(Prioridade Máxima)**
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <div className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">
                    4
                  </div>
                  <div>
                    <h3 className="font-semibold">Classificados Invertidos</h3>
                    <p className="text-sm text-gray-600">
                      Você acerta os **dois times classificados**, mas a ordem está invertida (o 1º está como 2º e vice-versa).
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">
                    5
                  </div>
                  <div>
                    <h3 className="font-semibold">Apenas o Primeiro Classificado</h3>
                    <p className="text-sm text-gray-600">
                      Você acerta apenas o time que ficará em **1º lugar** no grupo.
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">
                    5
                  </div>
                  <div>
                    <h3 className="font-semibold">Apenas o Segundo Classificado</h3>
                    <p className="text-sm text-gray-600">
                      Você acerta apenas o time que ficará em **2º lugar** no grupo.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Classificação Final */}
          <Card className="shadow-lg">
            <CardHeader className="bg-fifa-blue text-white">
              <CardTitle className="flex items-center gap-2">
                <TrophyIcon className="h-5 w-5 text-fifa-gold" />
                Classificação Final do Torneio (Pontos acumulativos)
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
                      Você acerta o time que será o **Campeão** do torneio.
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-gray-50 rounded-lg border-l-4 border-gray-400">
                  <div className="bg-gray-400 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">
                    25
                  </div>
                  <div>
                    <h3 className="font-semibold">Vice-Campeão</h3>
                    <p className="text-sm text-gray-600">
                      Você acerta o time que será o **Vice-Campeão** do torneio.
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-green-50 rounded-lg border-l-4 border-green-700">
                  <div className="bg-green-700 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">
                    15
                  </div>
                  <div>
                    <h3 className="font-semibold">Terceiro Lugar</h3>
                    <p className="text-sm text-gray-600">
                      Você acerta o time que ficará em **Terceiro Lugar**.
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-red-50 rounded-lg border-l-4 border-red-600">
                  <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">
                    10
                  </div>
                  <div>
                    <h3 className="font-semibold">Quarto Lugar</h3>
                    <p className="text-sm text-gray-600">
                      Você acerta o time que ficará em **Quarto Lugar**.
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-blue-50 rounded-lg border-l-4 border-blue-600">
                  <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">
                    20
                  </div>
                  <div>
                    <h3 className="font-semibold">Placar da Final</h3>
                    <p className="text-sm text-gray-600">
                      Você acerta o **placar exato** da partida final do torneio.
                    </p>
                  </div>
                </div>

                <div className="flex items-center p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-700">
                  <div className="bg-yellow-700 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">
                    +35
                  </div>
                  <div>
                    <h3 className="font-semibold">Bônus: Top 4 Exato</h3>
                    <p className="text-sm text-gray-600">
                      Pontos **adicionais** por acertar o **Campeão, Vice-Campeão, Terceiro e Quarto lugares na ordem exata**.
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