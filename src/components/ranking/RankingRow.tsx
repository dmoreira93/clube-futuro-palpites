// src/components/ranking/RankingRow.tsx

import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Participant } from "@/hooks/useParticipantsRanking";

interface RankingRowProps {
  participant: Participant;
  index: number;
}

const RankingRow = ({ participant, index }: RankingRowProps) => {
  const isPrizeWinner = participant.prize?.includes("R$");

  return (
    <TableRow className={isPrizeWinner ? "bg-yellow-100 dark:bg-yellow-900/20" : ""}>
      {/* Posição */}
      <TableCell className="text-center font-medium">{participant.rank}º</TableCell>
      
      {/* Participante (Avatar + Nome) */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={participant.avatar_url || undefined} alt={participant.name} />
            <AvatarFallback>
              {participant.name ? participant.name.substring(0, 2).toUpperCase() : '??'}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{participant.name || "Usuário"}</div>
            {participant.username && (
              <div className="text-xs text-muted-foreground">@{participant.username}</div>
            )}
          </div>
        </div>
      </TableCell>
      
      {/* Pontos */}
      <TableCell className="text-center font-bold">{participant.points ?? 0}</TableCell>
      
      {/* Cravadas */}
      <TableCell className="text-center font-semibold text-blue-600">
        {participant.exactscores ?? 0}
      </TableCell>
      
      {/* Prêmio / Punição */}
      <TableCell className="text-right font-medium text-sm">
        {participant.prize || "-"}
      </TableCell>
    </TableRow>
  );
};

export default RankingRow;