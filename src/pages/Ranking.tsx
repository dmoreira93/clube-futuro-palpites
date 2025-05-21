// src/pages/Ranking.tsx (ou src/components/RankingDisplay.tsx)

import React from "react";
import Layout from "@/components/layout/Layout"; // Se for uma página, use seu Layout
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react"; // Ícone de carregamento
import useParticipantsRanking from "@/hooks/useParticipantsRanking"; // AJUSTE O CAMINHO CONFORME ONDE VOCÊ SALVOU O HOOK

const RankingPage = () => { // Renomeado para evitar conflito com 'Resultados'
  const { participants, loading, error } = useParticipantsRanking();

  return (
    <Layout>
      <div className="container mx-auto p-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8 text-fifa-blue">
          Ranking dos Participantes
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Erro!</strong>
            <span className="block sm:inline"> {error}</span>
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
              {participants.length === 0 ? (
                <p className="p-4 text-center text-gray-500">Nenhum participante encontrado no ranking.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Posição
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Participante
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pontos
                        </th>
                         <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Partidas Processadas
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acurácia
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {participants.map((participant, index) => (
                        <tr key={participant.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={participant.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${participant.name}`} alt={`${participant.name}'s avatar`} />
                                <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{participant.name}</div>
                                <div className="text-sm text-gray-500">@{participant.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-fifa-blue">
                            {participant.points}
                          </td>
                           <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                            {participant.matches}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-700">
                            {participant.accuracy}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default RankingPage;