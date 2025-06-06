// src/pages/Ranking.tsx
import React from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import RankingRow from "@/components/ranking/RankingRow";
import useParticipantsRanking, { Participant } from "@/hooks/useParticipantsRanking";
import { Loader2 } from "lucide-react";
import { isAIParticipant } from '@/lib/utils'; // Ajuste o caminho se necessário

const RankingPage = () => {
  const { participants, loading, error } = useParticipantsRanking();

  const realParticipants = participants.filter(p => !isAIParticipant(p));
  const totalRealParticipants = realParticipants.length;

  const realUserRankMap = new Map<string, number>();
  realParticipants.forEach((p, idx) => {
    realUserRankMap.set(p.id, idx);
  });

  return (
    <Layout>
      <div className="container mx-auto p-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-2 text-fifa-blue">
          Ranking dos Participantes
        </h1>
        <p className="text-sm text-center text-gray-600 mb-8">
          (Obs.: as IAs não serão consideradas para vencedores/perdedores)
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Erro!</strong> <span className="block sm:inline">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-fifa-blue" />
            <p className="ml-2 text-gray-600">Carregando ranking...</p>
          </div>
        ) : (
          <Card className="shadow-lg">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-xl">Classificação Geral</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Posição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qtde Pontos
                      </th>
                      {/* Colunas visíveis apenas em telas médias (md) ou maiores */}
                      <th className="hidden md:table-cell px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Partidas Pont.
                      </th>
                      <th className="hidden md:table-cell px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acurácia
                      </th>
                      <th className="hidden md:table-cell px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prêmio
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {participants.map((participant, overallIndex) => {
                      const isAI = isAIParticipant(participant);
                      const realUserRank = isAI ? -1 : (realUserRankMap.get(participant.id) ?? -1);

                      return (
                        <RankingRow
                          key={participant.id}
                          participant={participant}
                          index={overallIndex}
                          realUserRank={realUserRank}
                          totalRealParticipants={totalRealParticipants}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default RankingPage;