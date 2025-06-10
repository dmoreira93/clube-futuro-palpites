// src/pages/Criterios.tsx

// A importação do Layout foi REMOVIDA
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy as TrophyIcon, Users as UsersIcon, Volleyball as SoccerBallIcon } from "lucide-react";

const Criterios = () => {
  // A tag <Layout> foi removida daqui
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-fifa-blue">Critérios de Pontuação</h1>
        <p className="text-gray-600 mt-2">
          Entenda como funciona o sistema de pontos do nosso bolão.
          <br/>
          <strong>Para cada categoria (Partidas, Grupos, Finais), os pontos são aplicados de forma independente.</strong>
        </p>
      </div>

      <div className="space-y-8">
        {/* Pontuação por Partida */}
        <Card className="shadow-lg">
          <CardHeader className="bg-fifa-blue text-white">
            <CardTitle className="flex items-center gap-2">
              <SoccerBallIcon className="h-5 w-5 text-fifa-gold" />
              Pontuação por Partida (Apenas a maior pontuação é aplicada)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">10</div>
                <div>
                  <h3 className="font-semibold">Placar Exato</h3>
                  <p className="text-sm text-gray-600">Você acerta o **PLACAR** exato da partida.</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">5</div>
                <div>
                  <h3 className="font-semibold">Vencedor Correto ou Empate</h3>
                  <p className="text-sm text-gray-600">Você acerta o time vencedor ou que a partida terminaria empatada (sem acertar o placar).</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                <div className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">3</div>
                <div>
                  <h3 className="font-semibold">Acerto Parcial de Gols</h3>
                  <p className="text-sm text-gray-600">Você acerta o número de gols de **apenas um** dos times.</p>
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
              Classificação da Fase de Grupos (Apenas a maior pontuação é aplicada por grupo)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
             <div className="space-y-4">
                <div className="flex items-center p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">10</div>
                    <div>
                        <h3 className="font-semibold">Classificação Exata</h3>
                        <p className="text-sm text-gray-600">Acerta o 1º e o 2º colocado na ordem exata.</p>
                    </div>
                </div>
                <div className="flex items-center p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">5</div>
                    <div>
                        <h3 className="font-semibold">Apenas Um Classificado</h3>
                        <p className="text-sm text-gray-600">Acerta apenas o 1º ou apenas o 2º colocado na sua posição correta.</p>
                    </div>
                </div>
                <div className="flex items-center p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                    <div className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">4</div>
                    <div>
                        <h3 className="font-semibold">Classificados Invertidos</h3>
                        <p className="text-sm text-gray-600">Acerta os dois times que se classificaram, mas em posições invertidas.</p>
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
              Classificação Final do Torneio (Pontos CUMULATIVOS)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center p-3 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                <div className="bg-amber-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">50</div>
                <div>
                  <h3 className="font-semibold">Campeão</h3>
                  <p className="text-sm text-gray-600">Você acerta o time que será o Campeão.</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg border-l-4 border-gray-400">
                <div className="bg-gray-400 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">25</div>
                <div>
                  <h3 className="font-semibold">Vice-Campeão</h3>
                  <p className="text-sm text-gray-600">Você acerta o time que será o Vice-Campeão.</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-green-50 rounded-lg border-l-4 border-green-700">
                <div className="bg-green-700 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">15</div>
                <div>
                  <h3 className="font-semibold">Terceiro Lugar</h3>
                  <p className="text-sm text-gray-600">Você acerta o time que ficará em Terceiro Lugar.</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-red-50 rounded-lg border-l-4 border-red-600">
                <div className="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">10</div>
                <div>
                  <h3 className="font-semibold">Quarto Lugar</h3>
                  <p className="text-sm text-gray-600">Você acerta o time que ficará em Quarto Lugar.</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-blue-50 rounded-lg border-l-4 border-blue-600">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">20</div>
                <div>
                  <h3 className="font-semibold">Placar da Final</h3>
                  <p className="text-sm text-gray-600">Você acerta o placar exato da partida final.</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-700">
                <div className="bg-yellow-700 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4">+35</div>
                <div>
                  <h3 className="font-semibold">Bônus: Top 4 Exato</h3>
                  <p className="text-sm text-gray-600">Pontos adicionais por acertar Campeão, Vice, 3º e 4º na ordem exata.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Criterios;