// src/components/home/RankingTable.tsx
import React from 'react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import RankingRow from "@/components/ranking/RankingRow";
import useParticipantsRanking, { Participant } from "@/hooks/useParticipantsRanking";
import { Users as UsersIcon } from "lucide-react";
import { isAIParticipant } from '@/lib/utils'; // Ajuste o caminho se necessário

const RankingTable = () => {
  const { participants, loading, error } = useParticipantsRanking();

  const realParticipants = participants.filter(p => !isAIParticipant(p));
  const totalRealParticipants = realParticipants.length;

  const realUserRankMap = new Map<string, number>();
  realParticipants.forEach((p, idx) => {
    realUserRankMap.set(p.id, idx);
  });

  const renderCardHeader = () => (
    <CardHeader className="bg-fifa-blue text-white pb-4">
      <CardTitle>Ranking de Participantes</CardTitle>
      <CardDescription className="text-sm text-gray-300 pt-1">
        (Obs.: as IAs não serão consideradas para vencedores/perdedores)
      </CardDescription>
    </CardHeader>
  );

  if (loading) {
    // ... (código de loading)
    return (
        <Card className="shadow-lg">
          {renderCardHeader()}
          <CardContent className="p-4">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          </CardContent>
        </Card>
      );
  }

  if (error) {
    // ... (código de erro)
    return (
        <Card className="shadow-lg">
          <CardHeader className="bg-red-500 text-white">
            <CardTitle>Erro ao Carregar Ranking</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      );
  }

  return (
    <Card className="shadow-lg">
      {renderCardHeader()}
      <CardContent className="p-0">
        <div className="overflow-x-auto"> {/* Mantém a rolagem para segurança */}
          {participants.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500">
              <UsersIcon className="w-16 h-16 mb-4" />
              <p className="text-lg font-semibold">Nenhum participante encontrado ainda.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-gray-100">
                <TableRow>
                  <TableHead className="w-[50px] text-center">Posição</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Qtde Pontos</TableHead>
                  {/* Colunas visíveis apenas em telas médias (md) ou maiores */}
                  <TableHead className="hidden md:table-cell text-right">Jogos Pont.</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Acerto</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Prêmio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
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
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RankingTable;