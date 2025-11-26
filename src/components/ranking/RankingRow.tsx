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
      <TableCell className="text-center font-medium">{participant.rank}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={participant.avatar_url || undefined} alt={participant.name} />
            <AvatarFallback>{participant.name ? participant.name.substring(0, 2).toUpperCase() : '??'}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{participant.name}</div>
            <div className="text-xs text-muted-foreground">@{participant.username}</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right font-bold">{participant.points}</TableCell>
      
      {/* ALTERADO: De 'scored_matches' (Jogos) para 'exactscores' (Cravadas) */}
      <TableCell className="hidden md:table-cell text-right font-semibold text-blue-600">
        {participant.exactscores}
      </TableCell>
      
      <TableCell className="hidden md:table-cell text-right">{participant.accuracy}</TableCell>
      <TableCell className="hidden md:table-cell text-right font-semibold text-sm">{participant.prize}</TableCell>
    </TableRow>
  );
};

export default RankingRow;