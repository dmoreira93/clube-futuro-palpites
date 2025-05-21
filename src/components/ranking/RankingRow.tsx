// src/components/ranking/RankingRow.tsx

import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
// IMPORTANTE: Importar Participant de onde ele está exportado (nesse caso, do hook)
import { Participant } from "@/hooks/useParticipantsRanking"; // <--- CORRIGIDO AQUI!

type RankingRowProps = {
  participant: Participant;
  index: number;
};

const RankingRow = ({ participant, index }: RankingRowProps) => {
  return (
    <TableRow className={index < 3 ? "bg-yellow-50" : ""}>
      <TableCell className="font-medium text-center">
        {index === 0 ? (
          <span className="inline-flex items-center justify-center bg-fifa-gold text-white rounded-full w-6 h-6 text-xs font-bold">1</span>
        ) : index === 1 ? (
          <span className="inline-flex items-center justify-center bg-gray-300 text-gray-800 rounded-full w-6 h-6 text-xs font-bold">2</span>
        ) : index === 2 ? (
          <span className="inline-flex items-center justify-center bg-amber-700 text-white rounded-full w-6 h-6 text-xs font-bold">3</span>
        ) : (
          index + 1
        )}
      </TableCell>
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={participant.avatar_url} />
            <AvatarFallback>{participant.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          {participant.name}
        </div>
      </TableCell>
      {/* REMOVIDO: A CÉLULA ABAIXO QUE EXIBIA O APELIDO FOI REMOVIDA */}
      {/* <TableCell>{participant.nickname}</TableCell> */}
      <TableCell className="text-right font-bold">{participant.points}</TableCell>
      <TableCell className="text-right">{participant.matches}</TableCell>
      <TableCell className="text-right">{participant.accuracy}</TableCell>
    </TableRow>
  );
};

export default RankingRow;