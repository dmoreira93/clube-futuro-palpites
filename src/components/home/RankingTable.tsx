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
import { isAIParticipant } from '@/utils/utils'; // Ajuste o caminho se necessário

const RankingTable = () => {
  const { participants, loading, error } = useParticipantsRanking();

  // Filtra usuários reais e calcula seus ranks
  const realParticipants = participants.filter(p => !isAIParticipant(p));
  const totalRealParticipants = realParticipants.length;

  // Mapeia ID do usuário real para seu rank real (0-based)
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
        {participants.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <UsersIcon className="w-16 h-16 mb-4" />
            <p className="text-lg font-semibold">Nenhum participante encontrado ainda.</p>
            <p className="text-sm text-center">Peça para mais amigos se cadastrarem e fazerem seus palpites!</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead className="w-[50px] text-center">Pos</TableHead>
                <TableHead>Participante</TableHead>
                <TableHead className="text-right">Pontos</TableHead>
                <TableHead className="text-right">Jogos Pont.</TableHead>
                <TableHead className="text-right">Acerto</TableHead>
                <TableHead className="text-right">Prêmio</TableHead>
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
      </CardContent>
    </Card>
  );
};

export default RankingTable;