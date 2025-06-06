// src/components/ranking/RankingRow.tsx
import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Participant } from "@/hooks/useParticipantsRanking";
import { isAIParticipant } from '@/lib/utils'; // Ajuste o caminho para o seu arquivo utils

interface RankingRowProps {
  participant: Participant;
  index: number;
  realUserRank: number;
  totalRealParticipants: number;
}

const getPrizeText = (
  isCurrentUserAI: boolean,
  realUserRank: number,
  totalRealUsers: number
): string => {
  if (isCurrentUserAI || realUserRank === -1 || totalRealUsers === 0) {
    return "";
  }
  if (realUserRank === 0) return "60%";
  if (realUserRank === 1 && totalRealUsers > 1) return "25%";
  if (realUserRank === 2 && totalRealUsers > 2) return "15%";
  if (totalRealUsers > 1 && realUserRank === totalRealUsers - 1) return "Paga um café da manhã";
  return "";
};

const RankingRow = ({
  participant,
  index,
  realUserRank,
  totalRealParticipants,
}: RankingRowProps) => {
  const isCurrentUserAI = isAIParticipant(participant);
  const prizeText = getPrizeText(isCurrentUserAI, realUserRank, totalRealParticipants);
  const isTopRealUser = !isCurrentUserAI && realUserRank !== -1 && realUserRank < 3;

  return (
    <TableRow className={isTopRealUser ? "bg-yellow-50" : ""}>
      <TableCell className="text-center font-medium">{index + 1}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={participant.avatar_url || undefined} alt={participant.name} />
            <AvatarFallback>{participant.name ? participant.name.substring(0, 2).toUpperCase() : '??'}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{participant.name}</div>
            <div className="text-xs text-gray-500">@{participant.username}</div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right">{participant.points}</TableCell>
      
      {/* Células visíveis apenas em telas médias (md) ou maiores */}
      <TableCell className="hidden md:table-cell text-right">{participant.matches}</TableCell>
      <TableCell className="hidden md:table-cell text-right">{participant.accuracy}</TableCell>
      <TableCell className="hidden md:table-cell text-right font-semibold">{prizeText}</TableCell>
    </TableRow>
  );
};

export default RankingRow;